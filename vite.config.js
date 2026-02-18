import { defineConfig } from 'vite';
import { resolve } from 'path';

// Plugin: rewrite clean URLs → .html files
function cleanUrls() {
  return {
    name: 'clean-urls',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Skip files with extensions, API calls, etc.
        if (req.url.includes('.') || req.url.startsWith('/@') || req.url.startsWith('/node_modules')) {
          return next();
        }
        // Rewrite /about → /about.html, /contacts → /contacts.html, etc.
        const cleanPath = req.url.split('?')[0].split('#')[0];
        if (cleanPath !== '/' && !cleanPath.endsWith('/')) {
          req.url = cleanPath + '.html' + (req.url.slice(cleanPath.length) || '');
        }
        next();
      });
    },
  };
}

export default defineConfig({
  root: '.',
  appType: 'mpa',
  plugins: [cleanUrls()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        services: resolve(__dirname, 'services.html'),
        catalog: resolve(__dirname, 'catalog.html'),
        car: resolve(__dirname, 'car.html'),
        admin: resolve(__dirname, 'admin.html'),
        'how-we-work': resolve(__dirname, 'how-we-work.html'),
        about: resolve(__dirname, 'about.html'),
        team: resolve(__dirname, 'team.html'),
        reviews: resolve(__dirname, 'reviews.html'),
        faq: resolve(__dirname, 'faq.html'),
        contacts: resolve(__dirname, 'contacts.html'),
        privacy: resolve(__dirname, 'privacy.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
