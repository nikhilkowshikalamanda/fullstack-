// Entry point: prepares the data store, then starts the HTTP server.
import { config } from './src/config.js';
import { initDb } from './src/db.js';
import { createApp } from './src/app.js';
import { adminConfigured } from './src/auth.js';

try {
  await initDb();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`CivicFix API running at http://localhost:${config.port}`);
    if (!adminConfigured()) {
      console.warn('WARNING: ADMIN_PASSWORD is missing or shorter than 8 characters in .env. Admin login is disabled.');
    }
  });
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}
