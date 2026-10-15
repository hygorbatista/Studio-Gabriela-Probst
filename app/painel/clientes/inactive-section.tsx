import Link from 'next/link'
import { WhatsAppIcon } from '@/components/icons'
import { whatsappTo } from '@/lib/phone'
import { getInactiveClients } from './data'

// Clientes que não voltam há um tempo, com um convite pronto no WhatsApp.
export async function InactiveSection() {
  const { threshold, clients } = await getInactiveClients()
  if (clients.length === 0) return null

  return (
    <details className="group mb-8 bg-surface shadow-card">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 [&::-webkit-details-marker]:hidden">
        <span className="text-base">
          <strong>
            {clients.length} {clients.length === 1 ? 'cliente sumida' : 'clientes sumidas'}
          </strong>{' '}
          <span className="text-muted-foreground">há mais de {threshold} dias</span>
        </span>
        <span aria-hidden className="text-lg text-primary transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <ul className="border-t border-border">
        {clients.map((c) => (
          <li key={c.id} className="flex items-center gap-2 border-b border-border px-4 last:border-b-0">
            <Link href={`/painel/clientes/${c.id}`} className="flex min-h-14 flex-1 flex-col justify-center py-2">
              <span className="text-base font-semibold">{c.name}</span>
              <span className="text-base text-muted-foreground">Última visita há {c.daysAway} dias</span>
            </Link>
            {c.phone && (
              <a
                href={whatsappTo(
                  c.phone,
                  `Olá, ${c.name.split(' ')[0]}! Tudo bem? Faz um tempinho desde a sua última visita. Quer agendar um horário?`
                )}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Chamar ${c.name} no WhatsApp`}
                className="inline-flex size-11 shrink-0 items-center justify-center border border-border hover:border-primary hover:text-primary"
              >
                <WhatsAppIcon className="size-5" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </details>
  )
}
