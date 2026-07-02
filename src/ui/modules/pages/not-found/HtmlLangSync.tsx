'use client';

import type { Locale } from 'next-intl';
import { useEffect } from 'react';

interface HtmlLangSyncProps {
  locale: Locale;
}

export const HtmlLangSync = ({ locale }: HtmlLangSyncProps) => {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
};
