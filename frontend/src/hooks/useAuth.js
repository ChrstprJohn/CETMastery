import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { auth } from '../lib/auth.js';

export function useAuth() {
  const [session, setSession] = useState(supabase ? undefined : null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    // Keep this callback synchronous; API work runs outside Supabase's auth lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (!session) {
      setAccount(null);
      setLoading(false);
      setError('');
      return;
    }
    let active = true;
    setAccount(null);
    setLoading(true);
    setError('');
    auth.loadAccount()
      .then((value) => { if (active) setAccount(value); })
      .catch(() => { if (active) setError('Your account could not load. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session?.access_token, session === undefined, retry]);

  return { account, signedIn: Boolean(session), loading, error, retry: () => setRetry((value) => value + 1) };
}
