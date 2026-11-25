# Unified identity standard

Canonical project IDs: exmore, altabloh, appcore. Android application IDs: com.exmore.app, com.altabloh.app, com.appcore.admin respectively. AppCore Android is future-only; no Firebase Android registration or device access is enabled.

Existing Firestore document IDs and FCM topics remain unchanged. The dashboard adds canonical metadata without deleting or moving records. Historical 3al-tabloh storage routing is intentional. Existing release, analytics, configuration and notification records must not be blindly copied or renamed. Android package aliases and Firebase app/stream IDs require verification from the actual application projects before registration or live routing changes. Never treat package IDs as Firebase app IDs.

Remaining gates: verify live Firebase registrations, analytics streams, FCM subscriptions and signed APK identity; reconcile any duplicate canonical and legacy documents before changing storage routing. No paid services or hosting changes.
