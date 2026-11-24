# AppCore — Your Apps. One Core.

Private owner-only mobile-first PWA for application administration.

## Architecture
- Dashboard: authenticated responsive Arabic/English PWA.
- Backend: authenticated admin API, server-side Firebase Admin credentials, audit log, deny-by-default authorization.
- Android SDK: independent update and notification modules; per-app configuration.
- Releases: per-app signed APKs hosted on public distribution endpoints; never embed GitHub credentials in clients. Private repositories require a separate distribution mechanism.
- Update metadata: package ID, version code/name, HTTPS URL, size, SHA-256, release notes, signing identity, channel and minimum supported version. Publish only after explicit approval and CI validation.
- Installer: verify package identity, signer, hash and version; request per-app unknown-source permission via Android settings only when needed, explain the permission first, persist pending download, recheck on return and launch system installer with user consent.
- Notifications: FCM through trusted backend; opt-in, per-app targeting, test audience, audit and rate limits. No client-side admin credentials.
- Analytics: minimal aggregate version metrics, consent where required, no financial or personal application data.

## Acceptance gates
1. Owner-only dashboard authentication and authorization tests.
2. Signed APK A/B/C device update tests, permission return, interruption, rejection of invalid APKs and preservation of user data.
3. FCM test-device delivery before production broadcast.
4. No changes to existing application branches until integration is explicitly staged.

## Status
Architecture only; deployment, Firebase configuration, SDK implementation and device validation pending.
