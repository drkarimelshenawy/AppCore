# Operation bridge — activation pending
The existing operation-request push workflow is retained. No default-branch changes, credential values or deployment are included.
- Store a dedicated repository-scoped fine-grained credential with Contents write in Cloudflare Worker secret APPCORE_OPERATION_TOKEN. Never expose it to the dashboard or commit it. Its repository access is broader than the fixed-path bridge; use a short expiry and rotate/revoke it if exposed.
- Set APPCORE_OPERATION_BRIDGE=true only after validating deployed owner authentication and the worker version. Until then the route returns 503.
- APPCORE_AUTO_CYCLE=true is separately opt-in. Existing cron must include minute 0 UTC each hour. Cycle runs health and only the analytics/diagnostic imports separately enabled in GitHub variables. No automatic notification operation.
- The dashboard shows a commit receipt, not an FCM delivery receipt. Review the existing job status and GitHub run. Do not retry an unconfirmed send blindly. Existing claim transactions guard against duplicate delivery attempts.
- Existing public config guardian is preserved. The schedule on GitHub default branch is a separate issue; verify the currently deployed renewal path.

## Optional read-only status connections
- APPCORE_GITHUB_READ_TOKEN: separate fine-grained credential with Actions read for exactly AppCore, ExMore and AlTabloh. No write permission is required. The response contains up to 10 recent runs per fixed development branch.
- APPCORE_SENTRY_TOKEN: read-only event:read credential. Set APPCORE_SENTRY_REGION to us or de, APPCORE_SENTRY_ORG to the verified organization slug, and APPCORE_SENTRY_PROJECT_ID to the verified numeric AlTabloh Web project ID. No raw titles, event payloads, user details or secrets are returned to the dashboard.
- Both services explicitly report not-configured or unavailable when no valid result exists. No service is considered activated by code alone.

## Catalog pilot boundary
The dashboard defaults to pilotCatalog, an independent public collection for synthetic fixtures only. Production publication requires an explicit selection and confirmation. Pilot inspection must never merge or overwrite local vehicle/service records. This is logical catalog isolation, not a separate Firebase project or full environment isolation. Shared authentication, diagnostics and public config still require environment planning before wider rollout.

## Release pilot fixture
The owner can create/delete a fixed synthetic PILOT-ONLY record under pilotReleases/{storageAppId}. It has no APK link and is never fetched by automatic production update checks. Only the explicitly paired test UI should request it. No production release revision is consumed by the fixture.

## Discoverable catalog
Explicit publication/revocation updates its own catalog index in the same Firestore transaction. Maximum 200 indexed records per scope/kind; clients load bounded pages, never overwrite the bundled research snapshot or personal records. Previously published records remain available by ID but are only discoverable after explicit republication. Indexes contain only public record IDs, not user data. Collection listing remains owner-only.
