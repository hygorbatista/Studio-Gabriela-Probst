import { ImageResponse } from 'next/og'
import { loadBrandFonts } from '@/lib/brand-image'

const fonts = await loadBrandFonts()

// Ícone do app instalado: "G" branco sobre preto, como o monograma do painel.
// maskable: o Android recorta o ícone em círculo ou gota; o "G" fica menor,
// dentro da área segura (80% do centro).
export function appIcon(size: number, { maskable = false } = {}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B0B0C',
          color: '#FFFFFF',
          fontFamily: 'Playfair Display',
          fontSize: size * (maskable ? 0.5 : 0.74),
          lineHeight: 1,
          paddingBottom: size * 0.05,
        }}
      >
        G
      </div>
    ),
    { width: size, height: size, fonts: [...fonts] }
  )
}
