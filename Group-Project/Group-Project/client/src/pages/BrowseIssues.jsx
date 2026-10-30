import { useState } from 'react';
import { api } from '../api.js';
import { CATEGORIES, STATUS_LABELS } from '../constants.js';
import { useAsync } from '../hooks/useAsync.js';
import IssueCard from '../components/IssueCard.jsx';
import { EmptyState, ErrorMessage, Spinner } from '../components/Feedback.jsx';

export default function BrowseIssues() {
  const [filters, setFilters] = useState({ search: '', category: '', status: '', sort: 'newest' });
  const [draft, setDraft] = useState('');
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useAsync(() => api.listIssues({ ...filters, page, limit: 9 }), [filters, page]);

  const change = (e) => { setPage(1); setFilters((f) => ({ ...f, [e.target.name]: e.target.value })); };
  const search = (e) => { e.preventDefault(); setPage(1); setFilters((f) => ({ ...f, search: draft.trim() })); };

  return (
    <div className="container section">
      <h1>Public issues</h1>
      <p className="lead-dark">Reports shared by citizens. Reporter details are never shown.</p>

      <form className="filters card" onSubmit={search} role="search">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input id="q" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Title, description or place" />
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" value={filters.category} onChange={change}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={filters.status} onChange={change}>
            <option value="">All statuses</option>
            {['pending', 'in_progress', 'resolved'].map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sort">Sort by</label>
          <select id="sort" name="sort" value={filters.sort} onChange={change}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="updated">Recently updated</option>
          </select>
        </div>
        <button className="btn btn-dark" type="submit">Search</button>
      </form>

      {loading && <Spinner label="Loading issues..." />}
      <ErrorMessage error={error} onRetry={reload} />

      {data && data.items.length === 0 && <EmptyState title="No issues match your filters">Try clearing the search or choosing another category.</EmptyState>}
      {data && data.items.length > 0 && (
        <>
          <p className="muted" aria-live="polite">{data.total} issue(s) found</p>
          <div className="grid grid-3">{data.items.map((i) => <IssueCard key={i.id} issue={i} />)}</div>
          <nav className="pager" aria-label="Pagination">
            <button className="btn btn-ghost btn-small" disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>Previous</button>
            <span>Page {data.page} of {data.pages}</span>
            <button className="btn btn-ghost btn-small" disabled={data.page >= data.pages} onClick={() => setPage(data.page + 1)}>Next</button>
          </nav>
        </>
      )}
    </div>
  );
}
