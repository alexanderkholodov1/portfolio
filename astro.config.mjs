import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  build: { assets: 'assets' },
  server: { host: '127.0.0.1' },
  devToolbar: { enabled: false },
});
