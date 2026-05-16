const LEADING_SLASH = /^\//;
export const DEFAULT_QUALITY = 75;

interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudflareImageLoader({ src, width, quality }: ImageLoaderParams) {
  const params = [`width=${width}`, `quality=${quality || DEFAULT_QUALITY}`, 'format=auto'];

  const normalizedSrc = src.replace(LEADING_SLASH, '');

  return `/cdn-cgi/image/${params.join(',')}/${normalizedSrc}`;
}
