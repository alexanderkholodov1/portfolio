import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://alexanderkholodov.web.app',
  output: 'static',
  trailingSlash: 'always',
  build: { assets: 'assets', inlineStylesheets: 'always' },
  server: { host: '127.0.0.1' },
  devToolbar: { enabled: false },
});
