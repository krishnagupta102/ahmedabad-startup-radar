import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Production builds are served from
  // https://<user>.github.io/ahmedabad-startup-radar/ on GitHub Pages, so
  // asset URLs need that repo-name prefix. `npm run dev` keeps using `/` so
  // localhost:5173 works the same as always.
  base: command === 'build' ? '/ahmedabad-startup-radar/' : '/',
  server: {
    port: 5173,
    open: true,
  },
}));
