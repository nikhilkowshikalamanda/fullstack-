import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { categoryLabel, formatDate } from '../constants.js';
import Field, { describe } from '../components/Field.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Timeline from '../components/Timeline.jsx';
import LocationLink from '../components/LocationLink.jsx';

export default function TrackComplaint() {
  const [params] = useSearchParams();
  const [complaintId, setComplaintId] = useState(params.get('id') || '');
  const [email, setEmail] = useState('');
  const [issue, setIssue] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [reason, setReason] = useState('');
  const [flagErrors, setFlagErrors] = useState({});
  const [flagMessage, setFlagMessage] = useState('');
  const [flagging, setFlagging] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(''); setIssue(null); setFlagMessage('');
    if (!complaintId.trim() || !email.trim()) { setError('Enter both the complaint ID and your email.'); return; }
    setLoading(true);
    try {
      const r = await api.track(complaintId.trim().toUpperCase(), email.trim());
      setIssue(r.issue);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function onFlag(e) {
    e.preventDefault();
    setFlagErrors({}); setFlagMessage('');
    if (reason.trim().length < 10) { setFlagErrors({ reason: 'Explain what is still wrong (at least 10 characters).' }); return; }
    setFlagging(true);
    try {
      const r = await api.flagUnresolved(issue.id, { email: email.trim(), reason: reason.trim() });
      setIssue(r.issue); setReason(''); setFlagMessage(r.message);
    } catch (err) {
      if (err.errors) setFlagErrors(err.errors); else setFlagErrors({ reason: err.message });
    } finally {
      setFlagging(false);
    }
  }

  return (
    <div className="container narrow section">
      <h1>Track a complaint</h1>
      <p className="lead-dark">Enter the complaint ID you received and the email you used when reporting.</p>

      <form className="card form" onSubmit={onSubmit} noValidate>
        <Field id="complaintId" label="Complaint ID" required hint="Format: CF-20261023-K7P4X">
          <input {...describe('complaintId', null, true)} value={complaintId} onChange={(e) => setComplaintId(e.target.value)} autoComplete="off" />
        </Field>
        <Field id="trackEmail" label="Email used when reporting" required>
          <input {...describe('trackEmail', null)} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>
        <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Searching...' : 'Track complaint'}</button>
      </form>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {issue && (
        <section className="card result" aria-live="polite">
          <div className="issue-meta">
            <span className="chip">{categoryLabel(issue.category)}</span>
            <StatusBadge status={issue.status} />
          </div>
          <h2>{issue.title}</h2>
          <p className="muted">Complaint {issue.complaintId} - reported {formatDate(issue.createdAt)}</p>
          <p>{issue.description}</p>
          <LocationLink address={issue.address} lat={issue.lat} lng={issue.lng} />
          {issue.photoUrl && <a href={issue.photoUrl} target="_blank" rel="noopener noreferrer"><img className="preview" src={issue.photoUrl} alt="Photo you attached" /></a>}

          {issue.resolutionNote && (
            <div className={`alert ${issue.status === 'resolved' ? 'alert-success' : 'alert-warn'}`}>
              <p><strong>{issue.status === 'rejected' ? 'Reason' : 'Resolution note'}:</strong> {issue.resolutionNote}</p>
              {issue.resolutionPhotoUrl && <a href={issue.resolutionPhotoUrl} target="_blank" rel="noopener noreferrer"><img className="preview" src={issue.resolutionPhotoUrl} alt="Photo taken after the issue was resolved" /></a>}
            </div>
          )}

          <h3>Status history</h3>
          <Timeline history={issue.history} showWho />

          {flagMessage && <div className="alert alert-success" role="status">{flagMessage}</div>}

          {issue.status === 'resolved' && (
            <form onSubmit={onFlag} noValidate className="form flag-form">
              <h3>Still not fixed?</h3>
              <p className="muted">If the problem is still there, tell us and the complaint will be re-opened.</p>
              <Field id="reason" label="What is still wrong?" required error={flagErrors.reason}>
                <textarea {...describe('reason', flagErrors.reason)} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
              </Field>
              <button className="btn btn-dark" type="submit" disabled={flagging}>{flagging ? 'Sending...' : 'Mark as unresolved'}</button>
            </form>
          )}
          {issue.flaggedCount > 0 && <p className="muted small">This complaint has been re-opened {issue.flaggedCount} time(s).</p>}
          <p><Link to="/issues">Browse public issues</Link></p>
        </section>
      )}
    </div>
  );
}
