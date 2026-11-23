# Character Library integration

Version `7.3.4-integrated.15` combines the local `7.3.4-integrated.14` build with official upstream `51fbd085fd78367e62ee2196f2c3c5439d5577d5` (7.2.4) and the fork’s existing launcher fixes. The bundled cl-helper is `1.13.4`. The original integration used upstream `5c99e79ebc42b34ab65e89c553577d118b8e6de5` (7.2.2).

The November 4 validation below refers to `7.3.4-integrated.14`. See [FIXES.md](FIXES.md) for earlier maintenance changes.

## Validation of 7.3.4-integrated.15

All 423 automated tests pass under Node 24.16.0, along with syntax checks on 124 non-vendor JavaScript files. An isolated Chrome fixture verified that the launcher opens and closes without moving the composer at desktop and mobile widths. These checks did not use live provider accounts.

## Datacat automatic Import and linked lorebooks — 2026-11-04

cl-helper remains the first export attempt. When Datacat requires browser verification, the optional local Chrome companion opens a real signed-in Datacat tab and returns the official PNG to Library automatically. The blocked-frame/manual-file-picker route is no longer the automatic Import path. The user installed the companion and completed Datacat's normal verification during the live test; no account credentials were extracted and no browser file permission was changed.

Two live Chrome imports verified the official Source export, including definition fields, alternate greetings, and artwork. When one export omitted its public linked lorebook, the import added all twelve entries to the PNG and a new native World. The existing same-named World was preserved. All eight referenced media thumbnails rendered after downloading the media.

New imports explicitly include matching public linked Source lorebooks when a successful export omits them. Update comparisons keep canonical null/empty books authoritative. Reimagination and unrelated variants do not borrow the primary Source book. Creator-denied exports are still never replaced with preview metadata.

One card advertised an advanced script whose code was private. The exported PNG contained no script payload.

Validation: 423 automated tests, 124 tracked non-vendor JS/MJS/CJS syntax checks, and git diff --check pass. These live results cover those two cards. No model generation was tested.

## Additional repository improvements - 2026-11-04

Ayvencore's reviewed local-card features now use independent ST tag assignments, bounded visible-card tokenizer work, optional normalized deep search, and opt-in host theme matching. They do not replace the landing page, duplicate favourites, or copy embedded tags into ST tags.

The optional Website mode derived from the official Datacat browser protocol was rolled back after its frame stayed blank in Chrome and authenticated export could not be verified. The unified provider and helper/companion route remain, with source/ID/definition/variant identity checks, canonical PNGs, unknown card extension preservation, collision-safe lorebook imports and duplicate safeguards. Datacat tag improvements are independent of the removed Website panel.

## Review scope and provenance

All 122 ahead commits across the ten retained repositories are inventoried in COMMIT-REVIEW.md and commit-review.json, with pinned branch heads, individual commit links, merge bases, and ahead/behind counts. The review reconciles each history with its final effective code: merges, reverted features, cache changes and superseded attempts are not counted as independent capabilities. The two older forks were used as sources of selected fixes, not wholesale downgraded installations.

## Integrated behavior

- GalliumWang: directly accessible lorebooks, combined relationship display, additional-book management, account-scoped folders/tags, mobile launchers and visibility settings.
- pterror: CharaVault, beta custom repositories, optional provider gateways, Chub authentication, linked lorebook and expression imports, Update from File, read-only ST tag filtering, duplicate handling, recent-chat shortcut and chat bulk deletion.
- xyzzy121: Datacat definition/variant/export preservation, optional verified-export companion, save target isolation, queued persistence, version history and provider error classification.
- cagedbird043: remote card gallery media, original-URL image fallback, consistent avatar viewer and optional real-browser JannyAI transport. Reverted pin-to-screen work stays reverted.
- suhrayuh: Always-Edit, extension-gated nickname/alternate-field editing, greeting names for compatible hosts, chat-count sorting, Saucepan lorebook preview/import, settings reconciliation and unsaved-edit actions. Current upstream features and conservative provider defaults remain the baseline; stale provider-link and save implementations were not restored.
- 2022EndWorldBegin: expanded editor does not close from a backdrop click; other modal behavior remains intact.
- Laplace-Lapis: manual Fix Chat Links action, unified with migration-triggered repair.
- magicoflolis: optional userscript cookie/clearance handling; corrected its announced version lookup. It is separate from Datacat's export companion and the server-browser provider.
- MrDfour: object/string Chub topic normalization and browse-result fallback. No claimed automatic synchronization to ST's separate tagMap, and no redundant post-import card rewrite.
- Cheesedozer: explicit/nested reverse-proxy fields handled in the current shared resolver; an explicit named None remains authoritative. Its broken duplicate declarations and duplicated module-loader scripts were excluded.

## Integration fixes beyond merging

1. Retained xyzzy121's original-target/save-snapshot protections when combining authoring and lorebook changes. Later typing remains unsaved; save-and-close does not report success if the avatar or newer edits remain pending.
2. Preserved provider error classification instead of interpreting service/authentication failures as removed cards. Reconciled gateway-aware endpoint helpers with those checks.
3. Embedded book import now uses the same converter as the lorebook manager. It preserves native activation fields and disambiguates repeated entry IDs. Books receive unused filenames instead of replacing same-named worlds. Binding happens only after the world write succeeds. An unrelated existing primary stays primary; the new book is additional. Failures produce a warning while the imported card and its embedded book remain available.
4. Chub linked resources stay separate from embedded books. Removed the remaining own-character-ID resolution from the provider preview/fetch path. Existing world filenames are not overwritten by linked-book import, and failed additional binding is reported.
5. Manual and automatic chat media repair share one implementation. It checks old/new folder listings, refuses failed listings as evidence, handles inline URLs/attachments/swipes, preserves query suffixes, skips active chats, and rereads complete content before saving. It does not migrate group chats.
6. Updated an older fixture for the newly introduced FolderStore dependency; retained its out-of-order load assertion. Added fifteen focused integration regressions.

## Original integration validation

- Node v24.16.0: 353 automated tests pass (inherited suites plus integration cases).
- 112 non-vendor JavaScript, MJS and CJS files pass node --check.
- git diff --check passes.
- Disposable headless Chrome / localhost fixtures: desktop and 390px mobile application startup and lorebook opening pass; all eleven providers register; no uncaught JavaScript page errors. Fixtures intentionally return 404 for missing user files, optional helper and host assets; these produced resource-console errors and are not represented as a clean real-server run.
- No paid model calls, live account imports, human verification, real chat rewriting, physical mobile testing, CI or deployment was performed. Historical fork test counts in other README files do not replace this record.

Run tests from the source root:

    node --test tests/**/*.test.mjs tests/*.test.cjs tests/*.test.mjs

## Remaining practical limits

This is a reviewable candidate for a disposable SillyTavern installation. Real provider accounts, browser endpoints, userscript-manager permissions and actual LLM generation need their own smoke tests. Test fixtures do not prove external services work today. The final read-before-save guard reduces chat overwrite risk, but ST's whole-file chat API supplies no atomic compare-and-swap; do not edit target chats from another client during repair. Separate browser tabs also do not share a transactional organization-file writer.

Datacat browser verification, optional bridge cookie support, CharaVault rate limits, custom-repository protocol limits and Saucepan's heuristic activation-key conversion retain their provider-specific constraints. Extra downloads and remote galleries can use bandwidth and memory.

Keep the installation folder named `SillyTavern-CharacterLibrary` so the launcher can find it. For Datacat, install the bundled helper and restart SillyTavern. The Chrome companion is optional and handles downloads that require verification in your browser.

## Useful review files

- COMMIT-REVIEW.md: human-readable complete commit inventory and per-fork disposition.
- commit-review.json: machine-readable source provenance.
- tests/integration/combined.test.mjs: new integration-focused preservation tests.
- modules/lorebook-conversion.js: shared embedded-book conversion.

The original license is retained. [COMMIT-REVIEW.md](COMMIT-REVIEW.md) records the original commits and authors.
