import type { MetadataRoute } from 'next'

// Manifesto do app do painel. Fica fora de app/manifest.ts de propósito: lá ele
// valeria para o site todo, e o navegador ofereceria "Instalar" às clientes na
// landing page. Só o painel e o login apontam para ele.
const manifest: MetadataRoute.Manifest = {
  name: 'Gabriela Probst · Painel',
  short_name: 'Gabriela',
  description: 'Agenda, clientes e resumo do mês.',
  // Abre direto na agenda; o login também fica dentro do app.
  start_url: '/painel',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#F5F3F0',
  theme_color: '#FFFFFF',
  lang: 'pt-BR',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}

export function GET() {
  return Response.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}
