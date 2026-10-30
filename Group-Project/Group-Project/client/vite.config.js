import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The proxy forwards /api and /uploads to the Express server (port 5000).
// The browser therefore talks to ONE origin (localhost:5173), so the admin cookie works without CORS trouble.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
