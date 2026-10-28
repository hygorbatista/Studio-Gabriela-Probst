'use client'

import { Check } from 'lucide-react'
import { cn } from 'cn'
import { formatDuration, formatPrice, promoActive } from '@/lib/format'

export type ServiceOption = {
  id: string
  name: string
  price: number
  promo_price: number | null
  promo_until: string | null
  duration_minutes: number
  duration_up_to: boolean
  // Só no Editar: serviço desativado que já estava no atendimento.
  active?: boolean
}

// Lista de serviços para marcar um ou mais (ex.: mãos e pés), com duração e
// preço cheio. A promoção aparece como aviso; aplicar é escolha dela, no fim do
// Agendar. Usada no Agendar e no Editar.
export function ServiceChecklist({
  services,
  selected,
  onToggle,
  today,
  usualId,
  priceOf,
}: {
  services: ServiceOption[]
  selected: string[]
  onToggle: (id: string) => void
  today: string
  // Serviço de costume da cliente, com a etiqueta "de costume".
  usualId?: string
  // No Editar, o preço de um serviço que já estava no atendimento (promoção mantida).
  priceOf?: (s: ServiceOption) => number | undefined
}) {
  return (
    <div className="flex flex-col gap-2">
      {services.map((s) => {
        const on = selected.includes(s.id)
        const kept = priceOf?.(s)
        const promo = kept === undefined && promoActive(s, today)
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onToggle(s.id)}
            aria-pressed={on}
            className={cn(
              'flex min-h-12 items-center gap-3 border px-4 py-2 text-left text-base',
              on ? 'border-primary bg-primary-soft' : 'border-input bg-surface hover:border-foreground'
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'grid size-5 shrink-0 place-items-center border',
                on ? 'border-primary bg-primary text-white' : 'border-input'
              )}
            >
              {on && <Check className="size-3.5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">
                {s.name}
                {usualId === s.id && <span className="ml-2 text-sm font-normal text-muted-foreground">de costume</span>}
                {s.active === false && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">desativado</span>
                )}
              </span>
              <span className="block text-sm text-muted-foreground">
                {formatDuration(s.duration_minutes, s.duration_up_to)}
              </span>
            </span>
            {/* Preço cheio; a promoção só avisa que existe. Ela escolhe aplicar no fim. */}
            <span className="shrink-0 text-right text-sm">
              <span className="block font-semibold">{formatPrice(kept ?? s.price)}</span>
              {promo && (
                <span className="block font-semibold text-primary">Promoção: {formatPrice(s.promo_price!)}</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
