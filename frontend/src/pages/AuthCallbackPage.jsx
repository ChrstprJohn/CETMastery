import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { auth } from '../lib/auth.js';

export default function AuthCallbackPage() {
  const [callbackUrl] = useState(() => window.location.href);
  const [destination] = useState(() => sessionStorage.getItem('cetmastery-auth-return') === '/admin' ? '/admin' : '/?auth=success');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const completion = auth.completeCallback(callbackUrl);
    window.history.replaceState(null, '', '/auth/callback');
    completion.then(() => { if (active) { sessionStorage.removeItem('cetmastery-auth-return'); window.location.replace(destination); } })
      .catch((failure) => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, [callbackUrl, destination]);

  async function retry() {
    setBusy(true);
    try { await auth.startSignIn(window.location.origin); }
    catch (failure) { setError(failure.message); setBusy(false); }
  }

  // Successful callbacks are a silent handoff; show a page only if recovery is needed.
  if (!error) return null;

  return <main className="auth-callback-page">
    <a href="/" className="auth-callback-brand">CETMastery.</a>
    <div className="auth-callback-card">
      <span className="auth-mark"><BookOpen size={27} aria-hidden="true" /></span>
      <h1>Let’s try that again</h1>
      <p role={error ? 'alert' : 'status'}>{error}</p>
      {error && <button className="button button-dark auth-full-width" type="button" onClick={retry} disabled={busy}>{busy ? 'Opening Google…' : 'Try Google again'}</button>}
      <a className="text-button" href="/">Back to homepage</a>
    </div>
  </main>;
}
