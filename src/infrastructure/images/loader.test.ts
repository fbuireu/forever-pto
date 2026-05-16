import { describe, expect, it } from 'vitest';
import cloudflareImageLoader, { DEFAULT_QUALITY } from './loader';

describe('cloudflareImageLoader', () => {
  it('builds the cdn-cgi URL with width, quality, and format', () => {
    expect(cloudflareImageLoader({ src: 'images/photo.jpg', width: 800, quality: 90 })).toBe(
      '/cdn-cgi/image/width=800,quality=90,format=auto/images/photo.jpg'
    );
  });

  it('uses the default quality when quality is omitted', () => {
    expect(cloudflareImageLoader({ src: 'images/photo.jpg', width: 400 })).toBe(
      `/cdn-cgi/image/width=400,quality=${DEFAULT_QUALITY},format=auto/images/photo.jpg`
    );
  });

  it('uses the default quality when quality is 0', () => {
    expect(cloudflareImageLoader({ src: 'images/photo.jpg', width: 400, quality: 0 })).toBe(
      `/cdn-cgi/image/width=400,quality=${DEFAULT_QUALITY},format=auto/images/photo.jpg`
    );
  });

  it('strips a leading slash from src', () => {
    expect(cloudflareImageLoader({ src: '/images/photo.jpg', width: 800, quality: 80 })).toBe(
      '/cdn-cgi/image/width=800,quality=80,format=auto/images/photo.jpg'
    );
  });

  it('does not alter src that has no leading slash', () => {
    expect(cloudflareImageLoader({ src: 'images/photo.jpg', width: 800, quality: 80 })).toBe(
      '/cdn-cgi/image/width=800,quality=80,format=auto/images/photo.jpg'
    );
  });

  it('always sets format=auto', () => {
    const url = cloudflareImageLoader({ src: 'img.png', width: 100, quality: 50 });
    expect(url).toContain('format=auto');
  });
});
