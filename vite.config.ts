
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { viteStaticCopy } from 'vite-plugin-static-copy';
import puppeteer from 'puppeteer';
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    {
      name: 'prerender',
      apply: 'build',
      async closeBundle() {
        console.log('Starting prerender process...');
        const browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
          const page = await browser.newPage();
          await page.setViewport({ width: 1200, height: 630 });

          // Wait for network requests and animations
          await page.setDefaultNavigationTimeout(10000);
          await page.setDefaultTimeout(10000);

          console.log('Prerendering pages...');
          // Add your routes to be prerendered here
          const routes = ['/'];
          
          for (const route of routes) {
            console.log(`Prerendering ${route}...`);
            await page.goto(`http://localhost:8080${route}`, {
              waitUntil: ['networkidle0', 'domcontentloaded']
            });

            // Wait for meta tags to be properly set
            await page.waitForSelector('meta[property="og:title"]');
            
            // Extract and save the prerendered HTML
            const html = await page.content();
            // You can save the HTML here if needed
            console.log(`Prerendered ${route} successfully`);
          }
        } catch (error) {
          console.error('Prerender error:', error);
          throw error;
        } finally {
          await browser.close();
          console.log('Prerender process completed');
        }
      }
    }
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
}));
