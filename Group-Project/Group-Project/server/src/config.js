// Central place for configuration. Values come from environment variables (.env file).
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..');

export const config = {
  port: Number(process.env.PORT) || 5000,
  isProd: process.env.NODE_ENV === 'production',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  sessionHours: Number(process.env.SESSION_HOURS) || 8,
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB) || 5,
  dataFile: path.join(ROOT, 'data', 'db.json'),
  uploadDir: path.join(ROOT, 'uploads'),
};
