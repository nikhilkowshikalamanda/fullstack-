// In-memory admin sessions (ACADEMIC DEMO). Sessions are lost when the server restarts.
// We store only a SHA-256 hash of the random token, never the token itself.
import crypto from 'node:crypto';
import { config } from './config.js';

const sessions = new Map();
const hash = (token) => crypto.createHash('sha256').update(token).digest('hex');

export function createSession(username) {
  const now = Date.now();
  for (const [key, s] of sessions) if (s.expires < now) sessions.delete(key); // clean old ones
  const token = crypto.randomBytes(32).toString('hex'); // unguessable
  sessions.set(hash(token), { username, expires: now + config.sessionHours * 3600 * 1000 });
  return token;
}

export function getSession(token) {
  if (!token || typeof token !== 'string') return null;
  const key = hash(token);
  const session = sessions.get(key);
  if (!session) return null;
  if (session.expires < Date.now()) {
    sessions.delete(key);
    return null;
  }
  return session;
}

export function destroySession(token) {
  if (token && typeof token === 'string') sessions.delete(hash(token));
}
