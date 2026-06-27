import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'static',
  site: 'https://room-layout-fengshui-planner.pages.dev',
  integrations: [sitemap()],
});
