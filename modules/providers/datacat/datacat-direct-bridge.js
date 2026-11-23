// The local companion opens a real signed-in Datacat tab; cl-helper remains the first transport.
import { normalizeDatacatExportRequest, validateDatacatExportPng,
    validateDatacatDownloadedSelection, requestDatacatBrowserExport } from './datacat-export-bridge.js';

export const DATACAT_DIRECT_PROTOCOL = 'cl-datacat-direct-v1';
const MAX_BASE64 = Math.ceil(32 * 1024 * 1024 / 3) * 4;

export function isDatacatDirectMessage(event, expected) {
    const data = event?.data;
    return event?.source === expected.window && event.origin === expected.origin
        && data?.protocol === DATACAT_DIRECT_PROTOCOL && data.direction === 'to-library'
        && data.nonce === expected.nonce && data.requestId === expected.requestId;
}

export function decodeDatacatDirectPng(encoded) {
    if (typeof encoded !== 'string' || encoded.length > MAX_BASE64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
        throw new Error('Datacat returned an invalid PNG or exceeded the 32 MB limit.');
    }
    const binary = atob(encoded);
    return validateDatacatExportPng(Uint8Array.from(binary, c => c.charCodeAt(0)).buffer);
}

function post(type, expected, metadata) {
    window.postMessage({ protocol: DATACAT_DIRECT_PROTOCOL, direction: 'to-companion', type,
        nonce: expected.nonce, requestId: expected.requestId, metadata }, expected.origin);
}

function discover(expected) {
    return new Promise(resolve => {
        const listener = event => {
            if (isDatacatDirectMessage(event, expected) && event.data.type === 'ready' && event.data.ready === true) done(true);
        };
        const done = found => { clearTimeout(timer); window.removeEventListener('message', listener); resolve(found); };
        const timer = setTimeout(() => done(false), 800);
        window.addEventListener('message', listener);
        post('ping', expected);
    });
}

export async function requestDatacatDirectExport(options) {
    const request = normalizeDatacatExportRequest(options);
    if (options.signal?.aborted) throw new DOMException('Datacat export cancelled.', 'AbortError');
    const random = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
    const expected = { window, origin: window.location.origin, nonce: random(), requestId: random() };
    if (!await discover(expected)) return requestDatacatBrowserExport({ ...options, directOnly: true });
    if (options.signal?.aborted) throw new DOMException('Datacat export cancelled.', 'AbortError');
    return new Promise((resolve, reject) => {
        let settled = false, decoding = false;
        const root = document.createElement('div');
        root.id = 'datacatDirectExportPanel';
        root.className = 'cl-modal visible';
        root.setAttribute('role', 'dialog');
        root.setAttribute('aria-modal', 'true');
        root.style.cssText = 'position:fixed;inset:0;z-index:100100;background:#000b;display:flex;align-items:center;justify-content:center';
        root.innerHTML = '<div style="max-width:540px;margin:16px;padding:24px;border:1px solid #777;border-radius:12px;background:var(--bg-primary,#17191f);color:var(--text-primary,#eee)"><h3>Download from Datacat</h3><p role="status" aria-live="polite"></p><button type="button" class="glass-btn">Cancel download</button></div>';
        const report = message => {
            root.querySelector('p').textContent = message;
            try { options.onStatus?.(message); } catch { /* Status callbacks cannot interrupt cleanup. */ }
        };
        const finish = (error, result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            post('cancel', expected);
            window.removeEventListener('message', listener);
            options.signal?.removeEventListener('abort', cancel);
            root.remove();
            if (error) reject(error); else resolve(result);
        };
        const cancel = () => finish(new DOMException('Datacat export cancelled.', 'AbortError'));
        const listener = async event => {
            if (settled || !isDatacatDirectMessage(event, expected)) return;
            const data = event.data;
            if (data.type === 'started' && data.error || data.type === 'error') {
                finish(Object.assign(new Error(String(data.error || data.message || 'Datacat download failed.').slice(0, 500)),
                    { code: data.code === 'creator_restricted' ? data.code : 'DATACAT_BRIDGE_EXPORT_FAILED' }));
            } else if (data.type === 'status') report(String(data.message || '').slice(0, 500));
            else if (data.type === 'card' && !decoding) {
                if (!['characterId', 'sourceKind', 'definitionSource', 'variantId'].every(key => data.metadata?.[key] === request[key])) return;
                decoding = true;
                try {
                    const imageBuffer = decodeDatacatDirectPng(data.pngBase64);
                    const { default: CoreAPI } = await import('../../core-api.js');
                    if (settled) return;
                    const card = CoreAPI.extractCharacterDataFromPng(imageBuffer);
                    if (card?.spec !== 'chara_card_v2' || typeof card.data?.name !== 'string') throw new Error('Datacat returned a PNG without a readable V2 card.');
                    // The tab-bound companion passes the explicit selection to Datacat's export API.
                    validateDatacatDownloadedSelection(card, request, true);
                    finish(null, { card, imageBuffer, definitionSource: request.definitionSource });
                } catch (error) { finish(error); }
            }
        };
        const timer = setTimeout(() => finish(new Error('Datacat download timed out. Click Import to retry.')), 10 * 60 * 1000);
        root.querySelector('button').addEventListener('click', cancel);
        document.body.append(root);
        window.registerOverlay?.({ id: root.id, tier: 1, close: cancel, visible: el => el.classList.contains('visible') });
        window.pushOverlayGuard?.();
        window.addEventListener('message', listener);
        options.signal?.addEventListener('abort', cancel, { once: true });
        report('Opening your signed-in Datacat tab. Complete verification there if requested; the full card returns automatically.');
        post('start', expected, request);
    });
}
