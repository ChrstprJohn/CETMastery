export async function attachAccessToken(config, client) {
  if (!client) return config;
  const { data } = await client.auth.getSession();
  config.headers ??= {};
  if (data?.session?.access_token) config.headers.Authorization = `Bearer ${data.session.access_token}`;
  else delete config.headers.Authorization;
  return config;
}

export function createAuthService(client, api) {
  let callbackTask;

  function requireClient() {
    if (!client) throw new Error('Google sign-in is not configured yet. Please try again later.');
    return client;
  }

  async function startSignIn(origin) {
    const { error } = await requireClient().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: new URL('/auth/callback', origin).href,
        scopes: 'openid email profile',
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw new Error('Google sign-in could not start. Please try again.');
  }

  async function loadAccount() {
    const response = await api.get('/auth/me');
    if (response.data.data.profile) return response.data.data;
    return (await api.post('/auth/session', {})).data.data;
  }

  function completeCallback(href) {
    // React StrictMode may mount twice; PKCE codes must only be exchanged once.
    callbackTask ??= (async () => {
      const params = new URL(href).searchParams;
      if (params.has('error')) throw new Error('Google sign-in was cancelled or could not complete. Please try again.');
      const code = params.get('code');
      if (params.getAll('code').length !== 1 || !code || code.length > 4096 || /\s/.test(code)) {
        throw new Error('This sign-in link is missing or expired. Please start again.');
      }
      const { data, error } = await requireClient().auth.exchangeCodeForSession(code);
      if (error || !data.session) throw new Error('This sign-in link could not be verified. Please start again in the same browser.');
      try { return (await api.post('/auth/session', {})).data.data; }
      catch { throw new Error('Google sign-in succeeded, but your account could not load. Return home and try again.'); }
    })();
    return callbackTask;
  }

  async function signOut() {
    const authClient = requireClient().auth;
    const { error } = await authClient.signOut({ scope: 'local' });
    if (error) {
      const { data, error: sessionError } = await authClient.getSession();
      if (sessionError || data?.session) throw new Error('Your browser session could not be cleared. Please try again.');
      return { warning: 'You’re signed out on this browser. The server could not confirm session revocation.' };
    }
    return {};
  }

  return { startSignIn, loadAccount, completeCallback, signOut };
}
