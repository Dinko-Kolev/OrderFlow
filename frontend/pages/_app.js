import '../styles/globals.css'
import { MainNav } from '../components/MainNav'
import { AuthProvider } from '../contexts/AuthContext'
import { CartProvider } from '../contexts/CartContext'
import ErrorBoundary from '../components/ErrorBoundary'
import Head from 'next/head'
import config from '../lib/config'

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <Head>
        {/* Default meta tags for all pages */}
        <title>{config.APP_NAME}</title>
        <meta name="description" content={config.APP_DESCRIPTION} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={config.APP_URL} />
        <meta property="og:title" content={config.APP_NAME} />
        <meta property="og:description" content={config.APP_DESCRIPTION} />
        <meta property="og:image" content={`${config.APP_URL}/og-image.png`} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={config.APP_URL} />
        <meta property="twitter:title" content={config.APP_NAME} />
        <meta property="twitter:description" content={config.APP_DESCRIPTION} />
        <meta property="twitter:image" content={`${config.APP_URL}/og-image.png`} />
      </Head>
      
      <AuthProvider>
        <CartProvider>
          <MainNav />
          <main id="main-content">
            <Component {...pageProps} />
          </main>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
} 