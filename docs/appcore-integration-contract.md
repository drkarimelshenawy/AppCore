# AppCore integration boundary

Admin gateway: authenticated Firebase owner reads only. Delegated GitHub proof validates FCM without sending. Neither grants device access.

Remote configuration drafts: separate Android/Web documents, optimistic revisions, owner-only rules. Drafts are never consumed by devices. Production publication, public allowlisted configuration endpoint, installation identity, offline cache, Android/Web SDK integration and device tests remain release gates.

Do not embed administrator credentials or service tokens in either application. Do not enable forced updates or maintenance remotely until device recovery and rollback are verified.
