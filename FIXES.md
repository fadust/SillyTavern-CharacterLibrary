# Maintenance fixes

## 7.3.4-integrated.12 - 2026-11-04

Live Datacat package testing exposed a shared embedded-book import failure: the upload response returned a filename stem without `.png`, and the new card could also be absent from the Library catalogue when binding ran. The import now normalizes the avatar filename, fetches only that card after the world file is saved and awaits host synchronization for the binding write. Single-card refresh replaces an existing cache entry instead of duplicating it. This retains the lightweight import path without reloading the whole catalogue. Existing-primary preservation and world filename collision protections remain unchanged. All 415 automated tests pass, including new-upload filename/binding and repeated-refresh regressions.

## 7.3.4-integrated.11 - 2026-11-04

The official browser PNG was found to include canonical character/source provenance but omit definition/version stamps. Such files now require an explicit confirmation of the selected definition/version before the downloaded-PNG fallback proceeds. Conflicting identity, source or selection metadata remains a hard rejection. Confirmation resets between requests. The downloaded test PNG contains the full definition, three greetings, twelve lorebook entries and a 768 × 914 image; live import verification is recorded separately.

## 7.3.4-integrated.10 - 2026-11-04

Added a downloaded-PNG fallback to the Datacat export panel so an absent companion or blocked embedded page does not leave users waiting indefinitely. Download the official PNG in the existing signed-in Datacat tab with Embed lorebook enabled, then choose it in Character Library. The bounded PNG parser and canonical embedded V2 card are shared with companion imports. File metadata must match the pending character, source, definition and explicit version. Oversize/invalid/mismatched files leave the panel open for retry, and cancellation cannot accept a late file read. No account credentials or verification tokens are transferred.

Live full-package verification is recorded separately; automated tests alone do not prove Datacat exported the package.

## 7.3.4-integrated.9 - 2026-11-04

Fixed Datacat character-content previews: cl-helper already returned full definitions for Recent cards, but the preview unnecessarily requested a download and replaced the body with a verification error. Available detail content now renders without calling the download endpoint. Source previews retain V2 examples, personality, scenario, greetings and creator notes; selected variants stay isolated, including native uploads and Saucepan recovery. Reimagination previews show only that variant's returned Reimagination text. Empty or unavailable detail content still uses the canonical export path.

Read-only previews never populate the acquired-export cache. Import and update checks retain the canonical export, browser verification, definition/variant identity, cancellation and duplicate-replacement safeguards. The optional Website implementation remains removed; the existing cl-helper proxy needs no update or expanded permissions.

## 7.3.4-integrated.8 - 2026-11-04

Rolled back the optional Datacat Website panel introduced from the official standalone browser repository. Removed its toolbar entry, native messaging/import controller, optional import-and-chat action and obsolete tests. The frame stayed blank in the user's Chrome session, and authenticated export could not be verified. The original unified Datacat provider, cl-helper, verified-export companion and definition/variant import safeguards remain available. Local ST tag/token/search/theme improvements and the Datacat tag fixes in integrated.7 are retained. A browser-found click propagation bug is also fixed: selecting a tag or removing a chip keeps the picker open after its rows rerender. All 404 remaining automated tests pass. Historical integrated.6 notes below describe the removed implementation.

## 7.3.4-integrated.7 - 2026-11-04

Datacat's unified tag picker now cycles neutral → include → exclude → neutral, accepts multiple selections without silently clearing earlier tags, displays positive/negative counts and removable chips, and clears both states. Included tags are AND constraints; excluded tags reject any match. Native browsing sends blockedTagIds to Datacat before pagination, including negative-only searches. Janitor Meili mode has independent tag IDs and matching exclusion clauses; Hampter's unsupported tag control remains hidden.

The tag catalogue now uses the current paged API rather than assuming a single response is complete. Search queries the full catalogue; scrolling or Load more uses the server's page offset, while selected tag metadata remains available. Loaded rows sort selected first, then count descending and name for ties. Counts refresh under the same positive/negative filters; generation checks and cancellation reject late responses. Errors retain the selected filters. Leaving the provider cancels pending tag work. Selecting tags from a creator or Following view returns to Browse so filters take effect.

Validation: 414 automated tests passed. Live production API checks read 111,786 tags, retrieved distinct pages and 37 Cyberpunk search matches, and confirmed SFW + Female with Male excluded against an actual character's metadata. The filtered result count matched the selected SFW facet count. Existing source/variant export, import, lorebook and local-save safeguards are unchanged; no card import is needed for tag verification.

## 7.3.4-integrated.6 - 2026-11-04

Adopts the useful local-card ideas reviewed in ayvencore's Another Character Library: colored native ST tag badges, an independent assignment editor with concurrent-change checks, optional Tagmojis labels, visible-card ST tokenizer counts, optional description/personality and greeting search, and optional ST theme matching. Native tag assignments only change ST's tagMap, never embedded card tags. Create/rename native tags in ST's existing tag manager. Tokenization/indexing share two workers; counts are keyed by content and model/tokenizer profile, stale results are discarded, and failures retain estimates. Token sorting/advanced filters continue using their existing estimates. Deep search keeps normalized strings rather than full hydrated cards. Theme matching leaves library theme settings intact when switched off. Display preferences apply immediately in General settings; deeper search is selected in Search Settings.

Adds Website in Datacat's existing browse toolbar, implementing the official browser's public protocol with Datacat-hosted account linking. The frame remains attached while hidden. Exact origin, frame, nonce, request and selection checks precede canonical PNG validation and a visible import review. Ordinary imports do not start chats; an optional Import & start chat action uses ST's native new-chat command, with a short scroll pin released by user input. Successful request receipts prevent retried imports/chat handoffs; closing cancels pending review, while a write already dispatched to ST finishes and records its receipt.

The current website bridge omits definitionSource. Those exports become unlinked copies, with any original incomplete Datacat metadata retained under extensions.character_library_native_export.originalDatacat. Explicitly reported, matching definitions retain full source/ID/definition/variant links. Existing unified browsing, Source/Reimagination selection, helper/userscript export, update checks and lorebook/import safeguards remain available. Possible duplicates are disclosed; native imports keep existing cards rather than replacing them.

Provenance: ideas reviewed at [Another Character Library 01f868f](https://github.com/ayvencore/Sillytavern-Another-Character-Library/tree/01f868f7067cba7b61af016875d58144e3f31723) and [Datacat browser b5451c6](https://github.com/datacat-run/datacat-sillytavern-browser/tree/b5451c69fcb874fc966fca549be812cfdb4f4fe4), plus Datacat's current public website bridge. New implementation uses this repository's existing APIs and preservation pipeline; no whole upstream module or dependency was copied.

Validation: 405 automated tests, including new tag separation, concurrency, bounded indexing, stale count/profile, canonical selection, origin binding, retry, close-during-write, import-only and optional chat checks. Live browser checks confirmed native tag persistence without embedded card changes, definition/greeting search, tokenizer badges, reversible theme matching, and Datacat's website handshake/persistent frame. Installation evidence and preservation hashes are recorded separately in the deployment report. Authenticated Datacat export and human verification require the user's site session and are not represented as proven by fixtures.

## 7.3.4-integrated.5 - 2026-11-03

CharacterTavern's rebuilt site removed the old /api/search/cards, /api/catalog/top-tags and author/slug REST detail routes. The default provider now reads the same SvelteKit page-data routes as the live catalogue, and loads the official card JSON export by card ID. Streamed data is decoded with the pinned MIT-licensed devalue 6.0.3 decoder; remote JavaScript is never evaluated.

Search filters and current sort aliases are preserved. The unsupported Oldest choice is replaced by Recently Updated. Configured custom gateways retain their legacy API contract and authentication headers instead of being sent through the fixed-host helper. Full exports preserve alternate greetings, embedded lorebooks and unknown extensions; previews populate these fields after details load. Update checks still protect fields absent from an export.

Bundled cl-helper 1.13.3 allowlists only the new read-only catalogue and character page-data paths. Session validation reads the current signed-in page layout, and malformed/transient responses preserve stored cookies. Restart SillyTavern after installing the updated helper.

Validation: 387 tests passed, including 11 new migration, malformed-data, export-preservation, gateway and helper-boundary checks. A live public query, approximately 5,900 tags, complete details and the official export passed through the local proxy. The verified card retained three alternate greetings and 14 embedded lorebook entries. No cards were imported or updated. Signed-in CharacterTavern behaviour remains untested without an account session.

## 7.3.4-integrated.4 - 2026-11-03

Tag suggestions sort by usage count, highest first, with selected tags kept at the top and alphabetical ordering for equal counts.

CharaVault's provider menu uses a bundled vault SVG instead of the unavailable remote favicon.

CharaVault now uses the original Chub-style tag interaction: neutral → include → exclude → neutral, multiple selected tags, positive/negative counts, selected-tag chips, custom tag entry with Enter or Add, and Clear. Search covers the complete provider tag catalogue and the list appends further entries while scrolling instead of silently stopping at 80 tags. Card and preview tags can be clicked to add an include filter.

Included and excluded tags are sent as exact matches through CharaVault's tags/exclude_tags parameters. Multiple includes must all match; any excluded tag rejects the card. Saved provider exclusions are merged into each request. Minimum/maximum token filters use the provider's token_min/token_max parameters. The existing No lorebook choice now sends has_book=false instead of dropping the filter. These controls use CharaVault's supported API, rather than sending Chub-only parameters such as AI score.

Rapid changes are debounced. A filter change during an in-flight request starts the new search, and older responses cannot overwrite it. The dropdown stays open when tag rows are rebuilt, so repeated selections work like Chub. A failed tag-list request can be retried. Query results display the provider's total match count.

Validation: 376 tests passed, including nine new tag/filter regressions. Live SFW multi-tag include/exclude and token-range checks returned matching cards through the local proxy; the complete tag endpoint returned approximately 58,000 entries. No card imports or tag mutations were performed.

## 7.3.4-integrated.3 - 2026-11-03

CharaVault's official authentication requires an account email plus app password at POST /api/auth/login, followed by Authorization: Bearer with the returned session token. The old X-App-Password header did not authenticate direct API requests.

The provider now exposes Account Email beside App Password, exchanges those credentials through the existing CORS transport, and caches the session token in memory. Concurrent requests share one login; changing credentials starts a fresh login. Public browsing remains available without an email/password pair. Custom gateways retain their existing header contract, and gateway keys are ignored for direct CharaVault access. Credentials and session tokens are never put in URLs.

Validation: 14 focused CharaVault tests and 367 total tests passed. Live login and a Bearer-authenticated GET /api/auth/me both returned HTTP 200. No card imports or account changes were performed. Documentation: https://charavault.net/ (CharaVault API, App Passwords).

## 7.3.4-integrated.2 - 2026-11-03

CharaVault browsing failed with browser "Failed to fetch" because its API did not send Access-Control-Allow-Origin for the local SillyTavern origin. A live public SFW API request returned HTTP 200, while a custom-header preflight returned HTTP 401. The site's availability and browser cross-origin access are distinct.

Live image responses also returned Cross-Origin-Resource-Policy: same-site; thumbnails and the provider icon therefore use local proxy URLs.

All six CharaVault API read paths and both binary image download paths now use the existing fetchWithProxy helper. It retains browser-direct access where allowed and retries through SillyTavern's local proxy when cross-origin access fails. Gateway settings and authentication headers are preserved; no settings reset, credentials, new relay, helper change or server restart is required. Versioned module imports invalidate the old direct-fetch code after reload.

Validation: ten focused CharaVault regressions; 363 total tests passed. The existing running ST proxy also returned HTTP 200 and a result for a bounded public SFW listing. Authenticated downloads/imports were not exercised.
