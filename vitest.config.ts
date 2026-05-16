import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'happy-dom',
    env: {
      NEXT_PUBLIC_SITE_URL: 'https://forever-pto.com',
    },
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['e2e/**', 'node_modules/**', 'src/ui/assets/icons/**', 'src/ui/modules/core/animate/icons/**', 'src/ui/i18n/messages/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/**/*.types.ts',
        'src/app/fonts.ts',
        'src/ui/modules/bones/registry.ts',
      ],
    },
  },
});
