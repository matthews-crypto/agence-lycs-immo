
import { defineConfig, loadEnv, ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { type Prerenderer } from '@prerenderer/prerenderer';
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
        configureServer(server: ViteDevServer) {
          return () => {
            // Using require to get the actual class constructor at runtime
            const PrerendererClass = require('@prerenderer/prerenderer').Prerenderer;
            const prerenderer = new PrerendererClass({
              renderer: new PuppeteerRenderer({
                renderAfterTime: 2000,
                injectProperty: '__PRERENDER_INJECTED',
                maxConcurrentRoutes: 4,
              }),
              staticDir: path.join(__dirname, 'dist'),
              server: {
                port: 8080,
              },
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

