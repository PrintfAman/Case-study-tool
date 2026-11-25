import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * VITE CONFIG
 * -----------
 * Vite is the dev server + bundler. Two plugins are all this app needs:
 *
 *   react()       - lets .tsx files work, and gives you Fast Refresh: edit a
 *                   component, save, and the browser updates without a reload
 *                   or losing component state.
 *   tailwindcss() - Tailwind v4 is a Vite plugin. There is no tailwind.config.js
 *                   and no postcss.config.js: the plugin scans your files and
 *                   generates CSS for the utility classes you actually use.
 *
 * `strictPort: true` means: if 5173 is taken, fail loudly instead of silently
 * moving to 5174. That port is written into the backend's CORS_ORIGIN, so a
 * silent move would break every API call with a confusing CORS error.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
  },
});
