# Operational gates

Consolidated deployment verifies tests, deploys Firestore rules, then the preview dashboard. The existing deploy identity must have permission to publish Firestore rules; do not grant broad project ownership.

Analytics: existing daily cache is read-only until the real GA4 property IDs and reporting identity permissions are confirmed. Crash reports: existing cache is read-only until an actual supported crash reporting source is configured. Empty cache is not evidence of zero crashes.

Notifications: FCM validation is not delivery. Actual delivery requires a registered test device, a verified service credential and an idempotent dispatch path. Release publication requires verified artifact/version and atomic audit. Keep both disabled until verified. No production APK or main merge.
