// Interactive Datacat export. Verification and account credentials stay on Datacat.
// The optional companion script only exports after a visible click in the frame.

export const DATACAT_EXPORT_ORIGIN = 'https://datacat.run';
export const DATACAT_EXPORT_MAX_BYTES = 32 * 1024 * 1024;
export const DATACAT_EXPORT_PROTOCOL = 'cl-datacat-export-v1';
const PANEL_ID = 'datacatExportPanel';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NONCE = /^[a-zA-Z0-9-]{16,128}$/;
const REQUEST_ID = /^[a-zA-Z0-9._:-]{1,128}$/;
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
let panel = null;
let activeRequest = null;

function bridgeError(code, message) {
    return Object.assign(new Error(message), { code });
}

function createHandshakeId() {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    // SillyTavern may be served over HTTP on a local network. randomUUID is
    // secure-context-only, but getRandomValues still supplies a secure nonce.
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function normalizeDatacatExportRequest(options = {}) {
    const characterId = String(options.characterId || '').trim().toLowerCase();
    if (!UUID.test(characterId)) throw bridgeError('DATACAT_BRIDGE_INVALID_REQUEST', 'A valid Datacat character ID is required.');
    const sourceKind = String(options.sourceKind || '').trim().toLowerCase();
    if (!['', 'janitor', 'saucepan', 'direct_upload'].includes(sourceKind)) {
        throw bridgeError('DATACAT_BRIDGE_INVALID_REQUEST', 'The Datacat character source is invalid.');
    }
    const definitionSource = options.definitionSource === undefined ? 'source' : options.definitionSource;
    if (!['source', 'reimagination'].includes(definitionSource)) {
        throw bridgeError('DATACAT_BRIDGE_INVALID_REQUEST', 'Choose Source or Reimagination for this export.');
    }
    if (sourceKind === 'direct_upload' && definitionSource === 'reimagination') {
        throw bridgeError('DATACAT_BRIDGE_INVALID_REQUEST', 'Datacat uploads use their source definition.');
    }
    const variantId = String(options.variantId || '').trim();
    if (variantId.length > 256 || /[\u0000-\u001f\u007f]/.test(variantId)) {
        throw bridgeError('DATACAT_BRIDGE_INVALID_REQUEST', 'The Datacat content variant is invalid.');
    }
    return {
        characterId, sourceKind, definitionSource, variantId,
        characterName: String(options.characterName || '').trim().slice(0, 256),
        creatorName: String(options.creatorName || '').trim().slice(0, 256),
    };
}

export function buildDatacatExportUrl(request, nonce, parentOrigin) {
    if (!NONCE.test(nonce)) throw bridgeError('DATACAT_BRIDGE_INVALID_REQUEST', 'Invalid export nonce.');
    const parent = new URL(parentOrigin);
    if (!['https:', 'http:'].includes(parent.protocol) || parent.origin !== parentOrigin) {
        throw bridgeError('DATACAT_BRIDGE_INVALID_REQUEST', 'Character Library must run on an HTTP or HTTPS origin.');
    }
    const source = { janitor: 'janitor', saucepan: 'sauce', direct_upload: 'direct' }[request.sourceKind];
    const url = new URL(`/characters/recent/${source ? `${source}/` : ''}${request.characterId}`, DATACAT_EXPORT_ORIGIN);
    url.searchParams.set('cl_datacat_export', '1');
    url.searchParams.set('cl_datacat_nonce', nonce);
    url.searchParams.set('cl_datacat_parent', parentOrigin);
    return url.href;
}

/** Messages from another window/request are ignored, never allowed to settle a request. */
export function isDatacatExportMessage(event, expected) {
    const data = event?.data;
    if (event?.origin !== DATACAT_EXPORT_ORIGIN || event?.source !== expected.frameWindow || !data || typeof data !== 'object') return false;
    if (data.protocol !== DATACAT_EXPORT_PROTOCOL || data.nonce !== expected.nonce || !NONCE.test(data.nonce)) return false;
    if (data.requestId !== expected.requestId || !REQUEST_ID.test(data.requestId)) return false;
    const metadata = data.metadata;
    return !!metadata && ['characterId', 'sourceKind', 'definitionSource', 'variantId'].every(key => metadata[key] === expected.request[key]);
}

export function validateDatacatExportPng(value) {
    if (!(value instanceof ArrayBuffer) || value.byteLength < 20 || value.byteLength > DATACAT_EXPORT_MAX_BYTES) {
        throw bridgeError('DATACAT_BRIDGE_INVALID_PNG', 'Datacat returned an invalid PNG, or the card exceeds the 32 MB limit.');
    }
    const bytes = new Uint8Array(value);
    if (!PNG_SIGNATURE.every((byte, i) => bytes[i] === byte)) throw bridgeError('DATACAT_BRIDGE_INVALID_PNG', 'Datacat did not return a PNG card.');
    // Validate chunk bounds before handing untrusted binary data to the shared decoder.
    const view = new DataView(value);
    let offset = 8;
    let ended = false;
    while (offset + 12 <= bytes.length) {
        const length = view.getUint32(offset, false);
        if (length > bytes.length - offset - 12) throw bridgeError('DATACAT_BRIDGE_INVALID_PNG', 'The Datacat PNG is truncated.');
        const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
        if (offset === 8 && (type !== 'IHDR' || length !== 13 || !view.getUint32(16, false) || !view.getUint32(20, false))) {
            throw bridgeError('DATACAT_BRIDGE_INVALID_PNG', 'The Datacat PNG has no valid image header.');
        }
        offset += length + 12;
        if (type === 'IEND') { ended = length === 0 && offset === bytes.length; break; }
    }
    if (!ended) throw bridgeError('DATACAT_BRIDGE_INVALID_PNG', 'The Datacat PNG is incomplete.');
    return value;
}

function abortError(panelClosed = false) {
    return Object.assign(new DOMException('Datacat export cancelled.', 'AbortError'), { codeName: 'DATACAT_BRIDGE_CANCELLED', panelClosed });
}

export function validateDatacatDownloadedSelection(card, request, confirmUnmarkedSelection = false) {
    const link = card?.data?.extensions?.datacat;
    if (String(link?.id || link?.characterId || link?.character_id || '').toLowerCase() !== request.characterId) {
        throw bridgeError('DATACAT_BRIDGE_SELECTION_MISMATCH', 'Choose the PNG downloaded for this Datacat character.');
    }
    const definition = link?.definitionSource || link?.definition_source;
    const variant = link?.variantId || link?.variant_id;
    if (definition && definition !== request.definitionSource
        || request.variantId && variant && String(variant) !== request.variantId) {
        throw bridgeError('DATACAT_BRIDGE_SELECTION_MISMATCH', 'The PNG identifies a different definition or version. Choose the matching Datacat export.');
    }
    const source = String(link?.sourceKind || link?.source_kind || link?.source || '').toLowerCase();
    const aliases = { janitorai: 'janitor', janitor_core: 'janitor', sauce: 'saucepan', direct: 'direct_upload' };
    if (request.sourceKind && (aliases[source] || source) !== request.sourceKind) {
        throw bridgeError('DATACAT_BRIDGE_SELECTION_MISMATCH', 'The PNG belongs to a different Datacat source.');
    }
    // Official PNG exports can omit selection stamps. Require an explicit file-choice confirmation instead of guessing.
    if ((!definition || request.variantId && !variant) && !confirmUnmarkedSelection) {
        throw bridgeError('DATACAT_BRIDGE_SELECTION_UNMARKED', 'This PNG omits its definition/version marker. Confirm that you downloaded the selected definition and version, then choose the PNG again.');
    }
}

function removePanel() {
    panel?.root.remove();
    panel = null;
}

export function closeDatacatExportPanel() {
    activeRequest?.cancel(true);
    removePanel();
}

function ensurePanel() {
    if (panel?.root.isConnected) return panel;
    if (!document.getElementById('datacatExportStyles')) {
        const style = document.createElement('style');
        style.id = 'datacatExportStyles';
        style.textContent = `
            #${PANEL_ID}{z-index:100100;padding:12px;background:#000b;position:fixed;inset:0;display:flex;align-items:center;justify-content:center}
            #${PANEL_ID} .dc-export-content{width:min(1200px,100%);height:min(900px,94dvh);background:var(--bg-primary,#17191f);color:var(--text-primary,#eee);border:1px solid var(--border-color,#555);border-radius:12px;display:flex;flex-direction:column;overflow:hidden}
            #${PANEL_ID} .dc-export-header,#${PANEL_ID} .dc-export-footer{display:flex;gap:12px;align-items:center;padding:10px 14px;flex-shrink:0;flex-wrap:wrap}
            #${PANEL_ID} .dc-export-title{margin:0;flex:1;font-size:1.1rem}
            #${PANEL_ID} .dc-export-status{margin:0;flex:1;min-width:180px;font-size:.9rem}
            #${PANEL_ID} iframe{width:100%;flex:1;min-height:0;border:0;background:#111}
            #${PANEL_ID} .dc-export-help{padding:0 14px 10px;margin:0;font-size:.85rem}
            #${PANEL_ID} .dc-export-help a{color:var(--accent,#b7a7ff)}
            @media(max-width:600px){#${PANEL_ID}{padding:0}#${PANEL_ID} .dc-export-content{height:100dvh;border-radius:0}}
        `;
        document.head.append(style);
    }
    const root = document.createElement('div');
    root.id = PANEL_ID;
    root.className = 'cl-modal visible';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'datacatExportTitle');
    root.innerHTML = `<div class="dc-export-content">
        <div class="dc-export-header"><h3 id="datacatExportTitle" class="dc-export-title">Export from Datacat</h3><button type="button" class="glass-btn dc-export-close" aria-label="Cancel and close Datacat export">Close</button></div>
        <p class="dc-export-help">Use the companion inside Datacat, or <a class="dc-export-open" target="_blank" rel="noopener noreferrer">open Datacat in your signed-in tab</a>, download the selected definition as PNG with “Embed lorebook” checked, then choose that PNG below. Complete Datacat's verification there. <a class="dc-export-install" target="_blank" rel="noopener noreferrer">Optional companion userscript</a>.</p>
        <label class="dc-export-help"><input class="dc-export-confirm" type="checkbox"> <span class="dc-export-confirm-label"></span> Only needed when the PNG omits its selection marker.</label>
        <iframe title="Datacat character export" referrerpolicy="no-referrer" sandbox="allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>
        <div class="dc-export-footer"><p class="dc-export-status" role="status" aria-live="polite"></p><label class="glass-btn">Choose downloaded PNG<input class="dc-export-file" type="file" accept=".png,image/png" aria-label="Choose downloaded Datacat PNG"></label><button type="button" class="glass-btn dc-export-reload">Reload</button><button type="button" class="glass-btn dc-export-cancel">Cancel character</button></div>
    </div>`;
    root.querySelector('.dc-export-install').href = new URL('../../../extras/cl-datacat-bridge.user.js', import.meta.url).href;
    root.querySelector('.dc-export-close').addEventListener('click', closeDatacatExportPanel);
    root.querySelector('.dc-export-cancel').addEventListener('click', () => activeRequest?.cancel(false));
    root.querySelector('.dc-export-reload').addEventListener('click', () => activeRequest?.reload());
    root.querySelector('.dc-export-file').addEventListener('change', event => activeRequest?.loadFile(event.target));
    document.body.append(root);
    panel = { root, frame: root.querySelector('iframe'), status: root.querySelector('.dc-export-status'), title: root.querySelector('h3') };
    window.registerOverlay?.({ id: PANEL_ID, tier: 1, close: closeDatacatExportPanel, visible: el => el.classList.contains('visible') });
    // This dynamically inserted panel is already visible when the mobile observer sees it.
    window.pushOverlayGuard?.();
    root.querySelector('.dc-export-close').focus();
    return panel;
}

/** One interactive request at a time; bulk callers may reuse the panel serially. */
export async function requestDatacatBrowserExport(options) {
    const request = normalizeDatacatExportRequest(options);
    if (options.signal?.aborted) throw abortError();
    if (activeRequest) throw bridgeError('DATACAT_BRIDGE_BUSY', 'Another Datacat export is already open.');
    let nonce = createHandshakeId();
    let requestId = createHandshakeId();
    let url = buildDatacatExportUrl(request, nonce, window.location.origin);
    const currentPanel = ensurePanel();
    currentPanel.frame.hidden = options.directOnly === true;
    if (options.directOnly) {
        const help = currentPanel.root.querySelector('.dc-export-help');
        help.innerHTML = 'Automatic download needs the <a href="../../../extras/datacat-direct-companion/README.html" target="_blank" rel="noopener noreferrer">Datacat Direct Import companion</a> enabled in Chrome. Install it once, reload Library, and click Import again. You can also <a class="dc-export-open" target="_blank" rel="noopener noreferrer">open this card on Datacat</a> and use the PNG fallback below.';
        help.querySelector('a').href = new URL('../../../extras/datacat-direct-companion/README.html', import.meta.url).href;
        currentPanel.frame.style.display = 'none';
        currentPanel.root.querySelector('.dc-export-content').style.height = 'auto';
        currentPanel.root.querySelector('.dc-export-reload').textContent = 'Reload Library';
    }
    const browserUrl = new URL(url);
    browserUrl.search = '';
    currentPanel.root.querySelector('.dc-export-open').href = browserUrl.href;
    currentPanel.title.textContent = `${request.characterName || 'Character'} — ${request.definitionSource === 'source' ? 'Source' : 'Reimagination'}`;
    currentPanel.root.querySelector('.dc-export-confirm').checked = false;
    currentPanel.root.querySelector('.dc-export-confirm-label').textContent = `I downloaded the selected ${request.definitionSource === 'source' ? 'Source' : 'Reimagination'} definition${request.variantId ? `, version ${request.variantId}` : ''}, from Datacat.`;
    return new Promise((resolve, reject) => {
        let settled = false;
        let ready = false;
        let decoding = false;
        let heartbeat;
        let diagnostic;
        let timeout;
        const expected = { nonce, requestId, request, frameWindow: currentPanel.frame.contentWindow };
        const report = message => {
            currentPanel.status.textContent = message;
            try { options.onStatus?.(message); } catch { /* UI callback must not break cleanup. */ }
        };
        const post = type => currentPanel.frame.contentWindow?.postMessage({
            protocol: DATACAT_EXPORT_PROTOCOL, type, nonce, requestId, metadata: request,
        }, DATACAT_EXPORT_ORIGIN);
        const armDiagnostic = () => {
            clearTimeout(diagnostic);
            diagnostic = setTimeout(() => {
                if (!ready) report('Companion not detected. Use the signed-in Datacat link above, download PNG with Embed lorebook checked, then choose the downloaded PNG here.');
            }, 15000);
        };
        const finish = (error, result, panelClosed = false) => {
            if (settled) return;
            settled = true;
            post('cancel');
            clearInterval(heartbeat);
            clearTimeout(diagnostic);
            clearTimeout(timeout);
            window.removeEventListener('message', onMessage);
            currentPanel.frame.removeEventListener('load', onLoad);
            options.signal?.removeEventListener('abort', onAbort);
            activeRequest = null;
            if (!options.reusePanel || panelClosed) removePanel();
            else report(error ? error.message : 'Export received. Preparing the next character…');
            if (error) reject(error); else resolve(result);
        };
        const onAbort = () => finish(abortError(), null);
        const onLoad = () => {
            if (settled) return;
            ready = false;
            expected.frameWindow = currentPanel.frame.contentWindow;
            armDiagnostic();
            post('init');
        };
        const decodePng = async value => {
            const imageBuffer = validateDatacatExportPng(value);
            const { default: CoreAPI } = await import('../../core-api.js');
            const card = CoreAPI.extractCharacterDataFromPng(imageBuffer);
            if (card?.spec !== 'chara_card_v2' || !card.data || typeof card.data !== 'object'
                || Array.isArray(card.data) || typeof card.data.name !== 'string') {
                throw bridgeError('DATACAT_BRIDGE_INVALID_CARD', 'The Datacat PNG contains no readable V2 character card.');
            }
            return { card, imageBuffer, definitionSource: request.definitionSource };
        };
        const onMessage = async event => {
            if (settled || !isDatacatExportMessage(event, expected)) return;
            const data = event.data;
            if (data.type === 'ready') {
                ready = true;
                clearTimeout(diagnostic);
                report('Ready. Click “Export to Character Library” inside Datacat to continue.');
            } else if (data.type === 'status') {
                report(String(data.message || 'Datacat is preparing your export.').slice(0, 500));
            } else if (data.type === 'cancelled') {
                finish(abortError(), null);
            } else if (data.type === 'error') {
                const code = data.code === 'creator_restricted' ? data.code : 'DATACAT_BRIDGE_EXPORT_FAILED';
                finish(bridgeError(code, String(data.message || 'Datacat could not export this card.').slice(0, 500)));
            } else if (data.type === 'card' && !decoding) {
                decoding = true;
                try {
                    // Use the PNG's canonical card rather than trusting a separate JSON envelope.
                    finish(null, await decodePng(data.png));
                } catch (error) { finish(error); }
            }
        };
        activeRequest = {
            cancel: panelClosed => finish(abortError(panelClosed), null, panelClosed),
            loadFile: async input => {
                const file = input.files?.[0];
                if (!file || settled || decoding) return;
                decoding = true;
                try {
                    if (file.size > DATACAT_EXPORT_MAX_BYTES) throw bridgeError('DATACAT_BRIDGE_INVALID_PNG', 'The PNG exceeds the 32 MB limit.');
                    const result = await decodePng(await file.arrayBuffer());
                    validateDatacatDownloadedSelection(result.card, request, currentPanel.root.querySelector('.dc-export-confirm').checked === true);
                    finish(null, result);
                } catch (error) {
                    if (!settled) report(error.message || 'Could not read this PNG.');
                } finally { decoding = false; input.value = ''; }
            },
            reload: () => {
                if (decoding || settled) return;
                if (options.directOnly) {
                    finish(abortError(), null);
                    window.location.reload();
                    return;
                }
                post('cancel');
                // A reload abandons the old page's export, including replies
                // already queued by an unfinished verification or PNG build.
                nonce = createHandshakeId();
                requestId = createHandshakeId();
                url = buildDatacatExportUrl(request, nonce, window.location.origin);
                expected.nonce = nonce;
                expected.requestId = requestId;
                ready = false;
                armDiagnostic();
                report('Reloading Datacat. Waiting for the companion userscript…');
                currentPanel.frame.src = url;
            },
        };
        window.addEventListener('message', onMessage);
        currentPanel.frame.addEventListener('load', onLoad);
        options.signal?.addEventListener('abort', onAbort, { once: true });
        if (!options.directOnly) {
            heartbeat = setInterval(() => { if (!ready) post('init'); }, 1500);
            armDiagnostic();
        }
        timeout = setTimeout(() => finish(bridgeError('DATACAT_BRIDGE_TIMEOUT', 'Datacat export timed out. Reopen the export to try again.')), 10 * 60 * 1000);
        report(options.directOnly ? 'Enable the Direct Import companion, reload Library, then retry Import. No Datacat account credentials are shared.' : 'Opening Datacat. Waiting for the companion userscript…');
        if (!options.directOnly) currentPanel.frame.src = url;
    });
}
