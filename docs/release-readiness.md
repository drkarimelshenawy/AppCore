# Release gate
Do not deploy until the complete CI run is green. Emulator integration checks callable transport and unauthenticated rejection; it does not establish production connectivity or authenticated browser operation.
Before production: confirm Firebase Functions billing eligibility, deployment IAM permissions, Firestore rules and indexes, and owner-only authenticated smoke tests. Never send real notifications during smoke tests without an explicitly registered test device. No Android app integration or telemetry ingestion is implied by dashboard deployment.
