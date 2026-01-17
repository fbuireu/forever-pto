'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';
import * as CookieConsentLib from 'vanilla-cookieconsent';
import 'vanilla-cookieconsent/dist/cookieconsent.css';

const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

export const CookieConsent = () => {
  const { resolvedTheme } = useTheme();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    CookieConsentLib.run({
      guiOptions: {
        consentModal: {
          layout: 'box inline',
          position: 'bottom left',
        },
        preferencesModal: {
          layout: 'box',
        },
      },

      categories: {
        necessary: {
          enabled: true,
          readOnly: true,
        },
        analytics: {
          autoClear: {
            cookies: [
              { name: /^_ga/ },
              { name: '_gid' },
            ],
          },
        },
      },

      onFirstConsent: () => {
        if (CookieConsentLib.acceptedCategory('analytics')) {
          gtag('consent', 'update', { analytics_storage: 'granted' });
        }
      },

      onConsent: () => {
        if (CookieConsentLib.acceptedCategory('analytics')) {
          gtag('consent', 'update', { analytics_storage: 'granted' });
        }
      },

      onChange: ({ changedCategories }) => {
        if (changedCategories.includes('analytics')) {
          const granted = CookieConsentLib.acceptedCategory('analytics');
          gtag('consent', 'update', {
            analytics_storage: granted ? 'granted' : 'denied',
          });
        }
      },

      language: {
        default: 'en',
        translations: {
          en: {
            consentModal: {
              title: 'We use cookies',
              description:
                'We use essential cookies for basic website functionality and analytics cookies to understand how you interact with our site.',
              acceptAllBtn: 'Accept all',
              acceptNecessaryBtn: 'Reject all',
              showPreferencesBtn: 'Manage preferences',
            },
            preferencesModal: {
              title: 'Cookie preferences',
              acceptAllBtn: 'Accept all',
              acceptNecessaryBtn: 'Reject all',
              savePreferencesBtn: 'Save preferences',
              sections: [
                {
                  title: 'Cookie usage',
                  description:
                    'We use cookies to improve your browsing experience and analyze site traffic. Choose which cookies you want to accept.',
                },
                {
                  title: 'Necessary cookies',
                  description:
                    'Essential for the website to function. These cookies are required for basic features like page navigation and cannot be disabled.',
                  linkedCategory: 'necessary',
                },
                {
                  title: 'Analytics cookies',
                  description:
                    'Help us understand visitor behavior through anonymous data collection. We use Google Analytics with Consent Mode V2.',
                  linkedCategory: 'analytics',
                  cookieTable: {
                    headers: {
                      name: 'Name',
                      description: 'Description',
                      duration: 'Duration',
                    },
                    body: [
                      {
                        name: '_ga',
                        description: 'Distinguishes unique users',
                        duration: '2 years',
                      },
                      {
                        name: '_ga_*',
                        description: 'Maintains session state',
                        duration: '2 years',
                      },
                      {
                        name: '_gid',
                        description: 'Distinguishes users (short-term)',
                        duration: '24 hours',
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('cc--darkmode', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  return null;
};

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(args);
  }
}
