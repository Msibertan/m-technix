import { defineConfig } from 'vite';
import { resolve } from 'path';
import { existsSync, mkdirSync, renameSync, unlinkSync } from 'fs';

// Plugin: rewrite clean URLs → .html files (dev server)
function cleanUrls() {
  return {
    name: 'clean-urls',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.includes('.') || req.url.startsWith('/@') || req.url.startsWith('/node_modules')) {
          return next();
        }
        const cleanPath = req.url.split('?')[0].split('#')[0];
        if (cleanPath !== '/' && !cleanPath.endsWith('/')) {
          req.url = cleanPath + '.html' + (req.url.slice(cleanPath.length) || '');
        }
        next();
      });
    },
  };
}

// Plugin: restructure build output for clean URLs on static hosting
// e.g. dist/about.html → dist/about/index.html
function cleanUrlsBuild() {
  return {
    name: 'clean-urls-build',
    closeBundle() {
      const outDir = resolve(__dirname, 'dist');
      const pages = [
        'services', 'catalog', 'car', 'admin',
        'how-we-work', 'about', 'team', 'reviews',
        'faq', 'contacts', 'privacy'
      ];
      for (const page of pages) {
        const htmlFile = resolve(outDir, `${page}.html`);
        if (existsSync(htmlFile)) {
          const dir = resolve(outDir, page);
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          renameSync(htmlFile, resolve(dir, 'index.html'));
        }
      }
    },
  };
}

export default defineConfig({
  root: '.',
  appType: 'mpa',
  plugins: [cleanUrls(), cleanUrlsBuild()],
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
