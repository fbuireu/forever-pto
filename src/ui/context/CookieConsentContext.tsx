'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import * as CookieConsentLib from 'vanilla-cookieconsent';

const COOKIE_CATEGORY_NECESSARY = 'necessary';
const COOKIE_CATEGORY_ANALYTICS = 'analytics';
const COOKIE_CATEGORIES = [COOKIE_CATEGORY_NECESSARY, COOKIE_CATEGORY_ANALYTICS];

interface CookieConsentContextType {
  isInitialized: boolean;
  showConsentModal: boolean;
  setShowConsentModal: (show: boolean) => void;
  analyticsEnabled: boolean;
  setAnalyticsEnabled: (enabled: boolean) => void;
  handleAcceptAll: () => void;
  handleRejectAll: () => void;
  handleSavePreferences: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | null>(null);

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    CookieConsentLib.run({
      disablePageInteraction: false,
      hideFromBots: true,
      guiOptions: {
        consentModal: {
          layout: 'box',
          position: 'bottom left',
        },
      },
      categories: {
        necessary: {
          enabled: true,
          readOnly: true,
        },
        analytics: {
          enabled: false,
          readOnly: false,
          autoClear: {
            cookies: [{ name: /^_ga/ }, { name: '_gid' }],
          },
        },
      },
      language: {
        default: 'en',
        translations: {
          en: {
            consentModal: {
              title: '',
              description: '',
              acceptAllBtn: '',
              acceptNecessaryBtn: '',
              showPreferencesBtn: '',
            },
            preferencesModal: {
              title: '',
              acceptAllBtn: '',
              acceptNecessaryBtn: '',
              savePreferencesBtn: '',
              sections: [],
            },
          },
        },
      },
    }).then(() => {
      setIsInitialized(true);
      const cookie = CookieConsentLib.getCookie();
      const hasAnalytics = cookie?.categories?.includes(COOKIE_CATEGORY_ANALYTICS) ?? false;
      setAnalyticsEnabled(hasAnalytics);

      if (!cookie?.categories || cookie.categories.length === 0) {
        setShowConsentModal(true);
      }
    });
  }, []);

  const handleAcceptAll = useCallback(() => {
    CookieConsentLib.acceptCategory(COOKIE_CATEGORIES);
    setAnalyticsEnabled(true);
  }, []);

  const handleRejectAll = useCallback(() => {
    CookieConsentLib.acceptCategory([COOKIE_CATEGORY_NECESSARY]);
    setAnalyticsEnabled(false);
  }, []);

  const handleSavePreferences = useCallback(() => {
    if (analyticsEnabled) {
      CookieConsentLib.acceptCategory(COOKIE_CATEGORIES);
    } else {
      CookieConsentLib.acceptCategory([COOKIE_CATEGORY_NECESSARY]);
    }
  }, [analyticsEnabled]);

  return (
    <CookieConsentContext.Provider
      value={{
        isInitialized,
        showConsentModal,
        setShowConsentModal,
        analyticsEnabled,
        setAnalyticsEnabled,
        handleAcceptAll,
        handleRejectAll,
        handleSavePreferences,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};
