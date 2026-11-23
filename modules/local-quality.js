// Local-only enhancements. Native ST tags never become embedded card tags.
const TOKEN_FIELDS = ['description', 'personality', 'scenario', 'first_mes', 'system_prompt'];

export function tokenText(card) {
    const data = card.data || card;
    return TOKEN_FIELDS.map(key => String(data[key] ?? card[key] ?? '')).filter(Boolean).join('\n\n');
}

export function tokenizerProfile(ctx) {
    const chat = ctx?.chatCompletionSettings || {};
    const text = ctx?.textCompletionSettings || {};
    const models = Object.entries(chat).filter(([key, value]) => /(?:_model|_source)$/.test(key)
        && ['string', 'number', 'boolean'].includes(typeof value)).sort(([a], [b]) => a.localeCompare(b));
    return JSON.stringify([ctx?.mainApi, ctx?.powerUserSettings?.tokenizer, models, text.type, text.model]);
}

export function nativeTags(ctx, avatar) {
    const ids = new Set(ctx?.tagMap?.[avatar] || []);
    return (ctx?.tags || []).filter(tag => ids.has(tag.id));
}

export function saveNativeTags(ctx, avatar, baseline, selected) {
    if (!ctx?.characters?.some(char => char.avatar === avatar) || !ctx.tagMap || !Array.isArray(ctx.tags)
        || typeof ctx.saveSettingsDebounced !== 'function') throw new Error('The SillyTavern character is no longer available.');
    const current = ctx.tagMap[avatar] || [];
    if (JSON.stringify([...current].sort()) !== JSON.stringify([...baseline].sort())) {
        throw new Error('ST tags changed while this editor was open. Reopen it before saving.');
    }
    const known = new Set(ctx.tags.map(tag => tag.id));
    if (selected.some(id => !known.has(id))) throw new Error('An ST tag was removed. Reopen this editor.');
    ctx.tagMap[avatar] = [...new Set(selected)];
    ctx.saveSettingsDebounced();
}

// One bounded queue serves deep indexing and visible-card tokenization. Full cards
// are transient; only normalized search strings and content/profile counts survive.
export function createCardIndex({ fetchCard, getContext, deepEnabled, onUpdate }) {
    const records = new Map(), revisions = new Map(), jobs = new Map(), counts = new Map();
    const queue = [];
    let running = 0;
    const revision = avatar => revisions.get(avatar) || 0;
    function request(avatar, tokens = false) {
        const profile = tokenizerProfile(getContext());
        const record = records.get(avatar);
        if ((!tokens || record?.profile === profile && record?.count != null)
            && (!deepEnabled() || record?.definition != null)) return Promise.resolve(record);
        const key = `${avatar}:${tokens}:${profile}:${revision(avatar)}`;
        if (jobs.has(key)) return jobs.get(key);
        const promise = new Promise(resolve => {
            const job = { avatar, tokens, profile, rev: revision(avatar), resolve, key };
            if (tokens) queue.unshift(job); else queue.push(job);
        });
        jobs.set(key, promise);
        pump();
        return promise;
    }
    function pump() {
        while (running < 2 && queue.length) {
            const job = queue.shift();
            if (!job.tokens && !deepEnabled() || job.rev !== revision(job.avatar)) {
                jobs.delete(job.key); job.resolve(); continue;
            }
            running++;
            run(job).catch(() => {}).finally(() => {
                running--; jobs.delete(job.key); job.resolve(records.get(job.avatar)); pump();
            });
        }
    }
    async function run(job) {
        const card = await fetchCard(job.avatar);
        if (job.rev !== revision(job.avatar)) return;
        const data = card.data || card;
        const next = { ...records.get(job.avatar) };
        if (deepEnabled()) {
            next.definition = [data.description, data.personality].filter(Boolean).join('\n').toLowerCase();
            next.greetings = [data.first_mes, ...(data.alternate_greetings || [])].filter(value => typeof value === 'string').join('\n').toLowerCase();
        }
        if (job.tokens && typeof getContext()?.getTokenCountAsync === 'function') {
            const text = tokenText(card);
            const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), b => b.toString(16).padStart(2, '0')).join('');
            const key = `${job.profile}:${hash}`;
            const count = counts.has(key) ? counts.get(key) : await getContext().getTokenCountAsync(text);
            if (job.rev !== revision(job.avatar) || job.profile !== tokenizerProfile(getContext())) return;
            if (!Number.isFinite(count) || count < 0) throw new Error('Tokenizer unavailable');
            counts.set(key, count);
            if (counts.size > 256) counts.delete(counts.keys().next().value);
            Object.assign(next, { profile: job.profile, count, signature: hash });
        }
        if (job.rev !== revision(job.avatar)) return;
        if (!deepEnabled()) { delete next.definition; delete next.greetings; }
        records.set(job.avatar, next);
        onUpdate(job.avatar);
    }
    return {
        request, get: avatar => records.get(avatar),
        invalidate(avatar) { revisions.set(avatar, revision(avatar) + 1); records.delete(avatar); },
        clearSearch() { for (const record of records.values()) { delete record.definition; delete record.greetings; } },
    };
}

let index, initialized = false, refreshTimer, indexGeneration = 0;
const visibleCards = new Set();
const $ = id => document.getElementById(id);
const context = () => window.getSTContext?.();
const deepEnabled = () => !!($('searchDefinition')?.checked || $('searchFirstMessage')?.checked);

function tagChip(tag) {
    const chip = document.createElement('span');
    chip.className = 'quality-native-tag';
    let emoji = '';
    try {
        const bridge = window.getHostWindow?.()?.__tagmojisBridge;
        if (bridge && (typeof bridge.isActive !== 'function' || bridge.isActive())) emoji = bridge.getEmojiForTag?.(String(tag.id)) || '';
    } catch { /* Tagmojis is optional. */ }
    chip.textContent = `${emoji ? `${emoji} ` : ''}${tag.name}`;
    chip.title = `SillyTavern tag: ${tag.name}`;
    if (tag.color && CSS.supports('color', tag.color)) chip.style.backgroundColor = tag.color;
    if (tag.color2 && CSS.supports('color', tag.color2)) chip.style.color = tag.color2;
    return chip;
}

function paintCard(card) {
    const avatar = card.dataset.avatar;
    if (!avatar) return;
    let tags = card.querySelector('.quality-native-tags');
    if (!tags) {
        tags = document.createElement('div'); tags.className = 'quality-native-tags';
        card.querySelector('.card-overlay')?.append(tags);
    }
    const assigned = nativeTags(context(), avatar).filter(tag => !tag.is_hidden_on_character_card);
    tags.replaceChildren(...assigned.slice(0, 3).map(tagChip));
    if (assigned.length > 3) {
        const more = document.createElement('span'); more.textContent = `+${assigned.length - 3}`; tags.append(more);
    }
    let badge = card.querySelector('.quality-token-count');
    if (!badge) { badge = document.createElement('span'); badge.className = 'quality-token-count'; card.append(badge); }
    badge.hidden = window.getSetting?.('nativeTokenCounts') === false;
    const record = index.get(avatar), char = window.getCharacterByAvatar?.(avatar);
    const exact = record?.profile === tokenizerProfile(context()) && record?.count != null;
    badge.textContent = exact ? `${record.count.toLocaleString()} tokens` : `~${char?._tokenEstimate?.toLocaleString() ?? '?'} tokens`;
    badge.title = exact ? 'ST tokenizer: definition, personality, scenario, first message and system prompt. Not the full chat prompt.' : 'Character text estimate; exact tokenizer count unavailable or pending.';
}

function refreshVisible() {
    for (const card of visibleCards) {
        if (!card.isConnected) { visibleCards.delete(card); continue; }
        paintCard(card);
        if (window.getSetting?.('nativeTokenCounts') !== false) index.request(card.dataset.avatar, true);
    }
}

function updateDetailTags() {
    const char = window.getActiveChar?.();
    if (!char || !$('qualityDetailTags')) return;
    $('qualityDetailTags').replaceChildren(...nativeTags(context(), char.avatar).map(tagChip));
}

function editNativeTags() {
    const char = window.getActiveChar?.(), ctx = context();
    if (!char || !ctx?.tagMap || !Array.isArray(ctx.tags)) return window.showToast?.('Open this library from SillyTavern to edit ST tags.', 'warning');
    const avatar = char.avatar, baseline = [...(ctx.tagMap[avatar] || [])];
    const root = $('qualityTagEditor');
    const list = root.querySelector('.quality-tag-list');
    list.replaceChildren();
    root.querySelector('h3').textContent = `SillyTavern tags — ${char.name}`;
    root.querySelector('input[type=search]').value = '';
    for (const tag of [...ctx.tags].sort((a, b) => a.name.localeCompare(b.name))) {
        const label = document.createElement('label'), input = document.createElement('input');
        input.type = 'checkbox'; input.value = tag.id; input.checked = baseline.includes(tag.id);
        label.dataset.name = tag.name.toLowerCase(); label.append(input, tagChip(tag)); list.append(label);
    }
    root.querySelector('[data-save]').onclick = async () => {
        try {
            saveNativeTags(context(), avatar, baseline, [...list.querySelectorAll('input:checked')].map(input => input.value));
            closeTagEditor();
            await window.fetchCharacters?.();
            updateDetailTags(); refreshVisible();
            window.showToast?.('SillyTavern tags saved', 'success');
        } catch (error) { root.querySelector('[role=status]').textContent = error.message; }
    };
    root.querySelector('[role=status]').textContent = '';
    root.classList.add('visible'); root.hidden = false;
    window.pushOverlayGuard?.(); root.querySelector('input[type=search]').focus();
}

function closeTagEditor() {
    const root = $('qualityTagEditor'); root.classList.remove('visible'); root.hidden = true;
    $('qualityEditTags')?.focus();
}

function scheduleSearch() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => window.performSearch?.(), 150);
}

async function buildSearchIndex() {
    const generation = ++indexGeneration;
    if (!deepEnabled()) { index.clearSearch(); $('qualitySearchStatus').textContent = ''; window.performSearch?.(); return; }
    const chars = [...(window.getAllCharacters?.() || [])];
    let done = 0;
    $('qualitySearchStatus').textContent = `Indexing 0/${chars.length} cards…`;
    await Promise.all(chars.map(async char => {
        if (generation !== indexGeneration || !deepEnabled()) return;
        await index.request(char.avatar);
        if (generation === indexGeneration) $('qualitySearchStatus').textContent = `Indexing ${++done}/${chars.length} cards…`;
    }));
    if (generation === indexGeneration) {
        const missing = chars.filter(char => index.get(char.avatar)?.definition == null).length;
        $('qualitySearchStatus').textContent = missing ? `${missing} cards unavailable. Toggle deep search to retry.` : `${chars.length} cards indexed`;
        window.performSearch?.();
    }
}

function followTheme() {
    $('qualityHostTheme')?.remove();
    if (!window.getSetting?.('followSTTheme')) return;
    const host = window.getHostWindow?.();
    if (!host) return;
    const computed = host.getComputedStyle(host.document.body);
    const mapping = { '--SmartThemeBlurTintColor': ['--bg-primary', '--bg-secondary', '--glass-bg', '--modal-bg'],
        '--SmartThemeBodyColor': ['--text-primary'], '--SmartThemeEmColor': ['--text-secondary'],
        '--SmartThemeQuoteColor': ['--accent'], '--SmartThemeBorderColor': ['--glass-border'] };
    const rules = [];
    for (const [source, targets] of Object.entries(mapping)) {
        const value = computed.getPropertyValue(source).trim();
        if (value && CSS.supports('color', value)) for (const target of targets) rules.push(`${target}:${value}!important`);
    }
    const style = document.createElement('style'); style.id = 'qualityHostTheme';
    style.textContent = `:root{${rules.join(';')}}`;
    // CSSOM assignment safely handles quoted/custom font family names.
    document.head.append(style);
    style.sheet.insertRule('body{}', 1);
    style.sheet.cssRules[1].style.setProperty('font-family', computed.fontFamily, 'important');
}

export function invalidate(avatar) {
    index?.invalidate(avatar);
    if (index && deepEnabled()) index.request(avatar).then(scheduleSearch);
    if (index) refreshVisible();
}

export function charactersChanged() {
    if (!index) return;
    for (const char of window.getAllCharacters?.() || []) index.invalidate(char.avatar);
    refreshVisible(); if (deepEnabled()) buildSearchIndex();
}

export function matches(char, query) {
    const record = index?.get(char.avatar);
    return !!($('searchDefinition')?.checked && record?.definition?.includes(query)
        || $('searchFirstMessage')?.checked && record?.greetings?.includes(query));
}

export function init() {
    if (initialized) return; initialized = true;
    index = createCardIndex({ getContext: context, deepEnabled,
        fetchCard: async avatar => {
            const response = await window.apiRequest('/characters/get', 'POST', { avatar_url: avatar });
            if (!response.ok) throw new Error('Card unavailable');
            return response.json();
        },
        onUpdate: () => { refreshVisiblePaint(); if (deepEnabled()) scheduleSearch(); },
    });
    function refreshVisiblePaint() { for (const card of visibleCards) if (card.isConnected) paintCard(card); }
    const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
            if (entry.isIntersecting) visibleCards.add(entry.target); else visibleCards.delete(entry.target);
        }
        refreshVisible();
    });
    const grid = $('characterGrid');
    let lastCharacters = window.getAllCharacters?.();
    const observeCards = () => {
        for (const card of [...visibleCards]) if (!card.isConnected) { observer.unobserve(card); visibleCards.delete(card); }
        for (const card of grid.querySelectorAll(':scope > .char-card')) observer.observe(card);
        const chars = window.getAllCharacters?.();
        if (chars !== lastCharacters) { lastCharacters = chars; charactersChanged(); }
    };
    new MutationObserver(observeCards).observe(grid, { childList: true }); observeCards();
    const section = document.createElement('div'); section.className = 'sidebar-section';
    section.innerHTML = '<div class="sidebar-label">SillyTavern tags</div><div id="qualityDetailTags" class="quality-native-tags"></div><button type="button" id="qualityEditTags" class="glass-btn">Manage ST tags</button>';
    $('modalTags').closest('.sidebar-section').after(section);
    $('qualityEditTags').addEventListener('click', editNativeTags);
    new MutationObserver(updateDetailTags).observe($('charModal'), { attributes: true, attributeFilter: ['class'] });
    new MutationObserver(updateDetailTags).observe($('modalTags'), { childList: true });
    const editor = document.createElement('div'); editor.id = 'qualityTagEditor'; editor.hidden = true;
    editor.className = 'quality-tag-editor'; editor.setAttribute('role', 'dialog'); editor.setAttribute('aria-modal', 'true');
    editor.setAttribute('aria-labelledby', 'qualityTagTitle');
    editor.innerHTML = '<div><h3 id="qualityTagTitle">SillyTavern tags</h3><p>Assign existing ST tags. Card-embedded tags stay separate. Create or rename tags in SillyTavern’s tag manager.</p><input type="search" class="glass-input" placeholder="Find ST tags…" aria-label="Find ST tags"><div class="quality-tag-list"></div><p role="status"></p><button type="button" class="glass-btn" data-save>Save ST tags</button> <button type="button" class="glass-btn" data-close>Cancel</button></div>';
    document.body.append(editor);
    editor.querySelector('[data-close]').addEventListener('click', closeTagEditor);
    editor.querySelector('input[type=search]').addEventListener('input', event => {
        for (const label of editor.querySelectorAll('.quality-tag-list label')) label.hidden = !label.dataset.name.includes(event.target.value.toLowerCase());
    });
    window.registerOverlay?.({ id: editor.id, tier: 1, close: closeTagEditor, visible: el => !el.hidden });
    for (const id of ['searchDefinition', 'searchFirstMessage']) {
        $(id).checked = !!window.getSetting?.(id);
        $(id).addEventListener('change', () => { window.setSetting?.(id, $(id).checked); buildSearchIndex(); });
    }
    for (const [id, setting, defaultValue] of [['qualityTokenCounts', 'nativeTokenCounts', true], ['qualityFollowTheme', 'followSTTheme', false]]) {
        $(id).checked = window.getSetting?.(setting) ?? defaultValue;
        $(id).addEventListener('change', () => { window.setSetting?.(setting, $(id).checked); followTheme(); refreshVisible(); });
    }
    let lastProfile = tokenizerProfile(context());
    // Host theme/model changes do not necessarily emit events into the library iframe.
    setInterval(() => {
        if (document.hidden) return;
        const profile = tokenizerProfile(context());
        if (profile !== lastProfile) { lastProfile = profile; refreshVisible(); }
    }, 3000);
    window.addEventListener('focus', () => { followTheme(); refreshVisible(); updateDetailTags(); });
    const ctx = context(), events = ctx?.eventTypes || ctx?.event_types;
    if (ctx?.eventSource && events?.CHARACTER_EDITED) ctx.eventSource.on(events.CHARACTER_EDITED, () => {
        charactersChanged();
    });
    followTheme(); if (deepEnabled()) buildSearchIndex();
}

export default { init, matches, invalidate, charactersChanged };
