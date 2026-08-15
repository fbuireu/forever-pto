import { expect, test } from '@playwright/test';

test('DIAG: hammer /api/markdown and print every response', async ({ request }) => {
  const urls = ['/api/markdown', '/api/markdown?path=/en/planner', '/api/markdown?path=/es/legal/privacy-policy'];
  const seen: string[] = [];

  for (let round = 0; round < 6; round++) {
    for (const url of urls) {
      const response = await request.get(url);
      const status = response.status();
      const ct = response.headers()['content-type'] ?? '(none)';
      const body = await response.text();
      const head = body.slice(0, 400).replace(/\n/g, ' ');
      seen.push(`[${round}] ${url} -> ${status} ct=${ct} len=${body.length} :: ${head}`);
    }
  }

  console.log('\n===== DIAG START =====\n' + seen.join('\n') + '\n===== DIAG END =====\n');
  expect(seen.length).toBe(18);
});
