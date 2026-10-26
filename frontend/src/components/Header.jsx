import { useEffect, useState } from 'react';
import { BookOpen, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import AuthDialog from './AuthDialog.jsx';

export function Brand({ footer = false }) {
  return <a className={`brand${footer ? ' brand-footer' : ''}`} href="#home" aria-label="CETMastery home">
    <span className="brand-symbol"><BookOpen size={24} strokeWidth={1.8} aria-hidden="true" /></span>
    <span>CET<span className="brand-light">Mastery</span><span className="brand-period">.</span></span>
  </a>;
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('auth') === 'success' ? 'account' : null;
  });
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('auth') === 'success') {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    }
  }, []);
  const account = useAuth();
  return <><header className="site-header">
    <Brand />
    <button className="menu-toggle" type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>
      {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
    </button>
    <nav id="main-nav" className={open ? 'navigation is-open' : 'navigation'} aria-label="Main navigation" onClick={() => setOpen(false)}>
      <a href="#approach">Our approach</a><a href="#practice">Practice</a><a href="#questions">Questions</a>
      <div className="nav-auth-actions">
        {account.signedIn ? <button type="button" className="nav-action" onClick={() => setMode('account')}>Your account</button> : <>
          <button type="button" className="nav-login" onClick={() => setMode('login')}>Log in</button>
          <button type="button" className="nav-action" onClick={() => setMode('signup')}>Sign up</button>
        </>}
      </div>
    </nav>
  </header><AuthDialog mode={mode} onClose={() => setMode(null)} {...account} /></>;
}
