// MAIN world: call the site's export API, never read its account/token storage.
(() => {
    const protocol = 'cl-datacat-direct-v1';
    const nonce = new URLSearchParams(location.hash.slice(1)).get('cl-export');
    if (!/^[a-zA-Z0-9-]{16,128}$/.test(nonce || '')) return;
    let started = false;
    const send = (request, type, extra = {}) => window.postMessage({ protocol, direction: 'from-export',
        type, nonce, requestId: request.requestId, ...extra }, location.origin);
    window.addEventListener('message', async event => {
        const msg = event.data;
        if (event.source !== window || event.origin !== 'https://datacat.run' || msg?.protocol !== protocol
            || msg.direction !== 'to-export' || msg.type !== 'start' || msg.nonce !== nonce || started) return;
        const r = msg.metadata;
        if (!r || !/^[a-f0-9-]{36}$/i.test(r.characterId) || !['source', 'reimagination'].includes(r.definitionSource)) return;
        started = true;
        const dock = document.createElement('div');
        dock.id = 'cl-datacat-direct-status';
        dock.setAttribute('role', 'status');
        dock.style.cssText = 'position:fixed;bottom:12px;left:12px;right:12px;z-index:22000;padding:14px;border:1px solid #aaa;border-radius:10px;background:#171923;color:#fff;font:15px system-ui';
        dock.textContent = 'Character Library: preparing your download. Complete Datacat’s verification if requested.';
        document.body.append(dock);
        send(msg, 'status', { message: dock.textContent });
        try {
            let api;
            for (let attempt = 0; attempt < 1200; attempt++) {
                api = window.DatacatCharacterExport;
                const context = api?.getCurrentModalContext?.();
                if (typeof api?.buildPngPayload === 'function' && context?.characterId === r.characterId) break;
                api = null;
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            if (!api) throw new Error('Datacat could not open the selected character. Return to Character Library and retry Import.');
            const payload = await api.buildPngPayload(r.characterId, r.characterName, r.creatorName,
                r.variantId, r.sourceKind || null, { definitionSource: r.definitionSource });
            if (payload.metadata?.usedPlaceholder === true) throw new Error('Datacat could not download the real artwork. No incomplete card was imported.');
            const bytes = payload.pngBytes instanceof ArrayBuffer ? new Uint8Array(payload.pngBytes) : payload.pngBytes;
            if (!(bytes instanceof Uint8Array) || bytes.byteLength < 20 || bytes.byteLength > 32 * 1024 * 1024) throw new Error('Datacat returned an invalid PNG or exceeded the 32 MB limit.');
            let binary = '';
            for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
            send(msg, 'card', { pngBase64: btoa(binary) });
            dock.textContent = 'Download received. Returning the full card to Character Library…';
        } catch (error) {
            dock.textContent = error?.message || 'Datacat could not export this character.';
            send(msg, 'error', { message: dock.textContent, code: error?.creatorRedirectHandled ? 'creator_restricted' : undefined });
        }
    });
    window.postMessage({ protocol, direction: 'from-export', type: 'export-ready', nonce }, location.origin);
})();
