import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const dir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Classic `/embed.js` for merchant pages (Goftino-style).
 * Loads a Vite-origin module that installs the React Refresh preamble
 * before importing the widget — required when the host page is not Vite.
 */
function serveEmbedDev(): Plugin {
  return {
    name: 'seloma-serve-embed',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];

        if (url === '/embed-boot.js') {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.setHeader('Access-Control-Allow-Origin', '*');
          // Preamble MUST run before any @vitejs/plugin-react module loads.
          // Static import of embed.tsx would be hoisted — use dynamic import.
          res.end(`import RefreshRuntime from "/@react-refresh";
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;
import("/src/embed.tsx");
`);
          return;
        }

        if (url !== '/embed.js') {
          next();
          return;
        }

        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(`(function () {
  var nodes = document.querySelectorAll('script[src*="embed.js"]');
  var el = nodes[nodes.length - 1];
  var publicKey = (el && el.getAttribute('data-public-key')) || '';
  var apiBase = (el && el.getAttribute('data-api-base')) || undefined;
  var base = el && el.src ? el.src.replace(/\\/embed\\.js(\\?.*)?$/, '') : '';
  window.__SELOMA_EMBED__ = { publicKey: publicKey, apiBase: apiBase };
  window.__DELOREY_EMBED__ = window.__SELOMA_EMBED__;
  var s = document.createElement('script');
  s.type = 'module';
  s.crossOrigin = 'anonymous';
  s.src = base + '/embed-boot.js';
  (document.head || document.documentElement).appendChild(s);
})();`);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveEmbedDev()],
  server: {
    port: 5173,
    host: true,
    cors: true,
  },
  build: {
    lib: {
      entry: path.resolve(dir, 'src/embed.tsx'),
      name: 'SelomaWidget',
      formats: ['iife'],
      fileName: () => 'embed.js',
    },
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: 'embed.[ext]',
      },
    },
  },
});
