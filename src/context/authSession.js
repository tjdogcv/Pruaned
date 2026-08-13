export const LEGACY_SESSION_KEY = 'pruaned_session';
export const LEGACY_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export function loadLegacySession(storage, now = Date.now()) {
  try {
    const raw = storage.getItem(LEGACY_SESSION_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (!session?.user || !Number.isFinite(session.expiresAt) || now > session.expiresAt) {
      storage.removeItem(LEGACY_SESSION_KEY);
      return null;
    }

    return session;
  } catch {
    storage.removeItem(LEGACY_SESSION_KEY);
    return null;
  }
}

export function clearLegacySession(storage) {
  storage.removeItem(LEGACY_SESSION_KEY);
}

export function validateSupabaseSession({ session, user, sessionError, userError, now = Date.now() }) {
  const expiresAtMs = Number(session?.expires_at) * 1000;
  const isCurrent = Number.isFinite(expiresAtMs) && expiresAtMs > now;
  const isValid = !sessionError && !userError && !!session?.access_token && isCurrent && !!user?.email;

  return {
    isValid,
    shouldClearLegacySession: !isValid
  };
}

export function getSignedOutAuthState() {
  return {
    currentUser: null,
    is2FAVerified: false,
    isAuthRestoring: false
  };
}

export function getPrivateRouteState({ isAuthRestoring, currentUser, is2FAVerified }) {
  if (isAuthRestoring) return 'restoring';
  return currentUser && is2FAVerified ? 'allowed' : 'unauthorized';
}
