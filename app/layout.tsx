import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lumina',
  description: 'Your personal inspiration library',
  appleWebApp: {
    capable: true,
    title: 'Lumina',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    apple: '/lumina/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f0f0f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>{children}</body>
    </html>
  )
}
