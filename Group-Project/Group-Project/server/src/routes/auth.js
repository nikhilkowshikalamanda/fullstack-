// Administrator login/logout using an HttpOnly session cookie.
// ACADEMIC DEMO: one admin account from .env and sessions kept in server memory.
import { Router } from 'express';
import { config } from '../config.js';
import { HttpError } from '../errors.js';
import { adminConfigured, verifyAdmin } from '../auth.js';
import { createSession, destroySession, getSession } from '../sessions.js';
import { COOKIE_NAME, loginLimiter, requireAdmin } from '../middleware.js';
import { validateLogin } from '../validate.js';
import { updateDb } from '../db.js';
import { logActivity } from '../activity.js';

const router = Router();

const cookieOptions = () => ({
  httpOnly: true,                 // JavaScript in the page cannot read the cookie (blocks XSS theft)
  sameSite: 'lax',                // not sent on cross-site POST requests (CSRF protection)
  secure: config.isProd,          // HTTPS only in production
  path: '/',
});

// POST /api/auth/login   body: { username, password }
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    if (!adminConfigured()) throw new HttpError(503, 'Admin login is not configured. Set ADMIN_PASSWORD in server/.env.');
    const { ok, username, password } = validateLogin(req.body);
    if (!ok || !(await verifyAdmin(username, password))) throw new HttpError(401, 'Incorrect username or password.');
    const token = createSession(username);
    res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: config.sessionHours * 3600 * 1000 });
    await updateDb((data) => logActivity(data, username, 'login', null, 'Administrator signed in'));
    res.json({ admin: { username } });
  } catch (err) { next(err); }
});

// POST /api/auth/logout
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    const session = getSession(token);
    destroySession(token);
    res.clearCookie(COOKIE_NAME, cookieOptions());
    if (session) await updateDb((data) => logActivity(data, session.username, 'logout', null, 'Administrator signed out'));
    res.json({ message: 'Signed out.' });
  } catch (err) { next(err); }
});

// GET /api/auth/me -> lets the React app check whether the cookie session is still valid
router.get('/me', requireAdmin, (req, res) => res.json({ admin: { username: req.admin.username } }));

export default router;
