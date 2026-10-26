import { useEffect, useRef, useState } from 'react';
import { BookOpen, Check, X } from 'lucide-react';
import { auth } from '../lib/auth.js';

export default function AuthDialog({ mode, onClose, account, signedIn, loading, error: accountError, retry }) {
  const dialogRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    setBusy(false);
    if (mode && !dialogRef.current.open) dialogRef.current.showModal();
    if (!mode && dialogRef.current.open) dialogRef.current.close();
  }, [mode]);

  async function signIn() {
    setBusy(true);
    setError('');
    try { sessionStorage.removeItem('cetmastery-auth-return'); await auth.startSignIn(window.location.origin); }
    catch (failure) { setError(failure.message); setBusy(false); }
  }

  async function signOut() {
    setBusy(true);
    setError('');
    try {
      const { warning } = await auth.signOut();
      if (warning) setError(warning);
      else onClose();
    }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  return <dialog ref={dialogRef} className="auth-dialog" aria-labelledby="auth-title" aria-describedby="auth-description" onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="auth-dialog-content" data-ui>
      <button type="button" className="auth-close" aria-label="Close sign-in dialog" onClick={onClose}><X size={21} aria-hidden="true" /></button>
      <span className="auth-mark"><BookOpen size={27} aria-hidden="true" /></span>
      <h2 id="auth-title">{signedIn ? 'Your account' : mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
      <p id="auth-description">{signedIn ? 'Your next chapter with CETMastery.' : mode === 'signup' ? 'A place to begin your college preparation journey.' : 'Sign in to continue your CETMastery journey.'}</p>
      {loading ? <p className="auth-status" role="status">Loading your account…</p> : account ? <>
        <p className="auth-success"><Check size={18} aria-hidden="true" /> Your account is ready.</p>
        <dl className="account-details">
          <div><dt>Name</dt><dd>{account.profile?.displayName || 'Not set yet'}</dd></div>
          <div><dt>Email</dt><dd>{account.user.email || 'Not provided'}</dd></div>
          <div><dt>Sign-in method</dt><dd>Google</dd></div>
        </dl>
        <button className="button button-dark auth-full-width" type="button" onClick={signOut} disabled={busy}>{busy ? 'Signing out…' : 'Sign out'}</button>
      </> : signedIn ? <div className="auth-status">
        <p role="alert">{accountError}</p>
        <button type="button" className="button button-dark auth-full-width" onClick={retry}>Try again</button>
        <button type="button" className="text-button" onClick={signOut} disabled={busy}>Sign out</button>
      </div> : <>
        <button type="button" className="google-button" onClick={signIn} disabled={busy}><img src="/images/google-g.png" alt="" width="20" height="20" />{busy ? 'Opening Google…' : 'Continue with Google'}</button>
        <p className="auth-note">Your first Google sign-in creates your account. Already joined? The same button logs you in.</p>
        <p className="auth-preview-note">The sample practice remains open to everyone. Saved learning progress is coming later.</p>
      </>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  </dialog>;
}
