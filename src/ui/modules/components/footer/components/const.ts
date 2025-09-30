import { CookieConsentConfig } from 'vanilla-cookieconsent';

export const cookiesConfig = (locale: string): CookieConsentConfig => ({
  onFirstConsent: ({ cookie }) => {
    console.log('First consent:', cookie);
  },

  onConsent: ({ cookie }) => {
    console.log('Consent given:', cookie);

    // Si el usuario acepta analytics, inicializar Google Analytics
    if (cookie.categories.includes('analytics')) {
      // Aquí puedes inicializar GA4
      // window.gtag('consent', 'update', {
      //   analytics_storage: 'granted'
      // });
    }
  },

  onChange: ({ cookie, changedCategories }) => {
    console.log('Consent changed:', cookie, changedCategories);

    // Si el usuario cambia las preferencias de analytics
    if (changedCategories.includes('analytics')) {
      if (cookie.categories.includes('analytics')) {
        // Usuario aceptó analytics
        console.log('Analytics enabled');
      } else {
        // Usuario rechazó analytics
        console.log('Analytics disabled');
      }
    }
  },

  guiOptions: {
    consentModal: {
      layout: 'box inline',
      position: 'bottom left',
    },
    preferencesModal: {
      layout: 'box',
      position: 'right',
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
        cookies: [
          {
            name: /^(_ga|_gid)/,
          },
        ],
      },
    },
  },

  language: {
    default: locale,
    autoDetect: 'browser',
    translations: {
      en: {
        consentModal: {
          title: 'We use cookies',
          description:
            'We use essential cookies for basic website functionality and analytics cookies to understand how you interact with our site. Analytics cookies will only be set with your consent.',
          acceptAllBtn: 'Accept all',
          acceptNecessaryBtn: 'Reject all',
          showPreferencesBtn: 'Manage preferences',
        },
        preferencesModal: {
          title: 'Cookie preferences',
          acceptAllBtn: 'Accept all',
          acceptNecessaryBtn: 'Reject all',
          savePreferencesBtn: 'Save preferences',
          closeIconLabel: 'Close',
          sections: [
            {
              title: 'Cookie usage',
              description:
                'We use cookies to ensure basic website functionality and to understand how you use our site. You can manage your preferences below.',
            },
            {
              title: 'Strictly necessary cookies',
              description: 'These cookies are essential for the website to function properly. They cannot be disabled.',
              linkedCategory: 'necessary',
              cookieTable: {
                headers: {
                  name: 'Cookie',
                  domain: 'Domain',
                  description: 'Description',
                  expiration: 'Expiration',
                },
                body: [
                  {
                    name: 'user-country',
                    domain: 'Your domain',
                    description: 'Stores your country location for content localization',
                    expiration: 'Session',
                  },
                  {
                    name: 'cc_cookie',
                    domain: 'Your domain',
                    description: 'Stores your cookie preferences',
                    expiration: '6 months',
                  },
                ],
              },
            },
            {
              title: 'Analytics cookies',
              description:
                'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.',
              linkedCategory: 'analytics',
              cookieTable: {
                headers: {
                  name: 'Cookie',
                  domain: 'Domain',
                  description: 'Description',
                  expiration: 'Expiration',
                },
                body: [
                  {
                    name: '_ga',
                    domain: 'Google Analytics',
                    description:
                      'Used to distinguish users. See <a href="https://policies.google.com/technologies/cookies" target="_blank">Google\'s cookie policy</a>',
                    expiration: '2 years',
                  },
                  {
                    name: '_ga_*',
                    domain: 'Google Analytics',
                    description: 'Used to persist session state',
                    expiration: '2 years',
                  },
                  {
                    name: '_gid',
                    domain: 'Google Analytics',
                    description: 'Used to distinguish users',
                    expiration: '24 hours',
                  },
                ],
              },
            },
            {
              title: 'More information',
              description: 'For questions about our cookie policy, please <a href="/contact">contact us</a>.',
            },
          ],
        },
      },
      es: {
        consentModal: {
          title: 'Usamos cookies',
          description:
            'Usamos cookies esenciales para la funcionalidad básica del sitio y cookies de análisis para entender cómo interactúas con nuestro sitio. Las cookies de análisis solo se activarán con tu consentimiento.',
          acceptAllBtn: 'Aceptar todas',
          acceptNecessaryBtn: 'Rechazar todas',
          showPreferencesBtn: 'Gestionar preferencias',
        },
        preferencesModal: {
          title: 'Preferencias de cookies',
          acceptAllBtn: 'Aceptar todas',
          acceptNecessaryBtn: 'Rechazar todas',
          savePreferencesBtn: 'Guardar preferencias',
          closeIconLabel: 'Cerrar',
          sections: [
            {
              title: 'Uso de cookies',
              description:
                'Usamos cookies para garantizar la funcionalidad básica del sitio web y para entender cómo utilizas nuestro sitio. Puedes gestionar tus preferencias a continuación.',
            },
            {
              title: 'Cookies estrictamente necesarias',
              description:
                'Estas cookies son esenciales para que el sitio web funcione correctamente. No se pueden desactivar.',
              linkedCategory: 'necessary',
              cookieTable: {
                headers: {
                  name: 'Cookie',
                  domain: 'Dominio',
                  description: 'Descripción',
                  expiration: 'Expiración',
                },
                body: [
                  {
                    name: 'user-country',
                    domain: 'Tu dominio',
                    description: 'Almacena tu ubicación para la localización de contenido',
                    expiration: 'Sesión',
                  },
                  {
                    name: 'cc_cookie',
                    domain: 'Tu dominio',
                    description: 'Almacena tus preferencias de cookies',
                    expiration: '6 meses',
                  },
                ],
              },
            },
            {
              title: 'Cookies de análisis',
              description:
                'Estas cookies nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web mediante la recopilación y el informe de información de forma anónima.',
              linkedCategory: 'analytics',
              cookieTable: {
                headers: {
                  name: 'Cookie',
                  domain: 'Dominio',
                  description: 'Descripción',
                  expiration: 'Expiración',
                },
                body: [
                  {
                    name: '_ga',
                    domain: 'Google Analytics',
                    description:
                      'Se utiliza para distinguir usuarios. Ver <a href="https://policies.google.com/technologies/cookies?hl=es" target="_blank">política de cookies de Google</a>',
                    expiration: '2 años',
                  },
                  {
                    name: '_ga_*',
                    domain: 'Google Analytics',
                    description: 'Se utiliza para mantener el estado de la sesión',
                    expiration: '2 años',
                  },
                  {
                    name: '_gid',
                    domain: 'Google Analytics',
                    description: 'Se utiliza para distinguir usuarios',
                    expiration: '24 horas',
                  },
                ],
              },
            },
            {
              title: 'Más información',
              description:
                'Para preguntas sobre nuestra política de cookies, por favor <a href="/contact">contáctanos</a>.',
            },
          ],
        },
      },
    },
  },
});
