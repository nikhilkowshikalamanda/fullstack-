import { STATUS_LABELS } from '../constants.js';

// The text label is always shown, so the status is not communicated by colour alone.
export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status] || status}</span>;
}
