import { defineConfig } from 'astro/config';
import path from 'node:path';

// Test seam: tests/projects-collection.test.mjs builds the site against a fixture content module.
// It is inert unless PORTFOLIO_CONTENT_FIXTURE is set.
const fixture = process.env.PORTFOLIO_CONTENT_FIXTURE && path.resolve(process.env.PORTFOLIO_CONTENT_FIXTURE);
const contentFixture = {
  name: 'content-fixture',
  enforce: 'pre',
  async resolveId(source, importer, options) {
    if (!importer || path.resolve(importer) === fixture || !/\/data\/content(\.ts)?$/.test(source)) return null;
    const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
    return resolved?.id.endsWith(path.join('src', 'data', 'content.ts')) ? fixture : null;
  },
};

export default defineConfig({
  site: 'https://alexanderkholodov.web.app',
  output: 'static',
  trailingSlash: 'always',
  build: { assets: 'assets', inlineStylesheets: 'always' },
  server: { host: '127.0.0.1' },
  devToolbar: { enabled: false },
  vite: { plugins: fixture ? [contentFixture] : [] },
});
