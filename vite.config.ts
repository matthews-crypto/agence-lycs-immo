
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { Prerenderer } from '@prerenderer/prerenderer';
import PuppeteerRenderer from '@prerenderer/renderer-puppeteer';
import { componentTagger } from "lovable-tagger";
import ssr from 'vite-plugin-ssr/plugin';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
      ssr(),
      isProd && {
        name: 'prerender',
        configureServer(server) {
          return () => {
            const prerenderer = new Prerenderer({
              renderer: new PuppeteerRenderer({
                renderAfterTime: 2000,
                injectProperty: '__PRERENDER_INJECTED',
                waitForSelector: 'meta[property="og:image"]',
              }),
              staticDir: path.join(__dirname, 'dist'),
              server: {
                port: 8080,
              },
              routes: [
                '/',
                '/:agencySlug/properties/:propertyId/public'
              ],
            });

            return prerenderer.initialize()
              .then(() => prerenderer.renderRoutes(['/']))
              .then(() => prerenderer.destroy());
          };
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    preview: {
      host: "::",
      port: 8080,
      strictPort: true,
    },
    define: {
      'process.env.VITE_PUBLIC_SITE_URL': JSON.stringify(env.VITE_PUBLIC_SITE_URL),
    },
  };
});
