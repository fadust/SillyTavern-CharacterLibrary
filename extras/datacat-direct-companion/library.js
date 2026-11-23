(() => {
    const protocol = 'cl-datacat-direct-v1';
    void chrome.runtime.sendMessage({ protocol, type: 'reset' }).catch(() => {});
    window.addEventListener('message', async event => {
        const msg = event.data;
        if (event.source !== window || event.origin !== location.origin || msg?.protocol !== protocol
            || msg.direction !== 'to-companion' || !['ping', 'start', 'cancel'].includes(msg.type)) return;
        try {
            const result = await chrome.runtime.sendMessage(msg);
            if (msg.type !== 'cancel') window.postMessage({ protocol, direction: 'to-library', type: msg.type === 'ping' ? 'ready' : 'started',
                nonce: msg.nonce, requestId: msg.requestId, ...result }, location.origin);
        } catch {
            window.postMessage({ protocol, direction: 'to-library', type: 'error', nonce: msg.nonce,
                requestId: msg.requestId, message: 'Reload Character Library after enabling the Datacat companion.' }, location.origin);
        }
    });
    chrome.runtime.onMessage.addListener(msg => {
        if (msg?.protocol === protocol) window.postMessage({ ...msg, direction: 'to-library' }, location.origin);
    });
})();
