// Input validation + cleaning. Every value from a user passes through here.
// React escapes text when displaying it, so we store plain text (no HTML escaping needed).
export const CATEGORIES = ['pothole', 'garbage', 'streetlight', 'drainage', 'water_leakage', 'other'];
export const STATUSES = ['pending', 'in_progress', 'resolved', 'rejected'];
export const OPEN_STATUSES = ['pending', 'in_progress'];
export const COMPLAINT_ID_PATTERN = /^CF-\d{8}-[A-Z0-9]{5}$/;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Removes control characters, normalises line endings and trims spaces.
export function clean(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export function cleanEmail(value) {
  return clean(value).toLowerCase();
}

function checkLength(errors, field, label, value, min, max) {
  if (!value) errors[field] = `${label} is required.`;
  else if (value.length < min) errors[field] = `${label} must be at least ${min} characters.`;
  else if (value.length > max) errors[field] = `${label} must be at most ${max} characters.`;
}

function checkEmail(errors, email) {
  if (!email) errors.email = 'Email is required.';
  else if (email.length > 120 || !EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.';
}

// Optional coordinate: returns a number, null (empty) or NaN (invalid).
function parseCoordinate(raw, min, max) {
  const text = clean(typeof raw === 'number' ? String(raw) : raw);
  if (text === '') return null;
  const n = Number(text);
  return Number.isFinite(n) && n >= min && n <= max ? n : NaN;
}

export function validateNewIssue(body = {}) {
  const errors = {};
  const value = {
    title: clean(body.title),
    description: clean(body.description),
    category: clean(body.category),
    address: clean(body.address),
    email: cleanEmail(body.email),
  };
  checkLength(errors, 'title', 'Title', value.title, 5, 100);
  checkLength(errors, 'description', 'Description', value.description, 20, 1000);
  checkLength(errors, 'address', 'Address or landmark', value.address, 5, 200);
  if (!CATEGORIES.includes(value.category)) errors.category = 'Choose a valid category.';
  checkEmail(errors, value.email);

  const lat = parseCoordinate(body.lat, -90, 90);
  const lng = parseCoordinate(body.lng, -180, 180);
  if (Number.isNaN(lat)) errors.lat = 'Latitude must be a number between -90 and 90.';
  if (Number.isNaN(lng)) errors.lng = 'Longitude must be a number between -180 and 180.';
  if (!errors.lat && !errors.lng && (lat === null) !== (lng === null)) {
    errors.lat = 'Provide both latitude and longitude, or leave both empty.';
  }
  value.lat = Number.isNaN(lat) ? null : lat;
  value.lng = Number.isNaN(lng) ? null : lng;
  return { errors, value };
}

export function validateStatusUpdate(body = {}) {
  const errors = {};
  const value = { status: clean(body.status), note: clean(body.note) };
  if (!STATUSES.includes(value.status)) errors.status = 'Choose a valid status.';
  if (value.note.length > 500) errors.note = 'Note must be at most 500 characters.';
  if (['resolved', 'rejected'].includes(value.status) && value.note.length < 5) {
    errors.note = 'A note of at least 5 characters is required when resolving or rejecting.';
  }
  return { errors, value };
}

export function validateFlag(body = {}) {
  const errors = {};
  const value = { email: cleanEmail(body.email), reason: clean(body.reason) };
  checkEmail(errors, value.email);
  checkLength(errors, 'reason', 'Reason', value.reason, 10, 300);
  return { errors, value };
}

export function validateLogin(body = {}) {
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const ok = username.length > 0 && username.length <= 60 && password.length > 0 && password.length <= 200;
  return { ok, username, password };
}
