import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { CATEGORIES, mapLink } from '../constants.js';
import Field, { describe } from '../components/Field.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const EMPTY = { title: '', description: '', category: '', address: '', lat: '', lng: '', email: '' };
const MAX_PHOTO_MB = 5;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ReportIssue() {
  const [params] = useSearchParams();
  const startCategory = CATEGORIES.some((c) => c.value === params.get('category')) ? params.get('category') : '';
  const [form, setForm] = useState({ ...EMPTY, category: startCategory });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [geoMessage, setGeoMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Warn about possible duplicates (same category + similar place) after the user stops typing.
  useEffect(() => {
    if (!form.category || form.address.trim().length < 5) { setSimilar([]); return undefined; }
    const timer = setTimeout(() => {
      api.similar({ category: form.category, address: form.address, lat: form.lat, lng: form.lng })
        .then((r) => setSimilar(r.items))
        .catch(() => setSimilar([]));
    }, 600);
    return () => clearTimeout(timer);
  }, [form.category, form.address, form.lat, form.lng]);

  // Free the temporary preview URL when it is replaced or the page closes.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function onPhoto(e) {
    const file = e.target.files[0];
    setErrors((prev) => ({ ...prev, photo: undefined }));
    if (!file) { setPhoto(null); setPreview(null); return; }
    if (!PHOTO_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, photo: 'Choose a JPG, PNG, WebP or GIF image.' }));
      e.target.value = ''; setPhoto(null); setPreview(null); return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: `Photo must be smaller than ${MAX_PHOTO_MB} MB.` }));
      e.target.value = ''; setPhoto(null); setPreview(null); return;
    }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function useMyLocation() {
    setGeoMessage('');
    if (!('geolocation' in navigator)) { setGeoMessage('Your browser does not support location. Type the address instead.'); return; }
    setGeoMessage('Asking your browser for permission...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
        setGeoMessage('Location added. You can still edit the address and coordinates.');
      },
      (err) => setGeoMessage(err.code === 1
        ? 'Location permission was denied. Type the address or landmark instead.'
        : 'Could not get your location. Type the address or landmark instead.'),
      { timeout: 10000 },
    );
  }

  // Same rules as the server (the server checks again - never trust only the browser).
  function validate() {
    const e = {};
    const t = form.title.trim(), d = form.description.trim(), a = form.address.trim(), m = form.email.trim();
    if (t.length < 5 || t.length > 100) e.title = 'Title must be 5 to 100 characters.';
    if (d.length < 20 || d.length > 1000) e.description = 'Description must be 20 to 1000 characters.';
    if (!form.category) e.category = 'Choose a category.';
    if (a.length < 5 || a.length > 200) e.address = 'Address or landmark must be 5 to 200 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m)) e.email = 'Enter a valid email address.';
    const hasLat = form.lat.trim() !== '', hasLng = form.lng.trim() !== '';
    if (hasLat && !(Number(form.lat) >= -90 && Number(form.lat) <= 90)) e.lat = 'Latitude must be between -90 and 90.';
    if (hasLng && !(Number(form.lng) >= -180 && Number(form.lng) <= 180)) e.lng = 'Longitude must be between -180 and 180.';
    if (hasLat !== hasLng && !e.lat && !e.lng) e.lat = 'Enter both latitude and longitude, or leave both empty.';
    if (errors.photo) e.photo = errors.photo;
    return e;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) { setSubmitError('Please fix the highlighted fields.'); return; }
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value.trim ? value.trim() : value));
    if (photo) data.append('photo', photo);
    setSubmitting(true);
    try {
      setResult(await api.createIssue(data));
    } catch (err) {
      setSubmitError(err.message);
      if (err.errors) setErrors(err.errors);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyId() {
    try { await navigator.clipboard.writeText(result.complaintId); setCopied(true); } catch { setCopied(false); }
  }

  if (result) {
    return (
      <div className="container narrow section">
        <div className="alert alert-success" role="status">
          <h1>Complaint submitted</h1>
          <p>{result.message}</p>
        </div>
        <div className="card">
          <p className="muted">Your complaint ID</p>
          <p className="big-id">{result.complaintId}</p>
          <button className="btn btn-ghost btn-small" onClick={copyId}>{copied ? 'Copied' : 'Copy ID'}</button>
          <p>Status: <StatusBadge status={result.issue.status} /></p>
          <p className="muted">To track this report you need this ID <strong>and</strong> the email address you entered. Write them down now - the ID is not shown publicly.</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to={`/track?id=${result.complaintId}`}>Track this complaint</Link>
            <button className="btn btn-ghost" onClick={() => { setResult(null); setForm(EMPTY); setPhoto(null); setPreview(null); setErrors({}); }}>Report another issue</button>
          </div>
        </div>
        {result.similar.length > 0 && (
          <div className="alert alert-warn">
            <p><strong>Heads up:</strong> similar unresolved reports already exist nearby. Administrators will review them together.</p>
          </div>
        )}
      </div>
    );
  }

  const showMap = form.lat.trim() !== '' && form.lng.trim() !== '' && !errors.lat && !errors.lng;

  return (
    <div className="container narrow section">
      <h1>Report an issue</h1>
      <p className="lead-dark">Describe the problem and where it is. Fields marked * are required.</p>

      {submitError && <div className="alert alert-error" role="alert">{submitError}</div>}

      <form className="card form" onSubmit={onSubmit} noValidate>
        <Field id="title" label="Issue title" required error={errors.title} hint="Example: Deep pothole near the bus stand">
          <input {...describe('title', errors.title, true)} name="title" value={form.title} onChange={onChange} maxLength={100} />
        </Field>

        <Field id="category" label="Category" required error={errors.category}>
          <select {...describe('category', errors.category)} name="category" value={form.category} onChange={onChange}>
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </Field>

        <Field id="description" label="Description" required error={errors.description} hint={`${form.description.length}/1000 characters (minimum 20)`}>
          <textarea {...describe('description', errors.description, true)} name="description" rows={5} value={form.description} onChange={onChange} maxLength={1000} />
        </Field>

        <Field id="address" label="Address or landmark" required error={errors.address} hint="Street, area and a nearby landmark help crews find the spot">
          <input {...describe('address', errors.address, true)} name="address" value={form.address} onChange={onChange} maxLength={200} />
        </Field>

        {similar.length > 0 && (
          <div className="alert alert-warn" role="status">
            <p><strong>Similar unresolved reports found nearby:</strong> check whether yours is already reported.</p>
            <ul>
              {similar.map((s) => (
                <li key={s.id}><Link to={`/issues/${s.id}`} target="_blank">{s.title}</Link> - {s.address} <StatusBadge status={s.status} /></li>
              ))}
            </ul>
            <p className="small">You can still submit if this is a different problem.</p>
          </div>
        )}

        <fieldset className="fieldset">
          <legend>Precise location (optional)</legend>
          <button type="button" className="btn btn-ghost btn-small" onClick={useMyLocation}>Use my current location</button>
          {geoMessage && <p className="hint" role="status">{geoMessage}</p>}
          <div className="grid grid-2">
            <Field id="lat" label="Latitude" error={errors.lat}>
              <input {...describe('lat', errors.lat)} name="lat" inputMode="decimal" value={form.lat} onChange={onChange} placeholder="e.g. 17.9689" />
            </Field>
            <Field id="lng" label="Longitude" error={errors.lng}>
              <input {...describe('lng', errors.lng)} name="lng" inputMode="decimal" value={form.lng} onChange={onChange} placeholder="e.g. 79.5941" />
            </Field>
          </div>
          {showMap && <p><a href={mapLink({ lat: form.lat, lng: form.lng })} target="_blank" rel="noopener noreferrer">Preview this spot on OpenStreetMap</a></p>}
        </fieldset>

        <Field id="photo" label="Photo (optional)" error={errors.photo} hint={`JPG, PNG, WebP or GIF, up to ${MAX_PHOTO_MB} MB. Avoid photos showing faces or number plates.`}>
          <input {...describe('photo', errors.photo, true)} type="file" name="photo" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onPhoto} />
        </Field>
        {preview && <img className="preview" src={preview} alt="Preview of the selected photo" />}

        <Field id="email" label="Your email" required error={errors.email} hint="Used only to verify you when tracking. It is never shown publicly.">
          <input {...describe('email', errors.email, true)} type="email" name="email" autoComplete="email" value={form.email} onChange={onChange} maxLength={120} />
        </Field>

        <button className="btn btn-primary btn-large" type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit complaint'}
        </button>
      </form>
    </div>
  );
}
