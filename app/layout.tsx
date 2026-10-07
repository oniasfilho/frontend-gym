import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import { DEFAULT_THEME } from '@/lib/themes'
import './globals.css'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains-mono' })

// Swaps in the saved theme, if any, before first paint. Reads the same key as hooks/use-progress.ts.
const THEME_SCRIPT = `try{var t=JSON.parse(localStorage.getItem('reshape:progress:v1')||'{}').theme;if(typeof t==='string')document.documentElement.dataset.theme=t}catch(e){}`

export const metadata: Metadata = {
  title: 'frontend.gym() — practice JS data transformations',
  description:
    'A minimal workspace for practicing real-world JavaScript and TypeScript data transformations with map, filter, reduce and friends.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  // The Mono ground, oklch(0.155 0 0).
  themeColor: '#0c0c0c',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-theme={DEFAULT_THEME} className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Script id="theme" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
