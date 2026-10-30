// Builds the Express application (middleware + routes).
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { securityHeaders, notFoundApi, errorHandler } from './middleware.js';
import publicRoutes from './routes/public.js';
import issueRoutes from './routes/issues.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.use(cors({
    origin: config.clientOrigin,
    credentials: true, // lets the browser send the admin session cookie
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Reporter-Email'],
  }));
  app.use(express.json({ limit: '20kb' }));
  app.use(cookieParser());

  // Uploaded photos: read-only static files; the names are random so nothing can be guessed or overwritten.
  app.use('/uploads', express.static(config.uploadDir, {
    index: false,
    dotfiles: 'deny',
    maxAge: '1d',
    setHeaders: (res) => {
      res.setHeader('Content-Security-Policy', "default-src 'none'");
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'civicfix-api', time: new Date().toISOString() }));
  app.use('/api', publicRoutes);
  app.use('/api/issues', issueRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', notFoundApi);
  app.use(errorHandler);
  return app;
}
