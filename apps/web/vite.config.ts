import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // During development, forward any request starting with /api to the
    // Express backend. The browser only ever talks to localhost:5173,
    // so no CORS setup is needed on the server.
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
