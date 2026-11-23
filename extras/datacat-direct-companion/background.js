// Tab-bound jobs survive MV3 worker suspension in session-only storage. No credentials.
const PROTOCOL = 'cl-datacat-direct-v1';
const jobs = new Map();
const UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const KEY = /^[a-zA-Z0-9-]{16,128}$/;
const MAX_BASE64 = Math.ceil(32 * 1024 * 1024 / 3) * 4;
const restored = chrome.storage.session.get('jobs').then(data => {
    for (const job of data.jobs || []) if (Date.now() - job.startedAt < 10 * 60 * 1000) jobs.set(job.libraryTab, job);
});
const saveJobs = () => chrome.storage.session.set({ jobs: [...jobs.values()] });

function isLibrary(url) {
    try {
        const u = new URL(url);
        return u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname)
            && u.pathname === '/scripts/extensions/third-party/SillyTavern-CharacterLibrary/app/library.html';
    } catch { return false; }
}

function validRequest(msg) {
    const r = msg.metadata;
    return KEY.test(msg.nonce) && KEY.test(msg.requestId) && r && UUID.test(r.characterId)
        && ['', 'janitor', 'saucepan', 'direct_upload'].includes(r.sourceKind)
        && ['source', 'reimagination'].includes(r.definitionSource)
        && !(r.sourceKind === 'direct_upload' && r.definitionSource === 'reimagination')
        && typeof r.variantId === 'string' && r.variantId.length <= 256 && !/[\x00-\x1f\x7f]/.test(r.variantId);
}

function emit(job, data) {
    return chrome.tabs.sendMessage(job.libraryTab, {
        protocol: PROTOCOL, nonce: job.nonce, requestId: job.requestId, metadata: job.metadata, ...data,
    }).catch(() => closeJob(job));
}

function closeJob(job) {
    if (jobs.get(job.libraryTab) !== job) return;
    jobs.delete(job.libraryTab);
    void saveJobs();
    if (job.datacatTab !== undefined) chrome.tabs.remove(job.datacatTab).catch(() => {});
}

async function handle(msg, sender) {
    await restored;
    if (msg?.protocol !== PROTOCOL || !sender.tab || sender.frameId !== 0) return;
    if (isLibrary(sender.url)) {
        if (msg.type === 'reset') {
            const old = jobs.get(sender.tab.id);
            if (old) closeJob(old);
            return;
        }
        if (msg.type === 'ping') return { ready: true, version: '1.0.0' };
        if (msg.type === 'start') {
            if (!validRequest(msg)) return { error: 'Invalid Datacat import selection.' };
            if (jobs.has(sender.tab.id)) return { error: 'A Datacat import is already running in this tab.' };
            const library = new URL(sender.url);
            const job = { libraryTab: sender.tab.id, libraryUrl: library.origin + library.pathname, nonce: msg.nonce,
                requestId: msg.requestId, metadata: structuredClone(msg.metadata), startedAt: Date.now() };
            jobs.set(sender.tab.id, job);
            const route = { janitor: 'janitor/', saucepan: 'sauce/', direct_upload: 'direct/' }[job.metadata.sourceKind] || '';
            try {
                const tab = await chrome.tabs.create({ active: true,
                    url: `https://datacat.run/characters/recent/${route}${job.metadata.characterId}#cl-export=${job.nonce}` });
                job.datacatTab = tab.id;
                await saveJobs();
                return { accepted: true };
            } catch {
                closeJob(job);
                return { error: 'Could not open the Datacat download tab.' };
            }
        }
        const job = jobs.get(sender.tab.id);
        if (job && msg.type === 'cancel' && msg.nonce === job.nonce && msg.requestId === job.requestId) closeJob(job);
        return;
    }
    let url;
    try { url = new URL(sender.url); } catch { return; }
    if (url.origin !== 'https://datacat.run') return;
    const job = [...jobs.values()].find(j => j.datacatTab === sender.tab.id && j.nonce === msg.nonce);
    if (!job) return;
    if (Date.now() - job.startedAt > 10 * 60 * 1000) { closeJob(job); return; }
    if (msg.type === 'site-ready') return { requestId: job.requestId, nonce: job.nonce, metadata: job.metadata };
    if (msg.requestId !== job.requestId) return;
    if (msg.type === 'card') {
        if (job.delivered || typeof msg.pngBase64 !== 'string' || msg.pngBase64.length > MAX_BASE64
            || !/^[A-Za-z0-9+/]+={0,2}$/.test(msg.pngBase64)) return;
        job.delivered = true;
        await saveJobs();
        await emit(job, { type: 'card', pngBase64: msg.pngBase64 });
    } else if (msg.type === 'status' || msg.type === 'error') {
        await emit(job, { type: msg.type, code: msg.code === 'creator_restricted' ? msg.code : undefined,
            message: String(msg.message || '').slice(0, 500) });
    }
}

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
    handle(msg, sender).then(reply, () => reply({ error: 'Datacat companion could not complete the request.' }));
    return true;
});
chrome.tabs.onRemoved.addListener(tabId => {
    void restored.then(() => {
    for (const job of jobs.values()) {
        if (job.libraryTab === tabId) closeJob(job);
        else if (job.datacatTab === tabId) {
            jobs.delete(job.libraryTab);
            void saveJobs();
            void emit(job, { type: 'error', message: 'Datacat download tab was closed. Click Import to retry.' });
        }
    }
    });
});
chrome.tabs.onUpdated.addListener((tabId, change) => {
    void restored.then(() => {
        const job = jobs.get(tabId);
        if (job && change.url) {
            try {
                const next = new URL(change.url);
                if (next.origin + next.pathname !== job.libraryUrl) closeJob(job);
            } catch { closeJob(job); }
        }
    });
});
