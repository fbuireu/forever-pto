import type { Locale } from 'next-intl';

interface HtmlLangSyncProps {
  locale: Locale;
}

export const HtmlLangSync = ({ locale }: HtmlLangSyncProps) => (
  <script
    // biome-ignore lint/security/noDangerouslySetInnerHtml: syncs <html lang> as soon as the streamed chunk parses, without waiting for hydration
    dangerouslySetInnerHTML={{ __html: `document.documentElement.lang=${JSON.stringify(locale)};` }}
  />
);
