export function newEntry(uid, displayIndex) {
    return {
        uid,
        key: [], keysecondary: [],
        comment: '', content: '',
        constant: false, vectorized: false,
        selective: true, selectiveLogic: 0,
        addMemo: false,
        order: 100, position: 0,
        disable: false, ignoreBudget: false,
        excludeRecursion: false, preventRecursion: false,
        matchPersonaDescription: false, matchCharacterDescription: false,
        matchCharacterPersonality: false, matchCharacterDepthPrompt: false,
        matchScenario: false, matchCreatorNotes: false,
        delayUntilRecursion: 0,
        probability: 100, useProbability: true,
        depth: 4, outletName: '',
        group: '', groupOverride: false, groupWeight: 100,
        scanDepth: null, caseSensitive: null, matchWholeWords: null, useGroupScoring: null,
        automationId: '', role: 0,
        sticky: null, cooldown: null, delay: null,
        triggers: [],
        displayIndex,
    };
}

// Port of ST's convertCharacterBook: embedded character_book (entries ARRAY) -> native
// world file (entries OBJECT keyed by id). Lets the user import a card's V2/V3 JSON directly.
export function convertCharacterBookToNative(book) {
    const result = { entries: {} };
    const list = Array.isArray(book?.entries) ? book.entries : [];
    list.forEach((entry, index) => {
        let id = Number.isInteger(entry.id) && entry.id >= 0 ? entry.id : index;
        while (Object.hasOwn(result.entries, id)) id++;
        const ext = entry.extensions || {};
        const posFromString = entry.position === 'before_char' ? 0 : 1;
        result.entries[id] = {
            ...newEntry(id, ext.display_index ?? index),
            key: Array.isArray(entry.keys) ? entry.keys : [],
            keysecondary: entry.secondary_keys || [],
            comment: entry.comment || '',
            content: entry.content || '',
            constant: entry.constant || false,
            selective: entry.selective || false,
            order: entry.insertion_order ?? 100,
            position: ext.position ?? posFromString,
            excludeRecursion: ext.exclude_recursion ?? false,
            preventRecursion: ext.prevent_recursion ?? false,
            delayUntilRecursion: ext.delay_until_recursion ?? 0,
            disable: entry.enabled === false,
            addMemo: !!entry.comment,
            probability: ext.probability ?? 100,
            useProbability: ext.useProbability ?? true,
            depth: ext.depth ?? 4,
            selectiveLogic: ext.selectiveLogic ?? 0,
            group: ext.group ?? '',
            groupOverride: ext.group_override ?? false,
            groupWeight: ext.group_weight ?? 100,
            scanDepth: ext.scan_depth ?? null,
            caseSensitive: ext.case_sensitive ?? null,
            matchWholeWords: ext.match_whole_words ?? null,
            useGroupScoring: ext.use_group_scoring ?? null,
            automationId: ext.automation_id ?? '',
            role: ext.role ?? 0,
            vectorized: ext.vectorized ?? false,
            sticky: ext.sticky ?? null,
            cooldown: ext.cooldown ?? null,
            delay: ext.delay ?? null,
            outletName: ext.outlet_name ?? '',
            ignoreBudget: ext.ignore_budget ?? false,
            triggers: ext.triggers ?? [],
            matchPersonaDescription: ext.match_persona_description ?? false,
            matchCharacterDescription: ext.match_character_description ?? false,
            matchCharacterPersonality: ext.match_character_personality ?? false,
            matchCharacterDepthPrompt: ext.match_character_depth_prompt ?? false,
            matchScenario: ext.match_scenario ?? false,
            matchCreatorNotes: ext.match_creator_notes ?? false,
        };
    });
    return result;
}
