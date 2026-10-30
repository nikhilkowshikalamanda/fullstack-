import StatusBadge from './StatusBadge.jsx';
import { formatDate } from '../constants.js';

// Shows the status history. Works for the public view (no notes) and the tracking/admin view (with notes).
export default function Timeline({ history, showWho = false }) {
  return (
    <ol className="timeline">
      {history.map((h, index) => (
        <li key={index}>
          <div className="timeline-head">
            <StatusBadge status={h.status} />
            <time dateTime={h.at}>{formatDate(h.at)}</time>
            {showWho && h.by && <span className="muted">by {h.by}</span>}
          </div>
          {h.note && <p>{h.note}</p>}
          {h.photoUrl && (
            <a href={h.photoUrl} target="_blank" rel="noopener noreferrer">
              <img className="thumb" src={h.photoUrl} alt="Photo attached to this update" loading="lazy" />
            </a>
          )}
        </li>
      ))}
    </ol>
  );
}
