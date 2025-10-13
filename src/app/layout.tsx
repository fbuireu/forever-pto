import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
} as const);

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
} as const);

export type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

const RootLayout = async ({ children }: RootLayoutProps) => {
  return (
    <html lang={'en'} className={geistSans.className}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <main>{children}</main>
      </body>
    </html>
  );
};

export default RootLayout;
