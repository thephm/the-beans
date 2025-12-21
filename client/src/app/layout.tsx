import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Navbar } from '@/components/Navbar'
import { ConditionalFooter } from '@/components/ConditionalFooter'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://thebeans.onrender.com'),
  title: {
    default: 'The Beans - Coffee Roaster Discovery',
    template: '%s | The Beans',
  },
  description: 'Discover fresh coffee roasters near you. Find local coffee shops, read reviews, and explore specialty coffee roasters in your area.',
  keywords: ['coffee', 'roasters', 'coffee shops', 'specialty coffee', 'local coffee', 'coffee discovery'],
  authors: [{ name: 'The Beans' }],
  creator: 'The Beans',
  publisher: 'The Beans',
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'The Beans - Coffee Roaster Discovery',
    description: 'Discover fresh coffee roasters near you',
    siteName: 'The Beans',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Beans - Coffee Roaster Discovery',
    description: 'Discover fresh coffee roasters near you',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
}




import { DarkModeScript } from './theme-script'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" sizes="192x192" />
        <meta name="theme-color" content="#a673ff" />
        {/* Prevent white flash in dark mode: set dark class before hydration */}
        <script dangerouslySetInnerHTML={{__html:`
          (function() {
            try {
              var stored = localStorage.getItem('darkMode');
              var isDark = stored === 'true' ? true : (stored === 'false' ? false : window.matchMedia('(prefers-color-scheme: dark)').matches);
              if (isDark) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (e) {}
          })();
        `}} />
      </head>
      <body className={`${inter.className} min-h-screen`} suppressHydrationWarning>
        <Providers>
          <DarkModeScript />
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <ConditionalFooter />
          </div>
        </Providers>
      </body>
    </html>
  )
}
