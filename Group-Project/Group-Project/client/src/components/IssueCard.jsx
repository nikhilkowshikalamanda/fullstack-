import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import { categoryLabel, formatDate } from '../constants.js';

export default function IssueCard({ issue }) {
  return (
    <article className="card issue-card">
      {issue.photoUrl && <img className="issue-photo" src={issue.photoUrl} alt={`Photo of: ${issue.title}`} loading="lazy" />}
      <div className="issue-body">
        <div className="issue-meta">
          <span className="chip">{categoryLabel(issue.category)}</span>
          <StatusBadge status={issue.status} />
        </div>
        <h3><Link to={`/issues/${issue.id}`}>{issue.title}</Link></h3>
        <p className="muted">{issue.address}</p>
        <p className="muted small">Reported {formatDate(issue.createdAt)}</p>
      </div>
    </article>
  );
}
