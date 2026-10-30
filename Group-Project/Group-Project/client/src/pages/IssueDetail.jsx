import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { categoryLabel, formatDate } from '../constants.js';
import { useAsync } from '../hooks/useAsync.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Timeline from '../components/Timeline.jsx';
import LocationLink from '../components/LocationLink.jsx';
import { ErrorMessage, Spinner } from '../components/Feedback.jsx';

export default function IssueDetail() {
  const { id } = useParams();
  const { data, error, loading, reload } = useAsync(() => api.getIssue(id), [id]);
  const issue = data?.issue;

  return (
    <div className="container narrow section">
      <p><Link to="/issues">&larr; Back to public issues</Link></p>
      {loading && <Spinner />}
      <ErrorMessage error={error} onRetry={reload} />
      {issue && (
        <article className="card result">
          <div className="issue-meta">
            <span className="chip">{categoryLabel(issue.category)}</span>
            <StatusBadge status={issue.status} />
          </div>
          <h1>{issue.title}</h1>
          <p className="muted">Reported {formatDate(issue.createdAt)} - last update {formatDate(issue.updatedAt)}</p>
          <p>{issue.description}</p>
          <LocationLink address={issue.address} lat={issue.lat} lng={issue.lng} />
          {issue.photoUrl && <img className="preview" src={issue.photoUrl} alt={`Photo of: ${issue.title}`} />}
          {issue.resolutionNote && (
            <div className="alert alert-success">
              <p><strong>Resolution:</strong> {issue.resolutionNote}</p>
              {issue.resolutionPhotoUrl && <img className="preview" src={issue.resolutionPhotoUrl} alt="After the repair" />}
            </div>
          )}
          <h2>Progress</h2>
          <Timeline history={issue.history} />
        </article>
      )}
    </div>
  );
}
