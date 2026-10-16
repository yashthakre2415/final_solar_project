import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Backend CORS allows http://localhost:5173 and http://127.0.0.1:5173 only,
// so the dev server is pinned to port 5173.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true, host: 'localhost' },
});
