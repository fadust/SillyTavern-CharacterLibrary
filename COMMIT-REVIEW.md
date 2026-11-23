# Ahead-commit review

Reviewed 2026-11-03. Original main pinned at 5c99e79ebc42b34ab65e89c553577d118b8e6de5. Lumiverse excluded by request.

Commit histories are reviewed by their final effective delta; merges, reverts, packaging-only edits, and superseded attempts are identified below. Whole historical branches are not treated as independent feature counts.

## GalliumWang

Head `d123b8457edba4b5a15479433cceeab07869188d`; 10 ahead, 0 behind upstream.

Integrated final lorebook workspace; kept newer save/load guards.

| Commit | Date | Purpose | Review disposition |
|---|---|---|---|
| [9a5c9db9](https://github.com/GalliumWang/SillyTavern-CharacterLibrary/commit/9a5c9db914d58e8a37cfea834df6e66b06b55275) | 2026-09-23 | Open the lorebook manager from the SillyTavern top bar. | implementation; see fork disposition above |
| [382bda5d](https://github.com/GalliumWang/SillyTavern-CharacterLibrary/commit/382bda5d18dfc51d0dbc9a7449245d0f17bcba95) | 2026-09-23 | Manage additional lorebooks and chat bindings from the lorebook editor. | implementation; see fork disposition above |
| [b1a44702](https://github.com/GalliumWang/SillyTavern-CharacterLibrary/commit/b1a447023b3ccf27fc70e63d39777989ed5428d3) | 2026-09-23 | Fold the mobile top bar down to one Character Library icon. | implementation; see fork disposition above |
| [f2502bee](https://github.com/GalliumWang/SillyTavern-CharacterLibrary/commit/f2502beebf1d874930d1b227715456d66b130360) | 2026-09-23 | Hide the primary-lorebook warning in additional binding management. | implementation; see fork disposition above |
| [7da71fa2](https://github.com/GalliumWang/SillyTavern-CharacterLibrary/commit/7da71fa2a5acd247762c27b14eef45b0eebb2b63) | 2026-10-19 | Fix lorebooks top-bar button toggling | implementation; see fork disposition above |
| [be9bb3bf](https://github.com/GalliumWang/SillyTavern-CharacterLibrary/commit/be9bb3bfe7757fdec4cd3163d5caa836fa25a894) | 2026-10-19 | Remove lorebook manager entry from library menu | implementation; see fork disposition above |
| [183b3a4d](https://github.com/GalliumWang/SillyTavern-CharacterLibrary/commit/183b3a4d925d12dbc0f9b98664399ac431615be9) | 2026-10-19 | Show all lorebook binding types together | implementation; see fork disposition above |
| [4fef7dd6](https://github.com/GalliumWang/SillyTavern-CharacterLibrary/commit/4fef7dd6e06a034a4b1205d71e71b43b0635c496) | 2026-10-20 | Add collapsible folders to lorebook manager | implementation; see fork disposition above |
| [ed043958](https://github.com/GalliumWang/SillyTavern-CharacterLibrary/commit/ed0439581be8fc191605c098a132ce5a74226b44) | 2026-10-20 | Add lorebook tags and tag filtering | implementation; see fork disposition above |
| [d123b845](https://github.com/GalliumWang/SillyTavern-CharacterLibrary/commit/d123b8457edba4b5a15479433cceeab07869188d) | 2026-10-20 | Add launcher visibility controls and settings shortcuts | implementation; see fork disposition above |

## pterror

Head `d353c6bf33d629c5f1d9d66fd78dbe49cd7ff8e8`; 22 ahead, 0 behind upstream.

Integrated providers and import tools; replaced chat rewrite with guarded shared repair and fixed linked-book ownership.

| Commit | Date | Purpose | Review disposition |
|---|---|---|---|
| [f576105f](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/f576105f92a3dd2c8d307ba1e7a9bff50c283733) | 2026-05-09 | provider-utils: fall back to /proxy/ on 401/403/451 | implementation; see fork disposition above |
| [df43f15b](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/df43f15b08c2beff02971d7785a05cb10509ea48) | 2026-05-09 | chub: route writes through fetchWithProxy, use CHUB_AVATAR_BASE | implementation; see fork disposition above |
| [34839419](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/34839419efe5eed9da459768b6587fad4ffd6569) | 2026-05-09 | Add CharaVault provider | implementation; see fork disposition above |
| [2e1994f6](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/2e1994f6813de101b64ab1eaa13902fcf41bac04) | 2026-05-09 | chub, chartavern: optional gateway base URL and key | implementation; see fork disposition above |
| [b3cf0d57](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/b3cf0d578077bce513e53df432415eb56d6653d0) | 2026-05-09 | chartavern: send Authorization on gateway-routed fetch; restore CharaVault favicon | implementation; see fork disposition above |
| [dd92fb32](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/dd92fb3252f337a5202dd20aec5002faa3467d2f) | 2026-05-09 | link reference proxy implementation in gateway settings hints | implementation; see fork disposition above |
| [f725f135](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/f725f135b811056e21b29feebe2c663d79d3e588) | 2026-05-09 | charavault: align card layout with chub canon | implementation; see fork disposition above |
| [15f6fa9c](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/15f6fa9c7d6011dd2a1dd9966cc5daf235890b33) | 2026-09-12 | fix(chub): send samwise/CH-API-KEY alongside Authorization Bearer | implementation; see fork disposition above |
| [bc614054](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/bc6140540163017a83fcd3ab876ce8da58c3b359) | 2026-09-12 | fix(gallery): rewrite embedded chat media links on folder migration/rename | implementation; see fork disposition above |
| [ebf4a1b2](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/ebf4a1b2aa5599dc576d5f5d294b8073c388ab2f) | 2026-09-12 | fix(janitorai): combine search with creator filter, click tag to filter | implementation; see fork disposition above |
| [67f7d0b6](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/67f7d0b6cc86389c4805d15b83aef46bf0a10d22) | 2026-09-12 | fix(import): recognize server-side duplicate response instead of faking success | implementation; see fork disposition above |
| [bddac51c](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/bddac51c69ce0d8233cc3f8aa4e385e811a506ce) | 2026-09-12 | fix(dupe-finder): stop gating exact-match detection behind fuzzy-score preconditions | implementation; see fork disposition above |
| [d59bc8e5](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/d59bc8e5c6d35e780f534e1cd5f1f85ef9a9ca9f) | 2026-09-12 | Merge PR #18: CharaVault provider + optional gateway routing for chub/CharacterTavern | merge/history; see fork disposition above |
| [b9b97ce7](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/b9b97ce7c8840ac042392063df12b45a0492524c) | 2026-09-12 | fix: browse-view.js still imported the CHUB_API_BASE constant the PR #18 merge removed | implementation; see fork disposition above |
| [7ed51451](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/7ed51451d9ea4d6e07b9aa84adee2dfe4f417a3f) | 2026-09-12 | feat(chats): quick-open a character's most recent chat from the card grid | implementation; see fork disposition above |
| [0f9797f2](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/0f9797f22a4b583c10ff5c22f376af7c4c7471f2) | 2026-09-12 | feat(chats): add multi-select for bulk delete on the Chats screen | implementation; see fork disposition above |
| [edd328d8](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/edd328d84c4d4c8eabed95e0c8a904a1e8b7e048) | 2026-09-12 | feat(detail-modal): show local import date and card-stated create date separately | implementation; see fork disposition above |
| [dff3503d](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/dff3503d684e0084fe657390848a8cebe95ef2c1) | 2026-09-12 | docs: add TODO.md for folders landing page (#45) and i18n (#1) | implementation; see fork disposition above |
| [11906bc0](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/11906bc084e20d33a26e2a5b5ee003f38164e5ed) | 2026-09-12 | fix(library.html): add missing theme-color meta tag | implementation; see fork disposition above |
| [9679383a](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/9679383a7035685b276619ef4da04847f1f6bec3) | 2026-09-13 | feat(providers): add cr-repo custom-repository provider | implementation; see fork disposition above |
| [0a7d735e](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/0a7d735e223ecec8246ad085067be0290af0032f) | 2026-09-13 | fix(chub): resolve linked lorebooks by their own id/path, keep separate from embedded | implementation; see fork disposition above |
| [d353c6bf](https://github.com/pterror/SillyTavern-CharacterLibrary/commit/d353c6bf33d629c5f1d9d66fd78dbe49cd7ff8e8) | 2026-09-13 | feat(chub): import expression packs on character import | implementation; see fork disposition above |

## xyzzy121

Head `a274bce18faeba7e9a585aaec9165bef10452e4d`; 5 ahead, 0 behind upstream.

Integrated persistence/Datacat baseline; preserved classified errors during merges.

| Commit | Date | Purpose | Review disposition |
|---|---|---|---|
| [01cb375a](https://github.com/xyzzy121/SillyTavern-CharacterLibrary/commit/01cb375a0de982fcd0821376e1c7f34cbb48658f) | 2026-09-23 | Restore current Datacat compatibility for v7.3.0 | implementation; see fork disposition above |
| [a0ff4d0a](https://github.com/xyzzy121/SillyTavern-CharacterLibrary/commit/a0ff4d0a3ff989403843188fdf23ebe318eda77a) | 2026-09-23 | Fix Datacat browsing, linking and verified export edge cases | implementation; see fork disposition above |
| [e5be7d5c](https://github.com/xyzzy121/SillyTavern-CharacterLibrary/commit/e5be7d5ca159c949252d0976e2b12fd06b964cd1) | 2026-09-28 | Fix persistence, editing, and provider update regressions | implementation; see fork disposition above |
| [5132e340](https://github.com/xyzzy121/SillyTavern-CharacterLibrary/commit/5132e3400c5c68c00a6449ffd8e4b94bbd81f9aa) | 2026-09-28 | Fix Datacat retrieval, selection, and browsing regressions | implementation; see fork disposition above |
| [a274bce1](https://github.com/xyzzy121/SillyTavern-CharacterLibrary/commit/a274bce18faeba7e9a585aaec9165bef10452e4d) | 2026-09-28 | Fix Datacat lorebook preservation, filters, and avatar restore | implementation; see fork disposition above |

## magicoflolis

Head `754e95403cdb6e9a0389d80e956af09da97a3681`; 2 ahead, 0 behind upstream.

Integrated optional userscript; corrected reported script version; live cookie support unverified.

| Commit | Date | Purpose | Review disposition |
|---|---|---|---|
| [5dda84d6](https://github.com/magicoflolis/SillyTavern-CharacterLibrary/commit/5dda84d666a7eeeacf996714ad96946e36601b45) | 2026-09-19 | Reworked UserScript to utilize `GM_cookie` API | implementation; see fork disposition above |
| [754e9540](https://github.com/magicoflolis/SillyTavern-CharacterLibrary/commit/754e95403cdb6e9a0389d80e956af09da97a3681) | 2026-09-19 | Added `//@grant GM_info` | implementation; see fork disposition above |

## cagedbird043

Head `e412094db53db00eaf8d67600d9495f3b58a5643`; 7 ahead, 0 behind upstream.

Integrated final remote-gallery/browser-route changes; pin feature remains reverted.

| Commit | Date | Purpose | Review disposition |
|---|---|---|---|
| [98a5de20](https://github.com/cagedbird043/SillyTavern-CharacterLibrary/commit/98a5de206c4559fc582cd84c0853ef93747eeb4d) | 2026-09-12 | JannyAI 卡片详情改走服务端浏览器 | implementation; see fork disposition above |
| [e457f52a](https://github.com/cagedbird043/SillyTavern-CharacterLibrary/commit/e457f52aec0f639054d69a5f1883443a8f3cc608) | 2026-09-12 | Gallery 显示卡片自带的远程媒体 | implementation; see fork disposition above |
| [4118b87b](https://github.com/cagedbird043/SillyTavern-CharacterLibrary/commit/4118b87b3521c90826d8aefd2daefad7f5d19ddd) | 2026-09-12 | 远程媒体改用 CL 自己的扫描器，并修复全屏查看器缩略图 | implementation; see fork disposition above |
| [53ec9db4](https://github.com/cagedbird043/SillyTavern-CharacterLibrary/commit/53ec9db441f6766f45c882ca11cb150c12fc92b2) | 2026-09-12 | 详情页头像点开后一并显示远程图 | implementation; see fork disposition above |
| [e6d5c20f](https://github.com/cagedbird043/SillyTavern-CharacterLibrary/commit/e6d5c20f657e51538b5bb8057defad4560aa005c) | 2026-09-12 | 远程图自动去掉 CDN 缩放参数，取原始分辨率 | implementation; see fork disposition above |
| [6bb73460](https://github.com/cagedbird043/SillyTavern-CharacterLibrary/commit/6bb73460320965b9745f1650a39dd09024146c44) | 2026-09-13 | 画廊新增「钉到屏幕」，远程图可用且支持手机拖动 | implementation; see fork disposition above |
| [e412094d](https://github.com/cagedbird043/SillyTavern-CharacterLibrary/commit/e412094db53db00eaf8d67600d9495f3b58a5643) | 2026-09-13 | Revert "画廊新增「钉到屏幕」，远程图可用且支持手机拖动" | revert; see fork disposition above |

## suhrayuh

Head `3a285be05f8e464678ff35916cacf9ccffe72607`; 32 ahead, 8 behind upstream.

Reconciled final delta onto current upstream; retained current defaults/save guards and consolidated embedded-book conversion/import.

| Commit | Date | Purpose | Review disposition |
|---|---|---|---|
| [91835203](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/91835203445dd1aba74215c7a0e1b685ac3e06cf) | 2026-06-25 | feat: extend mobile breakpoint from 768px to 900px for iPad support | implementation; see fork disposition above |
| [8f8e0546](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/8f8e05466c7981d3929bb4d527c4fba733fb659f) | 2026-06-25 | feat: add always-edit setting, Nicknames and Alternate Fields integration | implementation; see fork disposition above |
| [f4bd3d2b](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/f4bd3d2b828b54cc1c7c7f26eb2accced4526076) | 2026-06-25 | Update Fork-Specific Changes section in README | implementation; see fork disposition above |
| [2223ccf4](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/2223ccf41a5c782a1403ef8a9e659459efd9d900) | 2026-06-26 | fix: keep Apply All button visible in greetings modal on mobile | implementation; see fork disposition above |
| [8b20b5e2](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/8b20b5e276687961cfa1790ff9228ff415e03c7a) | 2026-06-27 | fix: auto-import embedded lorebooks when importing character cards | implementation; see fork disposition above |
| [8036d65e](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/8036d65eb3839662e0a0d736da4e9dbac052ba0a) | 2026-06-28 | fix: convert V2 character_book entries to native world info format when importing | implementation; see fork disposition above |
| [edbd6d9d](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/edbd6d9dbe8e6900a182af20b3da1d138d749018) | 2026-07-02 | fix: preserve all V2/V3 character_book extension fields when importing lorebooks | implementation; see fork disposition above |
| [fba6153b](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/fba6153b38042d645e0e7c69d8d4835037ce9f11) | 2026-07-03 | fix: sync activeChar.data.extensions.world in memory after link/unlink | implementation; see fork disposition above |
| [0939d4bf](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/0939d4bfe337354d8ea529d78d6f3da576ab2c21) | 2026-07-04 | fix: refresh ST world info list and sync character world link after lorebook import | implementation; see fork disposition above |
| [d7a38081](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/d7a3808184619b9a72a1fa68a9c9b106cbc618b9) | 2026-07-06 | Add native Saucepan extraction and image proxying | implementation; see fork disposition above |
| [a96b8609](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/a96b8609f8c724648ddff521e84fbef094cbae4d) | 2026-07-07 | Link Saucepan-sourced characters to their source page | implementation; see fork disposition above |
| [3adf2c9f](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/3adf2c9fb9a533c8ea0b2c8a2de5d813e2f0a87d) | 2026-07-07 | feat: add native Saucepan extraction (PR #36 from frogicporn) | implementation; see fork disposition above |
| [57fd1f1d](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/57fd1f1daf5c09ee84fb7023f623761a9e3046f7) | 2026-07-08 | feat: Saucepan lorebook extraction + browse preview + chat count sorting + empty tag fix | implementation; see fork disposition above |
| [be54c614](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/be54c6147ce5e2dc0ca13cdb6a43575b8f6b4858) | 2026-07-10 | fix: alternate greeting sync + save-without-changes behavior | implementation; see fork disposition above |
| [fa2c6d90](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/fa2c6d90f7f7c2007a3a6cb17c93fd2dadc3098a) | 2026-07-10 | fix: auto-link imported saucepan lorebook to character | implementation; see fork disposition above |
| [0b418d69](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/0b418d69518f86903aa445b5b02f7c1763d09686) | 2026-07-11 | feat: named alternate greetings with expand modal layout improvements | implementation; see fork disposition above |
| [fa79cdf8](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/fa79cdf8c896f4d96bdbe01f8bab27fedce4d04c) | 2026-07-11 | feat: merge upstream CL v6.5.0 | implementation; see fork disposition above |
| [c4a2df07](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/c4a2df07c259071408ee9e8467250800f4cac921) | 2026-07-12 | feat: merge upstream CL v6.6.0 | implementation; see fork disposition above |
| [5ec82c03](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/5ec82c033ea1017970214d0405a8cb050ad8a9e9) | 2026-07-13 | fix: repair extension gating + improve Alt Fields popup | implementation; see fork disposition above |
| [766817e7](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/766817e7b18c9d2834d83e8b7139e49f80f6e212) | 2026-07-13 | fix: Alt Fields popup "In Use" + first-open auto-register | implementation; see fork disposition above |
| [0744edc3](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/0744edc37e2cbd0960ba9d2c611db0ffba3a9d1c) | 2026-07-14 | feat: promote Saucepan to a first-class provider | implementation; see fork disposition above |
| [eee878b1](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/eee878b150a41ed7c7a5675eb468f0440e5d1dc9) | 2026-07-14 | fix: harden provider browsing and edit safeguards | implementation; see fork disposition above |
| [b4c6c224](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/b4c6c2246e4162411140c4a501bd81782aab905f) | 2026-07-18 | fix: merge upstream v6.7.0 into Saucepan-first fork | implementation; see fork disposition above |
| [49bb047d](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/49bb047d2c37caac11201112195b87aa68aff41b) | 2026-07-18 | fix: chat sort, CORS noise, search layout, Saucepan v2 API | implementation; see fork disposition above |
| [c6adccfc](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/c6adccfc4328ebd67873b135b492493c1eb10b20) | 2026-07-18 | fix: iframe sandbox allow-scripts + suppress phantom expand buttons | implementation; see fork disposition above |
| [cfed9276](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/cfed92765b5d1dce62cae0226c617ec2356dd10a) | 2026-07-18 | fix: restore switchToMeiliSearch in DataCat search | implementation; see fork disposition above |
| [dc900d7f](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/dc900d7f13276b723db38e4b67be72af4bc9c49f) | 2026-07-19 | fix: stale originalValues leak causing false unsaved-edit popup on char-modal nav | implementation; see fork disposition above |
| [4e580018](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/4e580018415f4063f9a59e42ae199e89d5425dd8) | 2026-07-19 | fix: stale activeChar reference causes provider link to silently fail | implementation; see fork disposition above |
| [e4c0d145](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/e4c0d145b210564eb69884bad96481961527a9f7) | 2026-07-24 | fix: sanitize lorebook name on import to match ST filename rules | implementation; see fork disposition above |
| [c5c58953](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/c5c58953d8f375f2b921ee134e2614a9a6f98fba) | 2026-08-06 | Merge remote-tracking branch 'upstream/main' | merge/history; see fork disposition above |
| [58c7456d](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/58c7456d9957d14b060e4210c632bad782f9d3c0) | 2026-08-06 | Merge remote-tracking branch 'upstream/main' | merge/history; see fork disposition above |
| [3a285be0](https://github.com/suhrayuh/SillyTavern-CharacterLibrary/commit/3a285be05f8e464678ff35916cacf9ccffe72607) | 2026-08-06 | fix: restore Saucepan fork features on v7.0.1 + fix settings persistence | implementation; see fork disposition above |

## EndWorld

Head `bec221028deb6a0b91a4b74177f4794a714f9f61`; 2 ahead, 0 behind upstream.

Integrated final expanded-editor-only backdrop protection.

| Commit | Date | Purpose | Review disposition |
|---|---|---|---|
| [57626114](https://github.com/2022EndWorldBegin/SillyTavern-CharacterLibrary/commit/576261144536ca0a302c1a37cd456f575dfbc49a) | 2026-10-10 | Close modals only via close button, not backdrop click | implementation; see fork disposition above |
| [bec22102](https://github.com/2022EndWorldBegin/SillyTavern-CharacterLibrary/commit/bec221028deb6a0b91a4b74177f4794a714f9f61) | 2026-10-10 | Prevent accidental closure of expanded field editor | implementation; see fork disposition above |

## Laplace

Head `0b76a7cdee16c4696239a6e541ae9dd0f97e365e`; 3 ahead, 0 behind upstream.

Integrated repair UI; replaced unsafe absence checks and writes with shared guarded repair.

| Commit | Date | Purpose | Review disposition |
|---|---|---|---|
| [aeab33ad](https://github.com/Laplace-Lapis/SillyTavern-CharacterLibrary/commit/aeab33adf12b1ae1b58b904be06133ba516d1207) | 2026-10-14 | Add "Fix Chat Links" step to unique gallery names flow | implementation; see fork disposition above |
| [303dd2b1](https://github.com/Laplace-Lapis/SillyTavern-CharacterLibrary/commit/303dd2b1dfb517e3515cfce1de7be8f12f0ecafd) | 2026-10-14 | Merge fix-chat-links into fork | merge/history; see fork disposition above |
| [0b76a7cd](https://github.com/Laplace-Lapis/SillyTavern-CharacterLibrary/commit/0b76a7cdee16c4696239a6e541ae9dd0f97e365e) | 2026-10-14 | # 7.2.2.fork | implementation; see fork disposition above |

## Cheesedozer

Head `31980322bd8f7aab288345008108c523834170b9`; 30 ahead, 36 behind upstream.

Historical patch not merged: duplicate declarations break parsing. Reimplemented explicit proxy compatibility in current shared resolver; retained named None behavior.

| Commit | Date | Purpose | Review disposition |
|---|---|---|---|
| [89793460](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/89793460c16269220b10ce73b26944f5298596a3) | 2026-05-21 | Fix AI Studio reverse-proxy credential forwarding | implementation; see fork disposition above |
| [698b3d0e](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/698b3d0ecbfa0f2f85a85620accb6b7c5127cd0d) | 2026-05-21 | Merge pull request #1 from Cheesedozer/codex/fix-api-key-handling-in-ai-studio-function | merge/history; see fork disposition above |
| [e04f3300](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/e04f33001c623e96cb0e2c38d280483a83ec3c27) | 2026-05-21 | Update manifest.json | packaging/history; see fork disposition above |
| [3ca9f119](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/3ca9f1194107266d1b5e451338066f50fcfd3aa2) | 2026-05-21 | Handle kebab/snake proxy fields in AI Studio profiles | implementation; see fork disposition above |
| [f731e6c9](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/f731e6c91d7ef9d4b5c0ce537438e6c73b156a56) | 2026-05-21 | Merge branch 'main' into codex/fix-api-key-handling-in-ai-studio-function-g7jjr1 | merge/history; see fork disposition above |
| [333a50c5](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/333a50c5c0b4e5f58894b3e310ae6f6bf46a5e2d) | 2026-05-21 | Merge pull request #2 from Cheesedozer/codex/fix-api-key-handling-in-ai-studio-function-g7jjr1 | merge/history; see fork disposition above |
| [b440425c](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/b440425ced0bdcd7938554c0f3bad0d795347e72) | 2026-05-21 | Read proxy config from nested profile/preset variants | implementation; see fork disposition above |
| [39bb87a8](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/39bb87a8114146cc5ea7f73b13782e73bf06a6f1) | 2026-05-21 | Merge branch 'main' into codex/fix-api-key-handling-in-ai-studio-function-za94mr | merge/history; see fork disposition above |
| [e0f0e932](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/e0f0e932f70a8dc71a23bc398e6504191a80bb2a) | 2026-05-21 | Merge pull request #3 from Cheesedozer/codex/fix-api-key-handling-in-ai-studio-function-za94mr | merge/history; see fork disposition above |
| [9f3fdf67](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/9f3fdf6783a3e97d9163ba2d8efee37196048922) | 2026-05-21 | Support secret/api-url key variants in AI Studio profiles | implementation; see fork disposition above |
| [ce440bea](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/ce440bea3be0b7858e3bd24b3f1c726312caa351) | 2026-05-21 | Merge branch 'main' into codex/fix-api-key-handling-in-ai-studio-function-vjjzc6 | merge/history; see fork disposition above |
| [34649ada](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/34649ada7bfa7be8ec771ca859d7d1c59c3838b8) | 2026-05-21 | Merge pull request #4 from Cheesedozer/codex/fix-api-key-handling-in-ai-studio-function-vjjzc6 | merge/history; see fork disposition above |
| [cb8a186b](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/cb8a186bc25c90f7da705d9e1f3a97151552051f) | 2026-05-21 | Avoid getProfileValue runtime name collision in AI Studio | implementation; see fork disposition above |
| [397ec240](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/397ec240dffb20bce5502e72bb34a4047caccae4) | 2026-05-21 | Merge branch 'main' into codex/fix-api-key-handling-in-ai-studio-function-s1vo9h | merge/history; see fork disposition above |
| [3262efad](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/3262efad74e63032b4e1203fcec149cad80c761e) | 2026-05-21 | Merge pull request #5 from Cheesedozer/codex/fix-api-key-handling-in-ai-studio-function-s1vo9h | merge/history; see fork disposition above |
| [fa329ecd](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/fa329ecd04adf35bd82e055cdb6c7aed14319ebe) | 2026-05-21 | Add backward-compatible getProfileValue alias for creator init stability | implementation; see fork disposition above |
| [73bb6285](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/73bb6285b3aff8f2cafa4413c6d32e1fd8ef7d27) | 2026-05-21 | Merge branch 'main' into codex/fix-api-key-handling-in-ai-studio-function-ifu731 | merge/history; see fork disposition above |
| [9dbfddcb](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/9dbfddcb53cefb3a2e4bd9bb305ec3705f5f3df7) | 2026-05-21 | Merge pull request #6 from Cheesedozer/codex/fix-api-key-handling-in-ai-studio-function-ifu731 | merge/history; see fork disposition above |
| [c8e27522](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/c8e27522390d9ca959479189e7625aac29c345d1) | 2026-05-21 | Avoid duplicate secretId declaration in character creator LLM call | implementation; see fork disposition above |
| [4f632ad0](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/4f632ad05118b28f9bc0aa9bbe2590679e731532) | 2026-05-21 | Merge branch 'main' into codex/fix-api-key-handling-in-ai-studio-function-yi8ax6 | merge/history; see fork disposition above |
| [4577ad1b](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/4577ad1bc3e764934441f2e1945bd1c744870d2f) | 2026-05-21 | Merge pull request #7 from Cheesedozer/codex/fix-api-key-handling-in-ai-studio-function-yi8ax6 | merge/history; see fork disposition above |
| [e026cf66](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/e026cf66b33f9eba8249101cb7be01208bf73936) | 2026-05-21 | Cache-bust character-creator module import to avoid stale SyntaxError | packaging/history; see fork disposition above |
| [804f53c1](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/804f53c1d16ef3feee3fd3b20917733073a40485) | 2026-05-21 | Merge branch 'main' into codex/fix-api-key-handling-in-ai-studio-function-jfq116 | merge/history; see fork disposition above |
| [4f2870f2](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/4f2870f24daa8dd2ec2c5d318ba391f360200424) | 2026-05-21 | Merge pull request #8 from Cheesedozer/codex/fix-api-key-handling-in-ai-studio-function-jfq116 | merge/history; see fork disposition above |
| [b3473174](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/b347317405de186429cc69b17c6226a0b518cc78) | 2026-05-21 | Bump module-loader asset version to invalidate stale loader cache | packaging/history; see fork disposition above |
| [b9cfb848](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/b9cfb848ec7ad600a571e8d4fa0be2c340e30e90) | 2026-05-21 | Merge branch 'main' into codex/fix-api-key-handling-in-ai-studio-function-cqc20d | merge/history; see fork disposition above |
| [b10dd073](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/b10dd0733c322b205118bdd6f6fdd2741e02e7b0) | 2026-05-21 | Merge pull request #9 from Cheesedozer/codex/fix-api-key-handling-in-ai-studio-function-cqc20d | merge/history; see fork disposition above |
| [5ed5cabb](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/5ed5cabbc97594d4e561776dc060a5c293445a2e) | 2026-05-21 | Bump loader and creator module cache-bust versions to v32 | packaging/history; see fork disposition above |
| [7a2194b8](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/7a2194b85c8b8b40810fdeebb8fa99896e2e433a) | 2026-05-21 | Merge branch 'main' into codex/fix-api-key-handling-in-ai-studio-function-r84r40 | merge/history; see fork disposition above |
| [31980322](https://github.com/Cheesedozer/SillyTavern-CharacterLibrary-Cheesedozer-Edition/commit/31980322bd8f7aab288345008108c523834170b9) | 2026-05-21 | Merge pull request #10 from Cheesedozer/codex/fix-api-key-handling-in-ai-studio-function-r84r40 | merge/history; see fork disposition above |

## MrDfour

Head `fa553b5dae8a4fcaa7b6c507ba4e27eddc04e391`; 9 ahead, 38 behind upstream.

Ported Chub topic normalization/fallback with malformed-value handling. Excluded redundant post-import card write and fork naming/path changes; no ST tagMap sync claim.

| Commit | Date | Purpose | Review disposition |
|---|---|---|---|
| [cb587e5a](https://github.com/MrDfour/SillyTavern-CharacterLibrary-Test/commit/cb587e5a56137c3d88ace434708079bfa25c7a25) | 2026-05-03 | Apply card tags to character on import via merge-attributes API | implementation; see fork disposition above |
| [66c86dcd](https://github.com/MrDfour/SillyTavern-CharacterLibrary-Test/commit/66c86dcd2eb13580b2fce63224765d86ae580afc) | 2026-05-03 | Merge pull request #1 from MrDfour/copilot/add-import-tags-for-character-cards | merge/history; see fork disposition above |
| [c985cf42](https://github.com/MrDfour/SillyTavern-CharacterLibrary-Test/commit/c985cf42606e43730cb31442b507ff85c6c526a2) | 2026-05-03 | Update display name and version in manifest.json | packaging/history; see fork disposition above |
| [12d5eeaa](https://github.com/MrDfour/SillyTavern-CharacterLibrary-Test/commit/12d5eeaacb966b0f465a4d8c881562c1859bc773) | 2026-05-03 | Update extension name and directory constants | packaging/history; see fork disposition above |
| [e062fc5a](https://github.com/MrDfour/SillyTavern-CharacterLibrary-Test/commit/e062fc5a4904a27799829a58565dc913149fbc2d) | 2026-05-03 | Fix CL_SETTINGS_KEY for character gallery | implementation; see fork disposition above |
| [4650a383](https://github.com/MrDfour/SillyTavern-CharacterLibrary-Test/commit/4650a3836a3e7ecf445b3bc3da2928a1dba5bf01) | 2026-05-03 | Fix EXTENSION_DIR to match actual repository folder name | implementation; see fork disposition above |
| [edda2544](https://github.com/MrDfour/SillyTavern-CharacterLibrary-Test/commit/edda2544f0dbbe8e32e05daf93dc2ae1730835e1) | 2026-05-03 | Merge pull request #2 from MrDfour/copilot/debug-main-page-load-issue | merge/history; see fork disposition above |
| [89dd07d4](https://github.com/MrDfour/SillyTavern-CharacterLibrary-Test/commit/89dd07d4b3fc6d6580879e9a9b6c254bcd425c6f) | 2026-05-03 | Fix Chub tag import by normalizing topics from metadata API | implementation; see fork disposition above |
| [fa553b5d](https://github.com/MrDfour/SillyTavern-CharacterLibrary-Test/commit/fa553b5dae8a4fcaa7b6c507ba4e27eddc04e391) | 2026-05-03 | Merge pull request #3 from MrDfour/copilot/fix-importing-tags-feature | merge/history; see fork disposition above |
