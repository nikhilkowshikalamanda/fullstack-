// Shared Express middleware: security headers, rate limiting, admin protection, error handling.
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { getSession } from './sessions.js';
import { HttpError } from './errors.js';
import { config } from './config.js';

export const COOKIE_NAME = 'civicfix_sid';

export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
}

const limiter = (minutes, limit, message) =>
  rateLimit({ windowMs: minutes * 60 * 1000, limit, standardHeaders: true, legacyHeaders: false, message: { message } });

export const loginLimiter = limiter(15, 10, 'Too many login attempts. Please wait 15 minutes and try again.');
export const submitLimiter = limiter(60, 20, 'Too many reports from this connection. Please try again later.');
export const trackLimiter = limiter(15, 30, 'Too many tracking attempts. Please wait a few minutes.');
export const flagLimiter = limiter(60, 10, 'Too many requests. Please try again later.');

// Server-side protection of administrator routes. Hiding buttons in React is NOT security.
export function requireAdmin(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  const session = getSession(token);
  if (!session) return res.status(401).json({ message: 'Administrator login required.' });
  req.admin = session;
  req.sessionToken = token;
  next();
}

export function notFoundApi(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message, errors: err.errors });
  if (err instanceof multer.MulterError) {
    const tooBig = err.code === 'LIMIT_FILE_SIZE';
    return res.status(tooBig ? 413 : 400).json({
      message: tooBig ? `Photo is too large. Maximum size is ${config.maxUploadMb} MB.` : 'Upload failed. Send one image file.',
    });
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Request body is not valid JSON.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Request body is too large.' });
  console.error('Unexpected error:', err); // details stay in the server log only
  res.status(500).json({ message: 'Something went wrong on the server.' });
}
