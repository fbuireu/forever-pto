import { Link } from '@application/i18n/navigation';
import type { ComponentProps, ReactNode } from 'react';

interface RichLinkProps {
  href: string;
  className?: string;
  external?: boolean;
  children?: ReactNode;
}

const DEFAULT_CLASS = 'text-primary hover:underline';

export function RichLink({ href, className = DEFAULT_CLASS, external, children }: RichLinkProps) {
  if (external) {
    return (
      <a href={href} target='_blank' rel='noopener noreferrer' className={className}>
        {children}
      </a>
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
}

export function createRichLink(href: string, options?: CreateRichLinkOptions) {
  return function RichLinkTag({ children }: { children?: ReactNode }) {
    return (
      <RichLink href={href} className={options?.className} external={options?.external}>
        {children}
      </RichLink>
    );
  };
}
