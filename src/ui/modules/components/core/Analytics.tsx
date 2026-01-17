import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

export const Analytics = () => {
  return (
    <>
      <Script id="google-consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}

          gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied'
          });
        `}
      </Script>
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script id="google-analytics-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');

          window.addEventListener('cc:onConsent', function(event) {
            var detail = event.detail;
            if (detail.cookie.categories.includes('analytics')) {
              gtag('consent', 'update', { 'analytics_storage': 'granted' });
            }
          });

          window.addEventListener('cc:onChange', function(event) {
            var detail = event.detail;
            if (detail.changedCategories.includes('analytics')) {
              var granted = detail.cookie.categories.includes('analytics');
              gtag('consent', 'update', {
                'analytics_storage': granted ? 'granted' : 'denied'
              });
              if (granted) {
                gtag('event', 'page_view');
              }
            }
          });
        `}
      </Script>
    </>
  );
};
