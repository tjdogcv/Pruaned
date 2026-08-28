import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  LEGACY_SESSION_KEY,
  clearLegacySession,
  createRestorationEpoch,
  getPrivateRouteState,
  getSignedOutAuthState,
  loadLegacySession,
  validateSupabaseSession
} from '../src/context/authSession.js';

const NOW = 1_750_000_000_000;

function createStorage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

function currentSession() {
  return { access_token: 'not-persisted-by-this-helper', expires_at: NOW / 1000 + 60 };
}

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

test('una sesión Supabase válida permite restaurar el gate OTP', () => {
  const validation = validateSupabaseSession({
    session: currentSession(),
    user: { email: 'socia@pruaned.cl' },
    now: NOW
  });

  assert.equal(validation.isValid, true);
  assert.equal(
    getPrivateRouteState({ isAuthRestoring: false, currentUser: { email: 'socia@pruaned.cl' }, is2FAVerified: validation.isValid }),
    'allowed'
  );
});

test('SIGNED_OUT invalida una restauracion cuyo getUser termina tarde', async () => {
  const restorationEpoch = createRestorationEpoch();
  const validationEpoch = restorationEpoch.capture();
  const delayedGetUser = deferred();
  let restoredUser = null;
  let restoredOtp = false;

  const restore = delayedGetUser.promise.then((user) => {
    const validation = validateSupabaseSession({ session: currentSession(), user, now: NOW });
    if (validation.isValid && restorationEpoch.isCurrent(validationEpoch)) {
      restoredUser = user;
      restoredOtp = true;
    }
  });

  const signedOutState = getSignedOutAuthState();
  restorationEpoch.invalidate();
  assert.equal(restorationEpoch.capture(), null);
  delayedGetUser.resolve({ email: 'socia@pruaned.cl' });
  await restore;

  assert.equal(restoredUser, null);
  assert.equal(restoredOtp, false);
  assert.equal(getPrivateRouteState({ ...signedOutState }), 'unauthorized');
});

test('una sesión local devuelta por getSession no concede acceso si getUser falla', () => {
  const validation = validateSupabaseSession({
    session: currentSession(),
    user: null,
    userError: new Error('JWT revocado'),
    now: NOW
  });

  assert.deepEqual(validation, { isValid: false, shouldClearLegacySession: true });
  assert.equal(
    getPrivateRouteState({ isAuthRestoring: false, currentUser: null, is2FAVerified: validation.isValid }),
    'unauthorized'
  );
});

test('el contexto de autenticación no contiene un usuario maestro hardcodeado', () => {
  const source = fs.readFileSync(new URL('../src/context/AuthContext.jsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /const\s+USER_DATABASE\s*=\s*\[/);
  assert.doesNotMatch(source, /ag\.pruaned@gmail\.com/);
});

test('la sesión no se persiste en localStorage y Supabase manda a memoria de sesión', () => {
  const authContext = fs.readFileSync(new URL('../src/context/AuthContext.jsx', import.meta.url), 'utf8');
  const supabaseClient = fs.readFileSync(new URL('../src/lib/supabase.js', import.meta.url), 'utf8');

  assert.doesNotMatch(authContext, /localStorage\.setItem\(['"]pruaned_session['"]/);
  assert.doesNotMatch(authContext, /localStorage\.setItem\(['"]pruaned_auth_attempts['"]/);
  assert.match(supabaseClient, /persistSession:\s*false/);
});

test('las mutaciones de noticias y categorías deben validar permisos vía RPC del backend', () => {
  const source = fs.readFileSync(new URL('../src/context/useContentDomain.js', import.meta.url), 'utf8');

  assert.match(source, /pruaned_can_publish_cms/);
  assert.match(source, /pruaned_can_manage_categories/);
});

test('sesión ausente, expirada o revocada simulada falla cerrada', () => {
  assert.equal(validateSupabaseSession({ session: null, user: null, now: NOW }).isValid, false);
  assert.equal(
    validateSupabaseSession({
      session: { access_token: 'expired', expires_at: NOW / 1000 - 1 },
      user: { email: 'socia@pruaned.cl' },
      now: NOW
    }).isValid,
    false
  );
  assert.equal(
    validateSupabaseSession({
      session: currentSession(),
      user: { email: 'socia@pruaned.cl' },
      sessionError: new Error('refresh token revoked'),
      now: NOW
    }).isValid,
    false
  );
});

test('SIGNED_OUT limpia el estado de autenticación y el estado legado propio', () => {
  const storage = createStorage({ [LEGACY_SESSION_KEY]: '{"user":{"email":"stale@pruaned.cl"}}', other: 'preservar' });

  clearLegacySession(storage);
  assert.equal(storage.getItem(LEGACY_SESSION_KEY), null);
  assert.equal(storage.getItem('other'), 'preservar');
  assert.deepEqual(getSignedOutAuthState(), {
    currentUser: null,
    is2FAVerified: false,
    isAuthRestoring: false
  });
});

test('el guard permanece en carga y no redirige durante la restauración', () => {
  assert.equal(
    getPrivateRouteState({ isAuthRestoring: true, currentUser: { email: 'stale@pruaned.cl' }, is2FAVerified: true }),
    'restoring'
  );
});

test('el fallback offline conserva el TTL legado y elimina una sesión expirada', () => {
  const validStorage = createStorage({
    [LEGACY_SESSION_KEY]: JSON.stringify({ user: { email: 'demo@pruaned.cl' }, expiresAt: NOW + 60_000 })
  });
  assert.deepEqual(loadLegacySession(validStorage, NOW), {
    user: { email: 'demo@pruaned.cl' },
    expiresAt: NOW + 60_000
  });

  const expiredStorage = createStorage({
    [LEGACY_SESSION_KEY]: JSON.stringify({ user: { email: 'demo@pruaned.cl' }, expiresAt: NOW - 1 })
  });
  assert.equal(loadLegacySession(expiredStorage, NOW), null);
  assert.equal(expiredStorage.getItem(LEGACY_SESSION_KEY), null);
});
