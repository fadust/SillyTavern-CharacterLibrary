# Datacat Direct Import companion

Open [setup instructions](README.html). This is a local, unpacked Chrome MV3 extension for Character Library; it is not the Datacat site's official extension.

The Library first tries cl-helper. If Datacat requires verification, this companion opens a normal Datacat tab, invokes `DatacatCharacterExport.buildPngPayload` with the selected identity/definition/version, and relays only the official PNG back. Creator restrictions, human verification, the 32 MB cap, real-artwork requirement, and Library's import checks remain enforced. The normal import pipeline handles embedded/linked lorebooks and supported images after a successful export.

Its only named permission is `storage`, used for pending request records in `chrome.storage.session`, so Chrome can suspend the service worker during verification. Content scripts run only on `datacat.run` and the local Library page. There is no account-storage access, token/cookie extraction, arbitrary proxy, download/file permission, telemetry, or persisted export history. Requests are bound to both tabs and a nonce; reloading Library cancels its old job.

Tests: `node --test tests/datacat/direct-bridge.test.mjs` from the repository root. Automated checks use the production transport with mocked Chrome/site APIs; they are not live Datacat proof. See the task's validation report for live results.
