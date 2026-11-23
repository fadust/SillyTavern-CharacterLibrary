import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../../modules/providers/datacat/', import.meta.url);
const contract = await readFile(new URL('datacat-contract.js', root), 'utf8');
const contractUrl = `data:text/javascript;base64,${Buffer.from(contract).toString('base64')}`;
let source = await readFile(new URL('datacat-api.js', root), 'utf8');
source = source.replace(/^import[\s\S]*?;\r?\n/gm, '').replace(/^export \* from .*;\r?\n/gm, '');
const names = ['DatacatError', 'classifyDatacatError', 'normalizeDatacatCharacter', 'normalizeDatacatPage', 'normalizeDatacatSourceKind', 'getDatacatSourceKind', 'getDatacatCharacterId', 'normalizeDatacatAvatar', 'normalizeDefinitionSource', 'normalizeRetrievalStatus'];
source = `import {${names.join(',')}} from '${contractUrl}';
const CoreAPI = { isUrlSafeForDownload: () => ({ok:true}) };
const CL_HELPER_PLUGIN_BASE = '/plugins/cl-helper';
const slugify = x => x, stripHtml = x => x, JANNY_TAG_MAP = {};
const readJsonClassified = r => r.json(), classifyErrorPage = () => null;
export const meiliQueries = [];
const meiliMultiSearch = async query => { meiliQueries.push(query); return {results:[{hits:[]}]}; }, isJanitorBridgeAvailable = () => false, janitorBridgeFetch = () => {};
${source}`;
const api = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const id = '11111111-2222-3333-4444-555555555555';
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

test('metadata preview reads recent card V2 fields without dropping examples or greetings', () => {
    const data = { name: 'Recent', description: '##DESCRIPTION START##\nDefinition\n##DESCRIPTION END##',
        personality: 'Traits', scenario: 'Scene', first_mes: 'Hello', mes_example: 'Dialogue', alternate_greetings: ['Other'] };
    const preview = api.buildDatacatMetadataPreview({ character_id: id, description: 'Creator blurb',
        content_variants: [{ id: 'janitor_core', isPrimary: true, content: {
            description: 'Creator blurb', chara_card_v2_json: JSON.stringify({ data }),
        } }] });
    assert.equal(preview.data.description, 'Definition');
    assert.equal(preview.data.creator_notes, 'Creator blurb');
    for (const field of ['personality', 'scenario', 'first_mes', 'mes_example', 'alternate_greetings']) assert.deepEqual(preview.data[field], data[field]);
    assert.equal(preview.spec, undefined, 'Read-only metadata must not pretend to be an exported card');
});

test('metadata preview keeps explicit variants isolated and never borrows Source for Reimagination', () => {
    const character = { character_id: id, personality: 'Wrong base', first_message: 'Wrong greeting',
        content_variants: [{ id: 'a', isPrimary: true, content: { personality: 'Primary' } },
            { id: 'b', content: { personality: 'Chosen', datacat_reimagination: { outputText: 'Reimagined text' } } },
            { id: 'pending', isRecoveryPlaceholder: true, content: { personality: 'Placeholder' } }] };
    const source = api.buildDatacatMetadataPreview(character, { variantId: 'b' });
    assert.equal(source.data.description, 'Chosen'); assert.equal(source.data.first_mes, '');
    const reimag = api.buildDatacatMetadataPreview(character, { variantId: 'b', definitionSource: 'reimagination' });
    assert.equal(reimag.data.description, 'Reimagined text'); assert.equal(reimag.data.first_mes, undefined);
    for (const variantId of ['missing', 'pending']) assert.equal(api.buildDatacatMetadataPreview(character, { variantId }), null);
    assert.equal(api.buildDatacatMetadataPreview(character, { variantId: 'a', definitionSource: 'reimagination' }), null);
    assert.equal(api.buildDatacatMetadataPreview({ name: 'Empty' }), null);
});

test('native metadata V2 and Saucepan recovery content stay source-specific', () => {
    const native = api.buildDatacatMetadataPreview({ primary_content_source_kind: 'direct_upload',
        chara_card_v2_json: { data: { name: 'Upload', description: '', personality: 'Traits', first_mes: 'Native greeting', mes_example: 'Example' } } });
    assert.equal(native.data.description, ''); assert.equal(native.data.personality, 'Traits'); assert.equal(native.data.mes_example, 'Example');
    const saucepan = api.buildDatacatMetadataPreview({ primary_content_source_kind: 'saucepan', personality: 'Wrong row',
        content_variants: [{ id: 'repair', isPrimary: true, sourceKind: 'saucepan', content: { description: 'Recovered body', first_message: 'Recovered greeting' } }] });
    assert.equal(saucepan.data.description, 'Recovered body'); assert.equal(saucepan.data.first_mes, 'Recovered greeting');
});

test('native search forwards complete positive/negative tag IDs without URL injection', async () => {
    const paths = [];
    api.setApiRequest(async path => { paths.push(path); return json({ characters: [], totalCount: 0 }); });
    await api.fetchRecentPublic({ tagIds: [1, '3', 3], blockedTagIds: [4, 58], search: 'a & b' });
    const url = new URL(paths[0], 'https://example.test');
    assert.equal(url.searchParams.get('tagIds'), '1,3'); assert.equal(url.searchParams.get('blockedTagIds'), '4,58');
    assert.equal(url.searchParams.get('search'), 'a & b');
    await assert.rejects(api.fetchRecentPublic({ blockedTagIds: ['4&tagIds=2'] }), error => error.code === 'invalid_request');
    assert.equal(paths.length, 1);
});

test('facets retain server pagination, search and selected-tag inclusions', async () => {
    let requested;
    api.setApiRequest(async path => { requested = new URL(path, 'https://example.test'); return json({ tags: [{ id: '9', name: 'Rare', count: 4 }], groups: [], totalCount: 1000, pageCount: 250, hasMore: true }); });
    const result = await api.fetchFacetedTags({ activeTagIds: [1, 3], blockedTagIds: [4], includeTagIds: [1, 3, 4], search: 'Rare & exact', offset: 250 });
    assert.equal(requested.searchParams.get('blockedTagIds'), '4'); assert.equal(requested.searchParams.get('includeTagIds'), '1,3,4');
    assert.equal(requested.searchParams.get('search'), 'Rare & exact'); assert.equal(requested.searchParams.get('sort'), 'count');
    assert.equal(result.tags[0].id, 9); assert.equal(result.nextOffset, 500); assert.equal(result.hasMore, true); assert.equal(result.totalCount, 1000);
    api.setApiRequest(async () => json({ tags: [], pageCount: 0, hasMore: true }));
    await assert.rejects(api.fetchFacetedTags(), /did not advance/);
});

test('Meili applies included tags with AND and excludes each selected tag before pagination', async () => {
    await api.searchMeiliJanny({ includeTags: new Set([1, 3]), excludeTags: new Set([4, 58]), nsfw: false });
    assert.deepEqual(api.meiliQueries.at(-1).filters, ['isNsfw = false', 'tagIds = 1 AND tagIds = 3', 'tagIds != 4 AND tagIds != 58']);
});

test('detail retries only actual missing endpoints and keeps source identity', async () => {
    const paths = [];
    api.setApiRequest(async path => { paths.push(path); return paths.length < 3 ? json({ error: 'Character not found' }, 404) : json({ character: { characterId: id, primary_content_source_kind: 'direct' } }); });
    assert.equal((await api.fetchDatacatCharacter(id, 'direct')).primary_content_source_kind, 'direct_upload');
    assert.equal(paths.length, 3);
    assert.match(paths[2], /recent-public\//);
});

test('gated download keeps classification and never bootstraps a new anonymous token', async () => {
    const paths = [];
    api.setApiRequest(async path => { paths.push(path); return json({ error: 'CHARACTER_DOWNLOAD_TURNSTILE_REQUIRED', message: 'Verify in DataCat' }, 403); });
    await assert.rejects(api.fetchDatacatDownload(id, 'direct', { definitionSource: 'reimagination', variantId: 'v1' }), error => error.code === 'verification_required' && error.message === 'Verify in DataCat');
    assert.equal(paths.length, 1);
    const url = new URL(paths[0], 'https://example.test');
    assert.equal(url.searchParams.get('downloadFormat'), 'json');
    assert.equal(url.searchParams.get('definitionSource'), 'reimagination');
    assert.equal(url.searchParams.get('variant'), 'v1');
});

test('structured policy and verification errors remain actionable even with HTTP404', async () => {
    for (const [upstream, code] of [['CREATOR_REDIRECT_REQUIRED', 'creator_restricted'], ['CHARACTER_DOWNLOAD_TURNSTILE_REQUIRED', 'verification_required']]) {
        const paths = [];
        api.setApiRequest(async path => { paths.push(path); return json({ error: upstream }, 404); });
        await assert.rejects(api.fetchDatacatCharacter(id, 'janitor'), error => error.code === code);
        assert.equal(paths.length, 1, 'restricted detail does not retry another source or public route');
        await assert.rejects(api.fetchDatacatDownload(id, 'janitor'), error => error.code === code);
    }
    api.setApiRequest(async () => new Response('Not Found', { status: 404 }));
    assert.equal(await api.fetchDatacatCharacter(id, 'janitor'), null);
    assert.equal(await api.fetchDatacatDownload(id, 'janitor'), null);
});

test('canonical downloads preserve selected empty fields, metadata and all extension namespaces', () => {
    const download = { spec: 'chara_card_v2', data: { name: 'Name', description: '', personality: 'separate personality', scenario: '', first_mes: '', creator: 'https://creator.example', character_book: { entries: [] }, depth_prompt: { depth: 4 }, extensions: { other: { key: 2 }, datacat: { linkedAt: 'yesterday' } } } };
    const result = api.buildV2FromDownload(download, { personality: 'old body', first_message: 'old greeting' }, { id, sourceKind: 'direct', definitionSource: 'reimagination' });
    assert.equal(result.data.description, '');
    assert.equal(result.data.first_mes, '');
    assert.equal(result.data.personality, 'separate personality');
    assert.equal(result.data.creator, 'https://creator.example');
    assert.deepEqual(result.data.character_book, { entries: [] });
    assert.equal(result.data.extensions.datacat.id, id);
    assert.equal(result.data.extensions.datacat.definitionSource, 'reimagination');
    assert.equal(result.data.extensions.datacat.linkedAt, 'yesterday');
    assert.deepEqual(result.data.extensions.other, { key: 2 });
    assert.deepEqual(result.data.depth_prompt, { depth: 4 });
});

test('malformed exports never become synthetic empty cards', async () => {
    for (const data of [{}, [], null, { name: 123 }]) {
        api.setApiRequest(async () => json({ data }));
        await assert.rejects(api.fetchDatacatDownload(id), error => error.code === 'invalid_response');
        assert.throws(() => api.buildV2FromDownload({ data }, null, { id }), error => error.code === 'invalid_response');
    }
});

test('browse sorts, native creators and clamped pages follow current API', async () => {
    const paths = [];
    api.setApiRequest(async path => { paths.push(path); return json({ characters: [{ characterId: id }], hasMore: true }); });
    const page = await api.fetchRecentPublic({ sortBy: 'messages_per_chat', limit: 80, offset: 80 });
    assert.equal(page.nextOffset, 81);
    assert.equal(page.hasMore, true);
    await api.fetchDatacatCreatorCharacters(id, { sourceKind: 'direct', sortBy: 'newest' });
    assert.match(paths[0], /[?&]sort=messages_per_chat/);
    assert.match(paths[1], /profiles\/users\/.+\/bots\?.*sort=latest/);
    await api.fetchDatacatCreatorCharacters(`saucepan:${id}`, { sortBy: 'newest' });
    assert.match(paths[2], /saucepan%3A/);
    assert.match(paths[2], /sortBy=creation_date/);
});

test('original artwork uses native media aliases and original variants during import', () => {
    const native = { characterId: id, sourceKind: 'direct_upload', avatar: 'stale-avatar.webp',
        intercepted_chat_data: JSON.stringify({ direct_upload: { media_assets: [
            { role: 'avatar', media_view_url: '/media/direct_upload/card.webp', original_url: '/media/direct_upload/original.png' },
        ] } }) };
    assert.equal(api.resolveDatacatAvatarUrl(native), 'https://datacat.run/media/direct_upload/card.webp');
    assert.equal(api.resolveDatacatAvatarUrl(native, { preferOriginal: true }), 'https://datacat.run/media/direct_upload/original.png');
    assert.equal(api.resolveDatacatAvatarUrl({ imageVariantUrls: { card: '/media/card.webp', original: '/media/original.png' } }, { preferOriginal: true }), 'https://datacat.run/media/original.png');
    assert.equal(api.resolveDatacatAvatarUrl({ charaCardV2Json: JSON.stringify({ data: { avatar: 'https://example.test/original.png' } }) }, { preferOriginal: true }), 'https://example.test/original.png');
});

test('only current confirmed session errors initialize once; generic authentication does not', async () => {
    for (const error of [
        { success: false, error: 'Authentication required', message: 'X-Session-Token header is required for all API requests' },
        { success: false, error: 'Invalid session', message: 'Session token is invalid or expired' },
    ]) {
        const paths = [];
        api.setSavedTokenGetter(() => null);
        api.setApiRequest(async path => {
            paths.push(path);
            return path.endsWith('/dc-init') ? json({ ok: true, token: 'fixture-token' }) : json(error, 401);
        });
        await assert.rejects(api.fetchDatacatCharacter(id), error => error.code === 'session_required');
        assert.equal(paths.filter(path => path.endsWith('/dc-init')).length, 1);
        assert.equal(paths.length, 3, 'one retry only');
    }
    for (const response of [json({ error: 'Authentication required' }, 401), new Response('<html>Login required</html>', { status: 401 })]) {
        const paths = [];
        api.setApiRequest(async path => { paths.push(path); return response.clone(); });
        await assert.rejects(api.fetchDatacatCharacter(id), error => error.code === 'authentication_required');
        assert.equal(paths.length, 1);
    }
});

test('unrecognized 404 responses and challenge pages never offer retrieval or status fallback', async () => {
    for (const [response, code] of [
        [new Response('<html>Just a moment... __cf_chl</html>', { status: 404 }), 'verification_required'],
        [new Response('<html>Upstream maintenance</html>', { status: 404 }), 'invalid_response'],
        [json({ error: 'SESSION_EXPIRED' }, 404), 'session_required'],
        [json({ error: 'DATABASE_UNAVAILABLE' }, 404), 'request_failed'],
        [json({}, 404), 'request_failed'],
    ]) {
        const paths = [];
        api.setApiRequest(async path => { paths.push(path); return response.clone(); });
        await assert.rejects(api.fetchDatacatCharacter(id), error => error.code === code);
        await assert.rejects(api.fetchExtractionStatus(), error => error.code === code);
        assert.equal(paths.length, 2, 'one request for detail, one for status');
    }
    const paths = [];
    api.setApiRequest(async path => { paths.push(path); return paths.length === 1 ? json({ error: 'Not found' }, 404) : json({ history: [] }); });
    assert.deepEqual((await api.fetchExtractionStatus()).history, []);
    assert.equal(paths.length, 2);
    assert.match(paths[1], /retrieval\/status$/);
});

test('aborted responses retain cancellation and never initialize a replacement session', async () => {
    const controller = new AbortController();
    const paths = [];
    api.setApiRequest(async path => { paths.push(path); controller.abort(); return json({ error: 'Invalid session' }, 401); });
    await assert.rejects(api.fetchDatacatCharacter(id, null, { signal: controller.signal }), { name: 'AbortError' });
    assert.equal(paths.length, 1);
    api.setApiRequest(async () => ({ ok: true, status: 200, text: async () => { throw new DOMException('Cancelled', 'AbortError'); } }));
    await assert.rejects(api.fetchDatacatDownload(id), { name: 'AbortError' });
});

test('detail rejects metadata without the requested UUID instead of offering a wrong or empty card', async () => {
    for (const character of [{}, { id: 42, name: 'Database row' }, { characterId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' }]) {
        api.setApiRequest(async () => json({ character }));
        await assert.rejects(api.fetchDatacatCharacter(id), { code: 'invalid_response' });
    }
});

test('Fresh requires the requested window envelopes instead of treating malformed data as an empty feed', async () => {
    for (const payload of [{}, { windows: null }, { windows: { last24h: { characters: [] } } }]) {
        api.setApiRequest(async () => json(payload));
        await assert.rejects(api.fetchFreshCharacters(), { code: 'invalid_response' });
    }
    api.setApiRequest(async () => json({ windows: { last24h: { characters: [] } } }));
    assert.deepEqual((await api.fetchFreshCharacters({ limitWeek: 0 })).thisWeek, []);
});

test('malformed advertised lorebooks remain unavailable for destructive update comparisons', () => {
    for (const script of ['not json', '{}', '[null]', '[{}]', '[{"content":null}]', '[{"content":"ok"},42]']) {
        const character = { scripts: [{ type: 'lorebook', is_public: true, script }] };
        assert.equal(api.hasUnfetchedLorebook(character), true, script);
    }
    assert.equal(api.hasUnfetchedLorebook({ scripts: [{ type: 'lorebook', is_public: true, script: '[]' }] }), false, 'known empty is different from unreadable');
});

test('multiple lorebooks preserve every entry with unique V2 IDs', () => {
    const scripts = [0, 1].map(n => ({ type: 'lorebook', is_public: true,
        script: JSON.stringify([{ id: 0, key: ['key' + n], content: 'entry' + n }, { id: 1, key: ['extra' + n], content: 'extra' + n }]) }));
    const book = api.extractCharacterBookFromScripts({ scripts });
    assert.equal(book.entries.length, 4);
    assert.equal(new Set(book.entries.map(entry => entry.id)).size, 4);
    assert.deepEqual(book.entries.map(entry => entry.content), ['entry0', 'extra0', 'entry1', 'extra1']);
});

test('cancelled lorebook hydration stops before requesting later scripts', async () => {
    const savedFetch = globalThis.fetch;
    const controller = new AbortController();
    let requests = 0;
    globalThis.fetch = async () => { requests++; controller.abort(); throw new DOMException('Cancelled', 'AbortError'); };
    try {
        const scripts = [0, 1].map(() => ({ type: 'lorebook', is_public: true, api_path: '/hampter/script/' + id }));
        await assert.rejects(api.hydrateDatacatScripts({ scripts }, { signal: controller.signal }), { name: 'AbortError' });
        assert.equal(requests, 1);
    } finally { globalThis.fetch = savedFetch; }
});
