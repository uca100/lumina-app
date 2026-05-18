import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lumina',
    short_name: 'Lumina',
    description: 'Your personal inspiration library',
    start_url: '/lumina',
    scope: '/lumina',
    display: 'standalone',
    background_color: '#0f0f0f',
    theme_color: '#0f0f0f',
    icons: [
      { src: '/lumina/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/lumina/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
