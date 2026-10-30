// All communication with the Express server goes through this file.
// Paths are relative ("/api/...") because Vite proxies them to http://localhost:5000.
export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors || null; // field-level messages from the server
  }
}

async function request(path, { method = 'GET', body, formData, headers = {} } = {}) {
  const options = { method, credentials: 'include', headers: { ...headers } }; // include = send the cookie
  if (formData) {
    options.body = formData; // the browser sets the multipart header itself
  } else if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(`/api${path}`, options);
  } catch {
    throw new ApiError('Cannot reach the server. Make sure the server is running (npm run dev in the server folder).', 0);
  }
  let data = null;
  try { data = await response.json(); } catch { /* empty body */ }
  if (!response.ok) throw new ApiError(data?.message || `Request failed (${response.status}).`, response.status, data?.errors);
  return data;
}

const query = (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));
  const text = new URLSearchParams(clean).toString();
  return text ? `?${text}` : '';
};

export const api = {
  // public
  stats: () => request('/stats'),
  announcements: () => request('/announcements'),
  listIssues: (params) => request(`/issues${query(params)}`),
  getIssue: (id) => request(`/issues/${encodeURIComponent(id)}`),
  similar: (params) => request(`/issues/similar${query(params)}`),
  createIssue: (formData) => request('/issues', { method: 'POST', formData }),
  track: (complaintId, email) =>
    request(`/issues/track/${encodeURIComponent(complaintId)}`, { headers: { 'X-Reporter-Email': email } }),
  flagUnresolved: (id, body) => request(`/issues/${encodeURIComponent(id)}/flag-unresolved`, { method: 'POST', body }),
  // auth
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  // admin
  adminStats: () => request('/admin/stats'),
  adminIssues: (params) => request(`/admin/issues${query(params)}`),
  adminIssue: (id) => request(`/admin/issues/${encodeURIComponent(id)}`),
  updateStatus: (id, formData) => request(`/admin/issues/${encodeURIComponent(id)}/status`, { method: 'PATCH', formData }),
  adminActivity: () => request('/admin/activity'),
};
