import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { CATEGORIES, STATUS_LABELS, categoryLabel, formatDate } from '../constants.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Timeline from '../components/Timeline.jsx';
import LocationLink from '../components/LocationLink.jsx';
import Field, { describe } from '../components/Field.jsx';
import { EmptyState, ErrorMessage, Spinner } from '../components/Feedback.jsx';

export default function AdminDashboard() {
  const { admin, clearSession } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', status: '', category: '', sort: 'newest' });
  const [draft, setDraft] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('complaints');

  const stats = useAsync(() => api.adminStats(), []);
  const list = useAsync(() => api.adminIssues({ ...filters, page, limit: 10 }), [filters, page]);

  // If the server says our session ended (401), go back to the login page.
  useEffect(() => {
    if ([stats.error, list.error].some((e) => e?.status === 401)) { clearSession(); navigate('/admin/login'); }
  }, [stats.error, list.error]); // eslint-disable-line react-hooks/exhaustive-deps

  const change = (e) => { setPage(1); setFilters((f) => ({ ...f, [e.target.name]: e.target.value })); };
  const search = (e) => { e.preventDefault(); setPage(1); setFilters((f) => ({ ...f, search: draft.trim() })); };
  const refreshAll = () => { stats.reload(); list.reload(); };

  const s = stats.data?.stats;
  const maxCategory = s ? Math.max(1, ...Object.values(s.byCategory)) : 1;

  return (
    <div className="container section">
      <div className="section-head">
        <h1>Admin dashboard</h1>
        <p className="muted">Signed in as <strong>{admin?.username}</strong></p>
      </div>

      <ErrorMessage error={stats.error} onRetry={stats.reload} />
      {stats.loading && !s && <Spinner label="Loading statistics..." />}
      {s && (
        <>
          <div className="stats" aria-label="Complaint statistics">
            <div className="stat"><span className="stat-number">{s.total}</span><span>Total</span></div>
            <div className="stat"><span className="stat-number text-amber">{s.pending}</span><span>Pending</span></div>
            <div className="stat"><span className="stat-number text-blue">{s.inProgress}</span><span>In progress</span></div>
            <div className="stat"><span className="stat-number text-green">{s.resolved}</span><span>Resolved ({s.resolutionRate}%)</span></div>
            <div className="stat"><span className="stat-number text-red">{s.rejected}</span><span>Rejected</span></div>
            <div className="stat"><span className="stat-number">{s.flaggedUnresolved}</span><span>Re-opened by citizens</span></div>
          </div>
          <div className="grid grid-2">
            <section className="card">
              <h2>Issues by category</h2>
              <ul className="bars">
                {CATEGORIES.map((c) => (
                  <li key={c.value}>
                    <span className="bar-label">{c.label}</span>
                    <span className="bar-track"><span className="bar-fill" style={{ width: `${(s.byCategory[c.value] / maxCategory) * 100}%` }} /></span>
                    <span className="bar-count">{s.byCategory[c.value]}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="card">
              <h2>Status summary</h2>
              <ul className="bars">
                {Object.keys(STATUS_LABELS).map((k) => (
                  <li key={k}>
                    <span className="bar-label">{STATUS_LABELS[k]}</span>
                    <span className="bar-track"><span className={`bar-fill fill-${k}`} style={{ width: `${s.total ? (s.byStatus[k] / s.total) * 100 : 0}%` }} /></span>
                    <span className="bar-count">{s.byStatus[k]}</span>
                  </li>
                ))}
              </ul>
              <p className="muted small">Average time to resolve: {s.avgResolutionHours === null ? 'not enough data' : `${s.avgResolutionHours} hours`}</p>
            </section>
          </div>
        </>
      )}

      <div className="tabs" role="tablist" aria-label="Dashboard sections">
        <button role="tab" aria-selected={tab === 'complaints'} className={tab === 'complaints' ? 'active' : ''} onClick={() => setTab('complaints')}>Complaints</button>
        <button role="tab" aria-selected={tab === 'activity'} className={tab === 'activity' ? 'active' : ''} onClick={() => setTab('activity')}>Activity history</button>
      </div>

      {tab === 'activity' && <ActivityLog />}

      {tab === 'complaints' && (
        <div className={`admin-layout ${selectedId ? 'with-detail' : ''}`}>
          <section>
            <form className="filters card" onSubmit={search} role="search">
              <div className="field">
                <label htmlFor="aq">Search</label>
                <input id="aq" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Title, place, complaint ID, email" />
              </div>
              <div className="field">
                <label htmlFor="astatus">Status</label>
                <select id="astatus" name="status" value={filters.status} onChange={change}>
                  <option value="">All</option>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="acategory">Category</label>
                <select id="acategory" name="category" value={filters.category} onChange={change}>
                  <option value="">All</option>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="asort">Sort by</label>
                <select id="asort" name="sort" value={filters.sort} onChange={change}>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="updated">Recently updated</option>
                  <option value="status">Status</option>
                  <option value="category">Category</option>
                  <option value="flagged">Most re-opened</option>
                </select>
              </div>
              <button className="btn btn-dark" type="submit">Search</button>
            </form>

            {list.loading && <Spinner label="Loading complaints..." />}
            <ErrorMessage error={list.error} onRetry={list.reload} />
            {list.data && list.data.items.length === 0 && <EmptyState title="No complaints found">Change the filters to see more.</EmptyState>}
            {list.data && list.data.items.length > 0 && (
              <>
                <div className="table-wrap">
                  <table className="table">
                    <caption className="sr-only">Complaints</caption>
                    <thead><tr><th scope="col">Complaint</th><th scope="col">Category</th><th scope="col">Status</th><th scope="col">Created</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
                    <tbody>
                      {list.data.items.map((i) => (
                        <tr key={i.id} className={i.id === selectedId ? 'selected' : ''}>
                          <td><strong>{i.title}</strong><br /><span className="muted small">{i.complaintId} - {i.address}</span>{i.flaggedCount > 0 && <span className="chip chip-warn">Re-opened x{i.flaggedCount}</span>}</td>
                          <td>{categoryLabel(i.category)}</td>
                          <td><StatusBadge status={i.status} /></td>
                          <td className="small">{formatDate(i.createdAt)}</td>
                          <td><button className="btn btn-small btn-dark" onClick={() => setSelectedId(i.id)}>Open<span className="sr-only"> {i.title}</span></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <nav className="pager" aria-label="Pagination">
                  <button className="btn btn-ghost btn-small" disabled={list.data.page <= 1} onClick={() => setPage(list.data.page - 1)}>Previous</button>
                  <span>Page {list.data.page} of {list.data.pages} ({list.data.total} complaints)</span>
                  <button className="btn btn-ghost btn-small" disabled={list.data.page >= list.data.pages} onClick={() => setPage(list.data.page + 1)}>Next</button>
                </nav>
              </>
            )}
          </section>

          {selectedId && <DetailPanel key={selectedId} id={selectedId} onClose={() => setSelectedId(null)} onChanged={refreshAll} />}
        </div>
      )}
    </div>
  );
}

// Detail of one complaint + the form to change its status.
function DetailPanel({ id, onClose, onChanged }) {
  const { data, error, loading, reload } = useAsync(() => api.adminIssue(id), [id]);
  const issue = data?.issue;
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [fileKey, setFileKey] = useState(0); // changing the key clears the file input

  useEffect(() => { if (issue) setStatus(issue.status); }, [issue?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({}); setMessage('');
    const body = new FormData();
    body.append('status', status);
    body.append('note', note);
    if (photo && status === 'resolved') body.append('resolutionPhoto', photo);
    setSaving(true);
    try {
      const r = await api.updateStatus(id, body);
      setMessage(r.message); setNote(''); setPhoto(null);
      setFileKey((k) => k + 1);
      reload(); onChanged();
    } catch (err) {
      setErrors(err.errors || { note: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="card detail-panel" aria-label="Complaint details">
      <div className="section-head">
        <h2>Complaint details</h2>
        <button className="btn btn-small btn-ghost" onClick={onClose}>Close</button>
      </div>
      {loading && <Spinner />}
      <ErrorMessage error={error} onRetry={reload} />
      {issue && (
        <>
          <div className="issue-meta"><span className="chip">{categoryLabel(issue.category)}</span><StatusBadge status={issue.status} /></div>
          <h3>{issue.title}</h3>
          <p className="muted small">{issue.complaintId} - reported {formatDate(issue.createdAt)}</p>
          <p>{issue.description}</p>
          <p className="small"><strong>Reporter email:</strong> {issue.reporterEmail}</p>
          <LocationLink address={issue.address} lat={issue.lat} lng={issue.lng} />
          {issue.photoUrl && <a href={issue.photoUrl} target="_blank" rel="noopener noreferrer"><img className="preview" src={issue.photoUrl} alt="Photo attached by the citizen" /></a>}

          <form className="form" onSubmit={onSubmit} noValidate>
            <h3>Update status</h3>
            {message && <div className="alert alert-success" role="status">{message}</div>}
            <Field id="newStatus" label="New status" required error={errors.status}>
              <select {...describe('newStatus', errors.status)} value={status} onChange={(e) => setStatus(e.target.value)}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field id="note" label="Resolution / progress note" required={status === 'resolved' || status === 'rejected'} error={errors.note} hint="Required when resolving or rejecting. Citizens can read this note.">
              <textarea {...describe('note', errors.note, true)} rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            </Field>
            {status === 'resolved' && (
              <Field id="resPhoto" label="After-resolution photo (optional)" error={errors.resolutionPhoto}>
                <input key={fileKey} {...describe('resPhoto', errors.resolutionPhoto)} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setPhoto(e.target.files[0] || null)} />
              </Field>
            )}
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save update'}</button>
          </form>

          {issue.resolutionPhotoUrl && <><h3>Resolution photo</h3><a href={issue.resolutionPhotoUrl} target="_blank" rel="noopener noreferrer"><img className="preview" src={issue.resolutionPhotoUrl} alt="Photo after resolution" /></a></>}
          <h3>Status history</h3>
          <Timeline history={issue.history} showWho />
        </>
      )}
    </aside>
  );
}

function ActivityLog() {
  const { data, error, loading, reload } = useAsync(() => api.adminActivity(), []);
  return (
    <section className="card">
      <h2>Administrative activity</h2>
      {loading && <Spinner />}
      <ErrorMessage error={error} onRetry={reload} />
      {data && data.items.length === 0 && <EmptyState title="No activity yet">Sign-ins and status changes will appear here.</EmptyState>}
      {data && data.items.length > 0 && (
        <ul className="activity">
          {data.items.map((a) => (
            <li key={a.id}>
              <time dateTime={a.at}>{formatDate(a.at)}</time>
              <span><strong>{a.admin}</strong> - {a.action.replace('_', ' ')}{a.complaintId ? ` (${a.complaintId})` : ''}</span>
              <span className="muted small">{a.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
