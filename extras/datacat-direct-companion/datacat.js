(() => {
    const protocol = 'cl-datacat-direct-v1';
    const nonce = new URLSearchParams(location.hash.slice(1)).get('cl-export');
    if (!/^[a-zA-Z0-9-]{16,128}$/.test(nonce || '')) return;
    let request = null;
    window.addEventListener('message', event => {
        const msg = event.data;
        if (event.source !== window || event.origin !== 'https://datacat.run' || msg?.protocol !== protocol
            || msg.direction !== 'from-export' || msg.nonce !== nonce) return;
        if (msg.type === 'export-ready' && request) {
            window.postMessage({ ...request, protocol, direction: 'to-export', type: 'start' }, location.origin);
        } else if (request && msg.requestId === request.requestId && ['card', 'error', 'status'].includes(msg.type)) {
            void chrome.runtime.sendMessage(msg);
        }
    });
    chrome.runtime.sendMessage({ protocol, type: 'site-ready', nonce }).then(job => {
        if (!job?.metadata || job.nonce !== nonce) return;
        request = job;
        window.postMessage({ ...job, protocol, direction: 'to-export', type: 'start' }, location.origin);
    }).catch(() => {});
})();
