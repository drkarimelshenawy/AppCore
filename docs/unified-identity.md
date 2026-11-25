# Unified identity standard

Canonical project IDs: exmore, altabloh, appcore. Android application IDs: com.exmore.app, com.altabloh.app, com.appcore.admin respectively. AppCore Android is future-only; no Firebase Android registration or device access is enabled.

For ع التابلوه, `com.altabloh.app` is canonical and `com.drkarimelshenawy.altabloh` is retained as a legacy Android identity. Android and Web are platforms of the single `altabloh` project. The signed Android 1.0.2.0 artifact (versionCode 1000200) was package/certificate verified on commit 47ad106b1bce27ff747ae254a2e42b8d8997cc08.

Existing Firestore document IDs and FCM topics remain unchanged. The dashboard adds canonical metadata without deleting or moving records. Historical 3al-tabloh storage routing is intentional. Existing release, analytics, configuration and notification records must not be blindly copied or renamed. Android package aliases and Firebase app/stream IDs require verification from the actual application projects before registration or live routing changes. Never treat package IDs as Firebase app IDs.

Remaining gates: verify live Firebase registrations, analytics streams and FCM subscriptions; reconcile any duplicate canonical and legacy documents before changing storage routing. No paid services or hosting changes.

ExMore source identity verified at af8bb36bfc9e2385f65b9b09ec1657804df40b89 (4.4.2, code 81); baseline 453fba1f3ffdd9097c118c595542e8b56824e695 confirms legacy com.todoshift.app. APK verification remains pending because build run 45528270720 failed. Firebase registration remains unverified.
