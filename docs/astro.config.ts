import { fileURLToPath } from 'node:url';
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://docs.forever-pto.com',
  integrations: [
    starlight({
      title: 'Forever PTO',
      description: 'Documentation and internal wiki for Forever PTO — the PTO optimization tool.',
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
      },
      favicon: '/favicon.svg',
      customCss: ['./src/styles/global.css'],
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        es: { label: 'Español', lang: 'es' },
      },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/fbuireu/forever-pto' }],
      editLink: { baseUrl: 'https://github.com/fbuireu/forever-pto/edit/main/docs/' },
      lastUpdated: true,
      expressiveCode: { themes: ['github-dark', 'github-light'] },
      sidebar: [
        {
          label: 'Start here',
          translations: { es: 'Empieza aquí' },
          items: [{ autogenerate: { directory: 'start' } }],
        },
        {
          label: 'Architecture',
          translations: { es: 'Arquitectura' },
          collapsed: true,
          items: [{ autogenerate: { directory: 'architecture' } }],
        },
        {
          label: 'How it works',
          translations: { es: 'Cómo funciona' },
          collapsed: true,
          items: [{ autogenerate: { directory: 'how-it-works' } }],
        },
        {
          label: 'Design system',
          translations: { es: 'Design system' },
          collapsed: true,
          items: [
            {
              label: 'Foundations',
              items: [{ autogenerate: { directory: 'design-system/foundations' } }],
            },
            {
              label: 'Components',
              collapsed: true,
              items: [{ autogenerate: { directory: 'design-system/components' } }],
            },
            {
              label: 'Animation',
              collapsed: true,
              items: [{ autogenerate: { directory: 'design-system/animation' } }],
            },
            {
              label: 'Patterns',
              collapsed: true,
              items: [{ autogenerate: { directory: 'design-system/patterns' } }],
            },
          ],
        },
        {
          label: 'Infrastructure & CI/CD',
          translations: { es: 'Infraestructura y CI/CD' },
          collapsed: true,
          items: [{ autogenerate: { directory: 'infra' } }],
        },
        {
          label: 'Reference',
          translations: { es: 'Referencia' },
          collapsed: true,
          items: [{ autogenerate: { directory: 'reference' } }],
        },
        {
          label: 'Contributing',
          translations: { es: 'Contribuir' },
          collapsed: true,
          items: [{ autogenerate: { directory: 'contributing' } }],
        },
      ],
    }),
    react({ experimentalReactChildren: true }),
  ],
  vite: {
    plugins: [tailwindcss()],
    // Tailwind runs via the Vite plugin; an inline (empty) PostCSS config stops
    // Vite from walking up and loading the app's postcss.config.mjs.
    css: { postcss: { plugins: [] } },
    resolve: {
      alias: {
        '@ui': fileURLToPath(new URL('../src/ui', import.meta.url)),
      },
    },
  },
});
