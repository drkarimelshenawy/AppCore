# Universal Integration Standard v1

Canonical project/platform pair is the routing boundary. Android package is metadata, never a credential. Existing legacy Firestore routes and release SDK remain supported. Public read-only config endpoint: GET /api/v1/apps/{projectId}/{platform}/config. JSON schemaVersion 1, projectId, platform, revision, expiresAt (epoch ms), maintenance boolean, boolean flags. Max TTL 24h. No device or user data. No public writes. Missing/invalid/expired data uses local defaults; cached revisions cannot roll back. Maintenance applies only to optional connected features, never local data, reminders, financial records or recovery. No mandatory update.

Admin: existing Firebase owner authentication and rules; retain audit and draft revision controls. Device registration and push require verified provider credentials, explicit consent and scoped installation tokens; no public ingestion or embedded secrets. Do not use hardware IDs. Analytics/crash summaries use existing providers, aggregate counts only; no financial, location, vehicle, notes or personal records. No duplicate collectors. Existing website monitor and FCM validation remain. No new paid services.

## Verified source inventory
AppCore 9c61106: owner gateway, optional release, config drafts, analytics/crash reads, FCM validation, website monitoring. ExMore 2c273dc: Kotlin AppCoreReleaseClient, local notifications. 3al-Tabloh 47ad106: Capacitor shared web bundle, local notifications, production-only GA and Sentry code. Live provider delivery not verified.

## ExMore execution
On feat/exmore-official-identity-migration inspect current HEAD; retain AppCoreReleaseClient and local reminders. Implement Kotlin v1 config reader with 5s timeouts, strict target/schema/expiry/revision validation, bounded cache, offline defaults; never gate local startup. Add tests for invalid response, offline, rollback and cross-project. Verify existing Firebase registration before adding FCM; no duplicate analytics or secrets. Run existing signed release workflow and report APK and tests.

## 3al-Tabloh execution
On feat/official-identity-migration-20261125 inspect current HEAD; integrate shared SDK into existing build-app/prepare-android pipeline; distinguish Capacitor native Android from hosted web. Retain local notifications and existing GA/Sentry, no duplicate telemetry. Verify provider mapping and consent before enabling remote push. Test offline PWA and packaged Android, schema isolation, cache expiry; run npm run build:android:web and existing signed Android workflow.

## Release gates
Public config publication deliberately disabled until owner-only validated publication and rollback are implemented and tested. No live config records created. Worker deployment, provider verification, device registration and push delivery remain gates. AppCore Android remains future-only.
