import { unflatten } from './vendor/devalue/parse.js';

// SvelteKit streams deferred data as newline-delimited records containing devalue pools.
export async function parseCtPageData(response) {
    const records = (await response.text()).trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
    const page = records.find(record => record.type === 'data');
    if (!Array.isArray(page?.nodes)) throw new Error('CharacterTavern returned invalid page data');
    const chunks = new Map(records.filter(record => record.type === 'chunk').map(record => [record.id, record.data]));
    const decode = data => unflatten(data, { Promise: id => chunks.has(id) ? decode(chunks.get(id)) : null });
    return page.nodes.filter(node => node?.type === 'data' && node.data).map(node => decode(node.data));
}

export function getCtPageSearch(nodes) {
    const result = nodes.find(node => node?.searchResults)?.searchResults;
    if (!Array.isArray(result?.hits) || !Number.isFinite(result.totalHits) || !Number.isFinite(result.totalPages)) {
        throw new Error('CharacterTavern returned invalid catalogue results');
    }
    return {
        ...result,
        hits: result.hits.map(hit => ({
            ...hit,
            totalTokens: hit.permanentTokens ?? hit.totalTokens,
            isNSFW: hit.isNSFW === true || (Array.isArray(hit.contentWarnings) && hit.contentWarnings.length > 0),
        })),
    };
}

export function getCtPageTags(nodes) {
    const catalogue = nodes.find(node => node?.tagCatalogue)?.tagCatalogue;
    if (catalogue?.unavailable || !Array.isArray(catalogue?.tags)) {
        throw new Error('CharacterTavern tag catalogue is unavailable; please retry');
    }
    return catalogue.tags.filter(tag => typeof tag.value === 'string').map(tag => ({ tag: tag.value, count: tag.count }));
}

export function getCtPageCharacter(nodes) {
    const detail = nodes.find(node => node?.character);
    if (!detail?.character?.id || typeof detail.character.name !== 'string') {
        throw new Error('CharacterTavern returned invalid character details');
    }
    return detail;
}
