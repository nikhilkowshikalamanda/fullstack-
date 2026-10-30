import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAsync } from '../hooks/useAsync.js';
import { CATEGORIES, formatDate } from '../constants.js';
import IssueCard from '../components/IssueCard.jsx';
import { EmptyState, ErrorMessage, Spinner } from '../components/Feedback.jsx';

export default function Home() {
  // Three requests at once; the page shows loading / error states for all of them together.
  const { data, error, loading, reload } = useAsync(async () => {
    const [stats, announcements, recent] = await Promise.all([
      api.stats(),
      api.announcements(),
      api.listIssues({ limit: 6, sort: 'newest' }),
    ]);
    return { stats, announcements: announcements.items, recent: recent.items };
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <h1>See a problem on your street? Report it. Watch it get fixed.</h1>
          <p className="lead">
            Potholes, overflowing garbage, dead streetlights, blocked drains and leaking pipes often go unreported
            because nobody knows where to complain or whether anyone listened. CivicFix gives every report a complaint
            ID, a public status and a visible resolution.
          </p>
          <div className="hero-actions">
            <Link to="/report" className="btn btn-primary btn-large">Report an issue</Link>
            <Link to="/track" className="btn btn-outline btn-large">Track my complaint</Link>
          </div>
        </div>
        <div className="road-line" aria-hidden="true" />
      </section>

      <div className="container">
        {loading && <Spinner label="Loading latest figures..." />}
        <ErrorMessage error={error} onRetry={reload} />

        {data && (
          <>
            <section className="stats" aria-label="Issue statistics">
              <div className="stat"><span className="stat-number">{data.stats.total}</span><span>Issues reported</span></div>
              <div className="stat"><span className="stat-number text-green">{data.stats.resolved}</span><span>Resolved</span></div>
              <div className="stat"><span className="stat-number text-blue">{data.stats.inProgress}</span><span>In progress</span></div>
              <div className="stat"><span className="stat-number text-amber">{data.stats.pending}</span><span>Pending</span></div>
            </section>

            <section className="section">
              <h2>What can you report?</h2>
              <div className="grid grid-3">
                {CATEGORIES.map((c) => (
                  <Link key={c.value} to={`/report?category=${c.value}`} className="card category-card">
                    <span className="category-icon" aria-hidden="true">{c.icon}</span>
                    <h3>{c.label}</h3>
                    <p className="muted">{c.hint}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="section">
              <div className="section-head">
                <h2>Recent public reports</h2>
                <Link to="/issues">See all reports</Link>
              </div>
              {data.recent.length === 0 ? (
                <EmptyState title="No reports yet">Be the first to report an issue in your area.</EmptyState>
              ) : (
                <div className="grid grid-3">{data.recent.map((i) => <IssueCard key={i.id} issue={i} />)}</div>
              )}
            </section>

            <section className="section">
              <h2>Announcements</h2>
              <div className="stack">
                {data.announcements.map((a) => (
                  <article key={a.id} className="card announcement">
                    <h3>{a.title}</h3>
                    <p>{a.body}</p>
                    <p className="muted small">{formatDate(a.at)}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
