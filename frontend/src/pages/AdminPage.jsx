import { useEffect, useRef, useState } from 'react';
import { BookOpen, Plus, Pencil, Trash2, X, ArrowLeft } from 'lucide-react';
import { auth } from '../lib/auth.js';
import { useAuth } from '../hooks/useAuth.js';
import { api } from '../lib/api.js';
import './admin.css';
const resources = ['subjects', 'topics', 'lessons'];
const singular = { subjects: 'subject', topics: 'topic', lessons: 'lesson' };
const failureMessage = (e) => e.response?.data?.error?.message || 'Could not reach the server. Please try again.';
const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 160).replace(/-$/, '');
function Editor({ resource, entry, data, close, saved }) {
  const dialog = useRef(null);
  const lesson = resource === 'lessons', subject = resource === 'subjects';
  const titleKey = subject ? 'name' : 'title', textKey = lesson ? 'summary' : 'description';
  const [subjectId, setSubjectId] = useState(lesson ? data.topics.find(t => t.id === entry?.topicId)?.subjectId || '' : '');
  const [form, setForm] = useState({ [titleKey]: entry?.[titleKey] || '', slug: entry?.slug || '', [textKey]: entry?.[textKey] || '', sortOrder: entry?.sortOrder ?? 0, isPublished: entry?.isPublished ?? false, ...(!subject && { [lesson ? 'topicId' : 'subjectId']: entry?.[lesson ? 'topicId' : 'subjectId'] || '' }), ...(lesson && { content: entry?.content || '' }) });
  const [slugEdited, setSlugEdited] = useState(Boolean(entry));
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { dialog.current.showModal(); }, []);
  const change = (key, value) => setForm(f => ({ ...f, [key]: value }));
  async function save(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { const body = { ...form, sortOrder: Number(form.sortOrder) }; if (entry) await api.put(`/admin/${resource}/${entry.id}`, body); else await api.post(`/admin/${resource}`, body); saved(`${entry ? 'Updated' : 'Created'} ${singular[resource]}.`); }
    catch (e) { setError(failureMessage(e)); } finally { setBusy(false); }
  }
  return <dialog ref={dialog} className="admin-dialog" aria-labelledby="editor-title" onCancel={e => { e.preventDefault(); if (!busy) close(); }}><form onSubmit={save}>
    <div className="admin-dialog-heading"><h2 id="editor-title">{entry ? 'Edit' : 'New'} {singular[resource]}</h2><button type="button" aria-label="Close editor" disabled={busy} onClick={close}><X size={20} /></button></div>
    <fieldset disabled={busy}>
      {!subject && <label>Subject<select required value={lesson ? subjectId : form.subjectId} onChange={e => { if (lesson) { setSubjectId(e.target.value); change('topicId', ''); } else change('subjectId', e.target.value); }}><option value="">Choose a subject</option>{data.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
      {lesson && <label>Topic<select required disabled={!subjectId} value={form.topicId} onChange={e => change('topicId', e.target.value)}><option value="">Choose a topic</option>{data.topics.filter(t => t.subjectId === subjectId).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>}
      <label>{subject ? 'Name' : 'Title'}<input autoFocus required maxLength={120} value={form[titleKey]} onChange={e => { const v = e.target.value; setForm(f => ({ ...f, [titleKey]: v, ...(!slugEdited && { slug: slugify(v) }) })); }} /></label>
      <label>Slug<input required maxLength={160} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={e => { setSlugEdited(true); change('slug', e.target.value); }} /><small>Lowercase words separated by hyphens. Unique within its parent.</small></label>
      <label>{lesson ? 'Summary' : 'Description'}<textarea rows={3} maxLength={2000} value={form[textKey]} onChange={e => change(textKey, e.target.value)} /></label>
      {lesson && <label>Lesson content (Markdown)<textarea className="admin-content-input" rows={12} maxLength={200000} value={form.content} onChange={e => change('content', e.target.value)} /><small>Use ## for headings, **bold**, lists, and links. Drafts can be empty.</small></label>}
      <div className="admin-form-row"><label>Order<input type="number" required min="0" max="2147483647" step="1" value={form.sortOrder} onChange={e => change('sortOrder', e.target.value)} /><small>Lower numbers appear first.</small></label><label className="admin-checkbox"><input type="checkbox" checked={form.isPublished} onChange={e => change('isPublished', e.target.checked)} />Published</label></div>
    </fieldset>{error && <p className="admin-error" role="alert">{error}</p>}<footer><button type="button" disabled={busy} onClick={close}>Cancel</button><button className="admin-primary" disabled={busy}>{busy ? 'Saving...' : 'Save ' + singular[resource]}</button></footer>
  </form></dialog>;
}
function DeleteDialog({ resource, entry, close, saved }) {
  const dialog = useRef(null); const [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { dialog.current.showModal(); }, []);
  async function remove() { setBusy(true); setError(''); try { await api.delete(`/admin/${resource}/${entry.id}`); saved(`Deleted ${singular[resource]}.`); } catch (e) { setError(failureMessage(e)); setBusy(false); } }
  return <dialog ref={dialog} className="admin-dialog admin-delete" aria-labelledby="delete-title" onCancel={e => { e.preventDefault(); if (!busy) close(); }}><h2 id="delete-title">Delete {singular[resource]}?</h2><p>“{entry.name || entry.title}” will be permanently deleted. This cannot be undone.</p>{resource !== 'lessons' && <p>Entries containing topics or lessons must be emptied first.</p>}{error && <p className="admin-error" role="alert">{error}</p>}<footer><button autoFocus disabled={busy} onClick={close}>Cancel</button><button className="admin-danger" disabled={busy} onClick={remove}>{busy ? 'Deleting...' : 'Delete ' + singular[resource]}</button></footer></dialog>;
}
export default function AdminPage() {
  const account = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [authorized, setAuthorized] = useState(null);
  const [checking, setChecking] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setAuthorized(null); setChecking(true); setError('');
    if (account.loading) return () => { active = false; };
    if (!account.signedIn) { setChecking(false); return; }
    api.get('/admin/session').then(() => { if (active) setAuthorized(true); })
      .catch(e => { if (active) { setAuthorized(false); setError(e.response?.status === 403 ? 'Your Google account does not have the administrator role required to access this page.' : failureMessage(e)); } })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [account.loading, account.signedIn, account.account, attempt]);
  async function signIn() {
    setBusy(true); setError('');
    try { sessionStorage.setItem('cetmastery-auth-return', '/admin'); await auth.startSignIn(window.location.origin); }
    catch (e) { setError(e.message); setBusy(false); }
  }
  async function signOut() {
    setBusy(true); setError(''); setAuthorized(null);
    try { const result = await auth.signOut(); if (result.warning) setError(result.warning); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  if (authorized && account.signedIn && !account.loading) return <AdminWorkspace onSignOut={signOut} />;
  const loading = account.loading || checking;
  return <main className="admin-login-page"><a className="admin-brand" href="/"><BookOpen size={24} />CETMastery</a><section className="admin-login-panel" aria-labelledby="admin-login-title"><span className="admin-login-label">Administration</span><h1 id="admin-login-title">{loading ? 'Checking access' : account.signedIn ? 'Access denied' : 'Admin sign-in'}</h1><p>{loading ? 'Verifying your session and administrator access.' : account.signedIn ? 'This page is available to CETMastery administrators only.' : 'Sign in with your Google administrator account to manage subjects, topics, and lessons.'}</p>{(error || account.error) && <p className="admin-error" role="alert">{error || account.error}</p>}{!loading && (account.signedIn ? <><p className="admin-login-account">{account.account?.user?.email}</p><button className="google-button" onClick={signOut} disabled={busy}>{busy ? 'Signing out...' : 'Sign out to switch accounts'}</button><button className="text-button" onClick={() => { account.retry(); setAttempt(v => v + 1); }}>Check access again</button></> : <button className="google-button" onClick={signIn} disabled={busy}><img src="/images/google-g.png" width="20" height="20" alt="" />{busy ? 'Opening Google...' : 'Continue with Google'}</button>)}<a className="admin-login-home" href="/"><ArrowLeft size={16} />Back to homepage</a></section></main>;
}

function AdminWorkspace({ onSignOut }) {
  const [resource, setResource] = useState('subjects'), [data, setData] = useState({ subjects: [], topics: [], lessons: [] });
  const [mode, setMode] = useState(''), [loading, setLoading] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [editor, setEditor] = useState(null), [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState(''), [subjectFilter, setSubjectFilter] = useState(''), [topicFilter, setTopicFilter] = useState('');
  async function load() { setLoading(true); setError(''); try { const session = await api.get('/admin/session'); setMode(session.data.data.mode); const results = await Promise.all(resources.map(r => api.get(`/admin/${r}`))); setData(Object.fromEntries(resources.map((r, i) => [r, results[i].data.data]))); } catch (e) { setError(failureMessage(e)); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  function saved(text) { setEditor(null); setDeleting(null); setNotice(text); void load(); }
  const rows = data[resource].filter(e => (!search || (e.name || e.title).toLowerCase().includes(search.toLowerCase())) && (resource === 'subjects' || !subjectFilter || (resource === 'topics' ? e.subjectId : e.topic?.subjectId) === subjectFilter) && (resource !== 'lessons' || !topicFilter || e.topicId === topicFilter));
  const canCreate = !loading && !error && (resource === 'subjects' || (resource === 'topics' ? data.subjects.length > 0 : data.topics.length > 0));
  return <div className="admin-shell"><a href="#admin-main" className="skip-link">Skip to content</a>
    <aside className="admin-sidebar"><a className="admin-brand" href="/"><BookOpen size={24} />CETMastery</a><p className="admin-workspace">Content workspace</p><nav aria-label="Administration"><span className="admin-nav-heading">Curriculum</span>{resources.map(r => <button key={r} aria-current={resource === r ? 'page' : undefined} onClick={() => { setResource(r); setSearch(''); setTopicFilter(''); setNotice(''); }}>{r}<span>{data[r].length}</span></button>)}</nav><a className="admin-back" href="/"><ArrowLeft size={16} />Back to website</a></aside>
    <div className="admin-workarea"><header className="admin-topbar">Administration<button onClick={onSignOut}>Sign out</button></header><main id="admin-main" className="admin-sheet">
      {mode === 'development-bypass' && <p className="admin-dev">Local development · Admin sign-in is temporarily disabled.</p>}
      <div className="admin-page-heading"><div><h1>{resource}</h1><p>{resource === 'subjects' ? 'Organize the broad areas your learners will study.' : resource === 'topics' ? 'Group related lessons within each subject.' : 'Write and manage the material learners will read.'}</p></div><button className="admin-primary" disabled={!canCreate} onClick={() => { setNotice(''); setEditor({ entry: null }); }}><Plus size={16} />New {singular[resource]}</button></div>
      <div className="admin-hierarchy" aria-label="Curriculum structure">Subject <span>→</span> Topic <span>→</span> Lesson</div>
      <div className="admin-toolbar"><label className="admin-search"><span className="sr-only">Search {resource}</span><input type="search" placeholder={`Search ${resource}...`} value={search} onChange={e => setSearch(e.target.value)} /></label>{resource !== 'subjects' && <label><span className="sr-only">Filter by subject</span><select value={subjectFilter} onChange={e => { setSubjectFilter(e.target.value); setTopicFilter(''); }}><option value="">All subjects</option>{data.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}{resource === 'lessons' && <label><span className="sr-only">Filter by topic</span><select value={topicFilter} onChange={e => setTopicFilter(e.target.value)}><option value="">All topics</option>{data.topics.filter(t => !subjectFilter || t.subjectId === subjectFilter).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>}<span className="admin-count">{rows.length} {rows.length === 1 ? singular[resource] : resource}</span></div>
      {notice && <p className="admin-notice" role="status">{notice}</p>}
      {error ? <div className="admin-error" role="alert"><p>{error}</p><button onClick={load}>Try again</button></div> : loading ? <p role="status" className="admin-empty">Loading curriculum...</p> : rows.length === 0 ? <div className="admin-empty"><BookOpen size={30} /><h2>{search || subjectFilter || topicFilter ? 'No matching ' + resource : 'No ' + resource + ' yet'}</h2><p>{search || subjectFilter || topicFilter ? 'Try another search or clear your filters.' : canCreate ? `Create your first ${singular[resource]} to start building the curriculum.` : `Create a ${resource === 'topics' ? 'subject' : 'topic'} first, then add ${resource}.`}</p></div> : <div className="admin-table-wrap"><table><thead><tr><th>{resource === 'subjects' ? 'Name' : 'Title'}</th>{resource !== 'subjects' && <th>{resource === 'topics' ? 'Subject' : 'Topic'}</th>}<th>Status</th><th className="admin-number">Order</th>{resource !== 'lessons' && <th className="admin-number">{resource === 'subjects' ? 'Topics' : 'Lessons'}</th>}<th><span className="sr-only">Actions</span></th></tr></thead><tbody>{rows.map(e => <tr key={e.id}><td><strong>{e.name || e.title}</strong><span className="admin-slug">{e.slug}</span></td>{resource !== 'subjects' && <td>{resource === 'topics' ? e.subject?.name : e.topic?.title}</td>}<td><span className={e.isPublished ? 'admin-published' : 'admin-muted'}>{e.isPublished ? 'Published' : 'Draft'}</span></td><td className="admin-number">{e.sortOrder}</td>{resource !== 'lessons' && <td className="admin-number">{e._count?.[resource === 'subjects' ? 'topics' : 'lessons'] ?? 0}</td>}<td><div className="admin-row-actions"><button aria-label={`Edit ${e.name || e.title}`} onClick={() => setEditor({ entry: e })}><Pencil size={16} /></button><button aria-label={`Delete ${e.name || e.title}`} onClick={() => setDeleting(e)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>}
      <p className="admin-footnote">New entries start as drafts. Publishing a lesson later also requires its subject and topic to be published.</p>
    </main></div>{editor && <Editor resource={resource} entry={editor.entry} data={data} close={() => setEditor(null)} saved={saved} />}{deleting && <DeleteDialog resource={resource} entry={deleting} close={() => setDeleting(null)} saved={saved} />}
  </div>;
}
