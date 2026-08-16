interface SkipToContentProps {
  label: string;
}

export const SkipToContent = ({ label }: SkipToContentProps) => (
  <a
    href='#main-content'
    className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-3 focus:py-1.5 focus:text-sm focus:bg-background focus:text-foreground focus:border focus:rounded-md focus:shadow-sm'
  >
    {label}
  </a>
);
