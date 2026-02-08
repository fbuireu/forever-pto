interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudflareImageLoader({ src, width, quality }: ImageLoaderParams): string {
  const params = [`width=${width}`, `quality=${quality || 75}`, 'format=auto'];

  return `/cdn-cgi/image/${params.join(',')}/${src}`;
}
