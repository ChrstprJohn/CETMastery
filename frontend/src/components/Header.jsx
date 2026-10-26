import { useState } from 'react';
import { ArrowUpRight, BookOpen, Menu, X } from 'lucide-react';

export function Brand({ footer = false }) {
  return <a className={`brand${footer ? ' brand-footer' : ''}`} href="#home" aria-label="CETMastery home">
    <span className="brand-symbol"><BookOpen size={24} strokeWidth={1.8} aria-hidden="true" /></span>
    <span>CET<span className="brand-light">Mastery</span><span className="brand-period">.</span></span>
  </a>;
}

export default function Header() {
  const [open, setOpen] = useState(false);
  return <header className="site-header">
    <Brand />
    <button className="menu-toggle" type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>
      {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
    </button>
    <nav id="main-nav" className={open ? 'navigation is-open' : 'navigation'} aria-label="Main navigation" onClick={() => setOpen(false)}>
      <a href="#approach">Our approach</a><a href="#practice">Practice</a><a href="#questions">Questions</a>
      <a href="#practice" className="nav-action">Try a question <ArrowUpRight size={17} aria-hidden="true" /></a>
    </nav>
  </header>;
}
