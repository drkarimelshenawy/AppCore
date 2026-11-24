// Separate Google service authorization from interactive Firebase user identity.
export function createGoogleCredentialProvider({ acquire, now = Date.now } = {}) {
  if (typeof acquire !== "function") throw new TypeError("Credential acquisition adapter required");
  let cached, pending;
  return {
    async getAccessToken() {
      if (cached && cached.expiresAt > now() + 60000) return cached.accessToken;
      if (!pending) {
        pending = Promise.resolve().then(acquire).then(value => {
          if (typeof value?.accessToken !== "string" || !value.accessToken ||
              !Number.isFinite(value.expiresAt) || value.expiresAt <= now() + 60000) {
            throw new Error("Invalid or expiring Google credential");
          }
          cached = { accessToken: value.accessToken, expiresAt: value.expiresAt };
          return cached.accessToken;
        }).finally(() => { pending = undefined; });
      }
      return pending;
    }
  };
}
