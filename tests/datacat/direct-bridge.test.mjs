import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const dir = new URL('../../extras/datacat-direct-companion/', import.meta.url);
const id = '11111111-2222-3333-4444-555555555555';
const nonce = 'a'.repeat(32), requestId = 'b'.repeat(32);
const metadata = { characterId: id, sourceKind: 'janitor', definitionSource: 'source', variantId: '', characterName: 'Example' };
const protocol = 'cl-datacat-direct-v1';
const libraryUrl = 'http://127.0.0.1:8000/scripts/extensions/third-party/SillyTavern-CharacterLibrary/app/library.html?csrf=local';
const librarySender = { tab: { id: 10 }, url: libraryUrl, frameId: 0 };

async function background(saved = []) {
    let handler, removed;
    const sends = [], opened = [], closed = [], writes = [];
    const chrome = {
        storage: { session: { get: async () => ({ jobs: structuredClone(saved) }), set: async data => writes.push(structuredClone(data)) } },
        runtime: { onMessage: { addListener: fn => { handler = fn; } } },
        tabs: {
            create: async data => { opened.push(data); return { id: 20 }; },
            sendMessage: async (tab, data) => { sends.push({ tab, data }); },
            remove: async tab => { closed.push(tab); },
            onRemoved: { addListener: fn => { removed = fn; } }, onUpdated: { addListener() {} },
        },
    };
    vm.runInNewContext(await readFile(new URL('background.js', dir), 'utf8'), { chrome, URL, Date, structuredClone });
    const send = (data, sender = librarySender) => new Promise(resolve => handler({ protocol, nonce, requestId, ...data }, sender, resolve));
    return { send, sends, opened, closed, writes, removed };
}

test('only the local Library page may open a selected export; only its exact Datacat tab may return it', async () => {
    const bg = await background();
    for (const url of ['https://evil.test/app/library.html', 'http://127.0.0.1:8000/other.html', 'http://127.0.0.1.evil.test/scripts/extensions/third-party/SillyTavern-CharacterLibrary/app/library.html']) {
        await bg.send({ type: 'start', metadata }, { ...librarySender, url });
    }
    assert.equal(bg.opened.length, 0);
    await bg.send({ type: 'start', metadata: { ...metadata, definitionSource: 'auto' } });
    assert.equal(bg.opened.length, 0);
    assert.equal((await bg.send({ type: 'start', metadata })).accepted, true);
    assert.equal(bg.opened[0].url, `https://datacat.run/characters/recent/janitor/${id}#cl-export=${nonce}`);
    const sender = { tab: { id: 20 }, url: bg.opened[0].url, frameId: 0 };
    const message = { type: 'card', pngBase64: 'AQID' };
    await bg.send(message, { ...sender, tab: { id: 21 } });
    await bg.send({ ...message, nonce: 'c'.repeat(32) }, sender);
    await bg.send(message, { ...sender, frameId: 1 });
    assert.equal(bg.sends.length, 0);
    await bg.send(message, sender);
    await bg.send(message, sender);
    assert.equal(bg.sends.length, 1);
    assert.equal(bg.sends[0].tab, 10);
    assert.equal(bg.sends[0].data.metadata.characterId, id);
    await bg.send({ type: 'cancel' });
    assert.deepEqual(bg.closed, [20]);
    await bg.send(message, sender);
    assert.equal(bg.sends.length, 1);
});

test('pending exports survive worker suspension; expired requests do not', async () => {
    const job = { libraryTab: 10, libraryUrl, datacatTab: 20, nonce, requestId, metadata, startedAt: Date.now() };
    const sender = { tab: { id: 20 }, url: `https://datacat.run/characters/recent/janitor/${id}`, frameId: 0 };
    const bg = await background([job]);
    assert.equal((await bg.send({ type: 'site-ready' }, sender)).metadata.definitionSource, 'source');
    const old = await background([{ ...job, startedAt: Date.now() - 11 * 60 * 1000 }]);
    assert.equal(await old.send({ type: 'site-ready' }, sender), undefined);
});

async function exporter(exportFn) {
    let listener;
    const sent = [], calls = [], docks = [];
    const window = {
        addEventListener: (_, fn) => { listener = fn; }, postMessage: data => sent.push(data),
        DatacatCharacterExport: { getCurrentModalContext: () => ({ characterId: id }),
            buildPngPayload: async (...args) => { calls.push(args); return exportFn(); } },
    };
    vm.runInNewContext(await readFile(new URL('export.js', dir), 'utf8'), {
        window, location: { origin: 'https://datacat.run', hash: `#cl-export=${nonce}` },
        document: { body: { append: dock => docks.push(dock) }, createElement: () => ({ setAttribute() {}, style: {} }) },
        URLSearchParams, ArrayBuffer, Uint8Array, btoa, setTimeout,
    });
    const start = overrides => listener({ source: window, origin: 'https://datacat.run', data: {
        protocol, direction: 'to-export', type: 'start', nonce, requestId, metadata, ...overrides,
    } });
    return { start, sent, calls };
}

test('the browser exporter preserves explicit selection and returns only official PNG bytes', async () => {
    const bytes = new Uint8Array(32); bytes[0] = 137;
    const e = await exporter(() => ({ pngBytes: bytes, metadata: { usedPlaceholder: false } }));
    await e.start({ nonce: 'wrong' });
    assert.equal(e.calls.length, 0);
    await e.start({ metadata: { ...metadata, definitionSource: 'reimagination', variantId: 'exact-variant' } });
    assert.equal(e.calls[0][0], id);
    assert.equal(e.calls[0][3], 'exact-variant');
    assert.equal(e.calls[0][5].definitionSource, 'reimagination');
    assert.equal(e.sent.find(x => x.type === 'card').pngBase64, Buffer.from(bytes).toString('base64'));
    assert.equal(e.calls[0][5].skipTurnstile, undefined);
    await e.start();
    assert.equal(e.calls.length, 1);
});

test('creator denials and placeholder artwork never become successful downloads', async () => {
    for (const exportFn of [
        () => { throw Object.assign(new Error('Creator redirect opened.'), { creatorRedirectHandled: true }); },
        () => ({ pngBytes: new Uint8Array(32), metadata: { usedPlaceholder: true } }),
    ]) {
        const e = await exporter(exportFn);
        await e.start();
        assert.equal(e.sent.some(x => x.type === 'card'), false);
        assert.equal(e.sent.at(-1).type, 'error');
    }
});

const bridgeText = await readFile(new URL('../../modules/providers/datacat/datacat-export-bridge.js', import.meta.url), 'utf8');
const bridge = await import(`data:text/javascript;base64,${Buffer.from(bridgeText).toString('base64')}`);
async function localPage(cardId = id) {
    const handlers = new Set(), posts = [], roots = [];
    const window = { location: { origin: 'http://127.0.0.1:8000' },
        addEventListener: (_, fn) => handlers.add(fn), removeEventListener: (_, fn) => handlers.delete(fn),
        postMessage(data) {
            posts.push(data);
            if (data.type === 'ping') queueMicrotask(() => deliver({ ...data, direction: 'to-library', type: 'ready', ready: true }));
        },
    };
    const deliver = async data => { for (const fn of [...handlers]) await fn({ source: window, origin: window.location.origin, data }); };
    const root = { style: {}, classList: { contains: () => true }, setAttribute() {}, remove() { this.removed = true; },
        querySelector: () => ({ addEventListener() {} }) };
    const context = { ...bridge, window, crypto, queueMicrotask, setTimeout, clearTimeout, Uint8Array, ArrayBuffer, atob, DOMException,
        document: { createElement: () => root, body: { append: value => roots.push(value) } },
        core: { extractCharacterDataFromPng: () => ({ spec: 'chara_card_v2', data: { name: 'Canonical',
            alternate_greetings: ['Alternate'], character_book: { entries: [{ content: 'Lore' }] },
            extensions: { datacat: { characterId: cardId, sourceKind: 'janitor' } } } }) },
    };
    let source = await readFile(new URL('../../modules/providers/datacat/datacat-direct-bridge.js', import.meta.url), 'utf8');
    source = source.replace(/^import[\s\S]*?;\r?\n/gm, '').replaceAll('export ', '')
        .replace("await import('../../core-api.js')", '({default:core})');
    vm.runInNewContext(`${source}\nthis.request = requestDatacatDirectExport;`, context);
    return { request: context.request, deliver, posts, root, handlers };
}

test('Library accepts a complete PNG only for its pending selection, then closes the companion job', async () => {
    const page = await localPage();
    const resultPromise = page.request(metadata);
    await new Promise(setImmediate);
    const start = page.posts.find(x => x.type === 'start');
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=', 'base64');
    const message = { ...start, direction: 'to-library', type: 'card', pngBase64: png.toString('base64') };
    await page.deliver({ ...message, nonce: 'wrong' });
    await page.deliver({ ...message, metadata: { ...metadata, definitionSource: 'reimagination' } });
    assert.equal(page.root.removed, undefined);
    await page.deliver(message);
    const result = await resultPromise;
    assert.deepEqual(Buffer.from(result.imageBuffer), png);
    assert.equal(result.card.data.character_book.entries[0].content, 'Lore');
    assert.equal(result.card.data.alternate_greetings[0], 'Alternate');
    assert.equal(page.root.removed, true);
    assert.equal(page.handlers.size, 0);
    assert.equal(page.posts.at(-1).type, 'cancel');
});

test('a wrong-character canonical PNG and a cancelled pending download cannot finish an import', async () => {
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=';
    const page = await localPage('99999999-2222-3333-4444-555555555555');
    const result = page.request(metadata);
    const rejected = assert.rejects(result, /this Datacat character/);
    await new Promise(setImmediate);
    await page.deliver({ ...page.posts.find(x => x.type === 'start'), direction: 'to-library', type: 'card', pngBase64 });
    await rejected;
    const cancelled = await localPage();
    const controller = new AbortController();
    const promise = cancelled.request({ ...metadata, signal: controller.signal });
    const abort = assert.rejects(promise, { name: 'AbortError' });
    await new Promise(setImmediate);
    const old = cancelled.posts.find(x => x.type === 'start');
    controller.abort();
    await cancelled.deliver({ ...old, direction: 'to-library', type: 'card', pngBase64 });
    await abort;
    assert.equal(cancelled.handlers.size, 0);
});
