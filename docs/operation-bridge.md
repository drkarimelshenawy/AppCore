# Operation bridge — activation pending
The existing operation-request push workflow is retained. No default-branch changes, credential values or deployment are included.
- Store a dedicated repository-scoped fine-grained credential with Contents write in Cloudflare Worker secret APPCORE_OPERATION_TOKEN. Never expose it to the dashboard or commit it. Its repository access is broader than the fixed-path bridge; use a short expiry and rotate/revoke it if exposed.
- Set APPCORE_OPERATION_BRIDGE=true only after validating deployed owner authentication and the worker version. Until then the route returns 503.
- APPCORE_AUTO_CYCLE=true is separately opt-in. Existing cron must include minute 0 UTC each hour. Cycle runs health and only the analytics/diagnostic imports separately enabled in GitHub variables. No automatic notification operation.
- The dashboard shows a commit receipt, not an FCM delivery receipt. Review the existing job status and GitHub run. Do not retry an unconfirmed send blindly. Existing claim transactions guard against duplicate delivery attempts.
- Existing public config guardian is preserved. The schedule on GitHub default branch is a separate issue; verify the currently deployed renewal path.
