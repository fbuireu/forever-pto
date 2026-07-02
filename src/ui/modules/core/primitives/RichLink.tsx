import { getPathname, Link } from '@application/i18n/navigation';
import NextLink from 'next/link';
import type { Locale } from 'next-intl';
import type { ComponentProps, ReactNode } from 'react';

interface RichLinkProps {
  href: string;
  className?: string;
  external?: boolean;
  locale?: Locale;
  children?: ReactNode;
}

const DEFAULT_CLASS = 'text-primary hover:underline';

export function RichLink({ href, className = DEFAULT_CLASS, external, locale, children }: RichLinkProps) {
  if (external) {
    return (
      <a href={href} target='_blank' rel='noopener noreferrer' className={className}>
        {children}
      </a>
    );
  }

  if (locale) {
    const localizedHref = href.startsWith('/')
      ? getPathname({ locale, href: href as Parameters<typeof getPathname>[0]['href'] })
      : href;

    return (
      <NextLink href={localizedHref} className={className}>
        {children}
      </NextLink>
    );
  }

  return (
    <Link href={href as ComponentProps<typeof Link>['href']} className={className}>
      {children}
    </Link>
  );
}

interface CreateRichLinkOptions {
  className?: string;
  external?: boolean;
  locale?: Locale;
}

export function createRichLink(href: string, options?: CreateRichLinkOptions) {
  return function RichLinkTag(chunks: ReactNode) {
    return (
      <RichLink href={href} className={options?.className} external={options?.external} locale={options?.locale}>
        {chunks}
      </RichLink>
    );
  };
}
