import { Html, Head, Main, NextScript } from 'next/document'
import config from '../lib/config'

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        {/* Basic Meta Tags */}
        <meta charSet="utf-8" />
        <meta name="author" content={config.BUSINESS.name} />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Preconnect to external resources for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        
        {/* Performance optimizations */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#f97316" />
        <meta name="msapplication-TileColor" content="#f97316" />
        
        {/* Structured Data for Restaurant */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Restaurant",
              "name": config.BUSINESS.name,
              "description": config.APP_DESCRIPTION,
              "url": config.APP_URL,
              "telephone": config.BUSINESS.phone,
              "email": config.BUSINESS.email,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Calle Gran Vía, 123",
                "addressLocality": "Madrid",
                "postalCode": "28013",
                "addressCountry": "ES"
              },
              "openingHours": "Mo-Su 11:00-23:00",
              "servesCuisine": "Italian",
              "priceRange": "$$",
              "acceptsReservations": true,
              "hasDeliveryService": true,
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "150"
              }
            })
          }}
        />
        
        {/* Google Analytics (if configured) */}
        {config.GOOGLE_ANALYTICS_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${config.GOOGLE_ANALYTICS_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${config.GOOGLE_ANALYTICS_ID}');
                `,
              }}
            />
          </>
        )}
      </Head>
      <body>
        {/* Skip to content link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-primary text-white p-2 z-50"
        >
          Saltar al contenido principal
        </a>
        
        <Main />
        <NextScript />
        
        {/* No JavaScript fallback */}
        <noscript>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            textAlign: 'center',
            padding: '20px'
          }}>
            <div>
              <h1>JavaScript Requerido</h1>
              <p>Este sitio web requiere JavaScript para funcionar correctamente.</p>
              <p>Por favor, habilita JavaScript en tu navegador.</p>
            </div>
          </div>
        </noscript>
      </body>
    </Html>
  )
} 