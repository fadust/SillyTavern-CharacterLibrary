import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../../modules/local-quality.js', import.meta.url), 'utf8');
const quality = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const tick = () => new Promise(resolve => setImmediate(resolve));

test('native tag assignment edits only the selected ST mapping and preserves card data', () => {
    const card = { avatar: 'a.png', data: { tags: ['embedded'], extensions: { unknown: 4 } } };
    const before = structuredClone(card); let saves = 0;
    const ctx = { characters: [card], tags: [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }],
        tagMap: { 'a.png': ['a'], 'other.png': ['a'] }, saveSettingsDebounced() { saves++; } };
    quality.saveNativeTags(ctx, 'a.png', ['a'], ['b', 'b']);
    assert.deepEqual(ctx.tagMap, { 'a.png': ['b'], 'other.png': ['a'] });
    assert.deepEqual(card, before); assert.equal(saves, 1);
    assert.deepEqual(quality.nativeTags(ctx, 'a.png').map(tag => tag.name), ['Beta']);
});

test('native tag editor rejects concurrent assignments, removed tags and removed cards', () => {
    const ctx = { characters: [{ avatar: 'a.png' }], tags: [{ id: 'a' }], tagMap: { 'a.png': ['a'] }, saveSettingsDebounced() { assert.fail(); } };
    assert.throws(() => quality.saveNativeTags(ctx, 'a.png', [], []), /changed/);
    assert.throws(() => quality.saveNativeTags(ctx, 'a.png', ['a'], ['deleted']), /removed/);
    assert.throws(() => quality.saveNativeTags(ctx, 'missing.png', [], []), /no longer/);
    assert.deepEqual(ctx.tagMap['a.png'], ['a']);
});

test('token text retains existing five-field coverage and excludes lore/chat', () => {
    assert.equal(quality.tokenText({ data: { description: 'd', personality: 'p', scenario: 's', first_mes: 'f', system_prompt: 'y', character_book: { entries: ['not counted'] }, mes_example: 'not counted' } }), 'd\n\np\n\ns\n\nf\n\ny');
});

test('tokenizer profile tracks models without retaining credentials', () => {
    const ctx = { mainApi: 'openai', powerUserSettings: { tokenizer: 2 }, chatCompletionSettings: { deepseek_model: 'one', secret_key: 'never-store' } };
    const before = quality.tokenizerProfile(ctx); ctx.chatCompletionSettings.deepseek_model = 'two';
    assert.notEqual(quality.tokenizerProfile(ctx), before); assert.ok(!before.includes('never-store'));
});

test('visible tokenization is lazy, shares work, and invalidates on content/profile changes', async () => {
    let calls = 0, reads = 0, text = 'old';
    const ctx = { mainApi: 'openai', chatCompletionSettings: { openai_model: 'one' }, getTokenCountAsync: async () => ++calls * 10 };
    const index = quality.createCardIndex({ getContext: () => ctx, deepEnabled: () => false, onUpdate() {},
        fetchCard: async () => { reads++; return { data: { description: text } }; } });
    assert.equal(reads, 0);
    await Promise.all([index.request('a', true), index.request('a', true)]);
    assert.equal(calls, 1); assert.equal(reads, 1); assert.equal(index.get('a').count, 10);
    await index.request('a', true); assert.equal(reads, 1);
    ctx.chatCompletionSettings.openai_model = 'two'; await index.request('a', true);
    assert.equal(calls, 2);
    const oldHash = index.get('a').signature;
    text = 'new'; index.invalidate('a'); await index.request('a', true);
    assert.notEqual(index.get('a').signature, oldHash); assert.equal(calls, 3);
});

test('an old card or tokenizer result cannot repaint a new revision/profile', async () => {
    const first = deferred(); let calls = 0;
    const ctx = { chatCompletionSettings: { openai_model: 'one' }, getTokenCountAsync: async () => { calls++; return first.promise; } };
    const index = quality.createCardIndex({ getContext: () => ctx, deepEnabled: () => false, onUpdate() {}, fetchCard: async () => ({ description: 'text' }) });
    const job = index.request('a', true);
    while (!calls) await tick();
    ctx.chatCompletionSettings.openai_model = 'two'; first.resolve(10); await job;
    assert.equal(index.get('a'), undefined);
    const slow = deferred();
    const second = quality.createCardIndex({ getContext: () => ctx, deepEnabled: () => true, onUpdate() {}, fetchCard: () => slow.promise });
    const old = second.request('a'); second.invalidate('a'); slow.resolve({ description: 'stale' }); await old;
    assert.equal(second.get('a'), undefined);
});

test('indexing has two workers, stores normalized search only when enabled and can retry failures', async () => {
    let active = 0, peak = 0, enabled = true, fail = true;
    const index = quality.createCardIndex({ getContext: () => ({}), deepEnabled: () => enabled, onUpdate() {},
        fetchCard: async avatar => {
            active++; peak = Math.max(peak, active); await tick(); active--;
            if (avatar === 'failed' && fail) throw new Error('offline');
            return { description: 'Dragon', personality: 'Kind', first_mes: 'Hello', alternate_greetings: ['WELCOME'] };
        } });
    await Promise.all(['a', 'b', 'c', 'failed'].map(avatar => index.request(avatar)));
    assert.equal(peak, 2); assert.equal(index.get('a').definition, 'dragon\nkind');
    assert.equal(index.get('a').greetings, 'hello\nwelcome'); assert.equal(index.get('failed'), undefined);
    fail = false; await index.request('failed'); assert.ok(index.get('failed'));
    enabled = false; index.clearSearch(); assert.equal(index.get('a').definition, undefined);
});
