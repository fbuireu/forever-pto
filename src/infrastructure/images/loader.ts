interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudflareImageLoader({ src, width, quality }: ImageLoaderParams): string {
  const params = [`width=${width}`, `quality=${quality || 75}`, 'format=auto'];
  const LEADING_SLASH = /^\//;
  const normalizedSrc = src.replace(LEADING_SLASH, '');

  return `/cdn-cgi/image/${params.join(',')}/${normalizedSrc}`;
}
