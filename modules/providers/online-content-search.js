import { escapeHtml } from '../core-api.js';
import { decodeHtmlEntities, stripHtml } from './provider-utils.js';

function normalizeText(text) {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function onlineCardText(...fields) {
    return fields.filter(field => typeof field === 'string')
        .map(field => decodeHtmlEntities(field).replace(/<\/?(?:p|div|li|br)\b[^>]*>/gi, ' '))
        .map(field => normalizeText(stripHtml(field)))
        .filter(Boolean)
        .join('\n');
}

export function onlineCardTextAttribute(...fields) {
    return `data-online-card-text="${escapeHtml(onlineCardText(...fields))}"`;
}

export function addOnlineContentSearch(container, pagination) {
    const panel = document.createElement('details');
    panel.className = 'online-content-search';
    panel.innerHTML = `
        <summary>Search notes &amp; descriptions</summary>
        <div class="online-content-search-controls">
            <input type="search" class="glass-input" placeholder="Enter a keyword" aria-label="Search notes and descriptions on loaded cards">
            <button type="button" class="glass-btn" hidden>Load more cards</button>
        </div>
        <p role="status" aria-live="polite"></p>`;
    const input = panel.querySelector('input');
    const status = panel.querySelector('[role="status"]');
    const loadMore = panel.querySelector('button');
    const query = () => panel.open ? normalizeText(input.value) : '';

    function update() {
        const keyword = query();
        let total = 0;
        let withText = 0;
        let matches = 0;
        const visibleGrids = new Map();
        for (const card of container.querySelectorAll('[data-online-card-text]')) {
            const grid = card.parentElement;
            if (!visibleGrids.has(grid)) visibleGrids.set(grid, grid.getClientRects().length > 0);
            if (!visibleGrids.get(grid)) {
                card.classList.remove('online-content-no-match');
                continue;
            }
            const text = card.dataset.onlineCardText;
            const match = !keyword || text.includes(keyword);
            card.classList.toggle('online-content-no-match', !match);
            total++;
            if (text) withText++;
            if (match) matches++;
        }
        status.textContent = keyword
            ? `Showing ${matches} of ${total} loaded cards. ${withText} have searchable text.`
            : 'Searches notes and descriptions supplied for loaded cards.';
        loadMore.hidden = !keyword || !pagination?.canLoadMore();
    }

    const observer = new MutationObserver(records => {
        if (panel.open && records.some(record => !panel.contains(record.target)
            && (record.type === 'childList' || record.target.querySelector('[data-online-card-text]')))) update();
    });
    panel.addEventListener('toggle', update);
    input.addEventListener('input', update);
    loadMore.addEventListener('click', () => {
        if (query() && pagination.canLoadMore()) pagination.loadMore();
        update();
    });
    const providerSearch = container.querySelector('.browse-search-bar');
    if (providerSearch) providerSearch.after(panel);
    else container.prepend(panel);
    observer.observe(container, { childList: true, subtree: true, attributeFilter: ['class', 'style', 'hidden'] });
    update();
    return {
        isFiltering: () => Boolean(query()),
        clear: () => {
            input.value = '';
            update();
        },
        dispose: () => {
            observer.disconnect();
            panel.open = false;
            update();
            panel.remove();
        },
    };
}
