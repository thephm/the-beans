import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Navbar } from '@/components/Navbar'
import { ConditionalFooter } from '@/components/ConditionalFooter'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'The Beans - Coffee Roaster Discovery',
  description: 'Discover fresh coffee roasters near you',
  manifest: '/manifest.json',
}




import { DarkModeScript } from './theme-script'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
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
      <body className={`${inter.className} min-h-screen`}>
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
