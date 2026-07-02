import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'static',
  site: 'https://roomfeng.win',
  integrations: [
    sitemap({
      filter(page) {
        const path = new URL(page).pathname;
        return !path.startsWith('/tools/') && path !== '/zh/' && path !== '/404' && path !== '/404/' && path !== '/404.html';
      },
    }),
  ],
});
