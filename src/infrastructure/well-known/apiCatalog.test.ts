import { describe, expect, it } from 'vitest';
import { apiCatalog } from './apiCatalog';

const BASE_URL = 'https://forever-pto.com';

describe('apiCatalog', () => {
  it('returns 200 with linkset+json content-type', () => {
    const res = apiCatalog(BASE_URL);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/linkset+json');
  });

  it('sets cache-control', () => {
    expect(apiCatalog(BASE_URL).headers.get('Cache-Control')).toBe('public, max-age=86400');
  });

  it('anchors linkset to baseUrl', async () => {
    const { linkset } = await apiCatalog(BASE_URL).json();
    expect(linkset[0].anchor).toBe(BASE_URL);
  });

  it('points service-doc and status to /api/health', async () => {
    const { linkset } = await apiCatalog(BASE_URL).json();
    const entry = linkset[0];
    expect(entry['https://www.iana.org/assignments/link-relations/service-doc'][0].href).toBe(`${BASE_URL}/api/health`);
    expect(entry['https://www.iana.org/assignments/link-relations/status'][0].href).toBe(`${BASE_URL}/api/health`);
  });
});
