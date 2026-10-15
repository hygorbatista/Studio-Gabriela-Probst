import { cn } from 'cn'
import { initials, tone } from '@/lib/client-list'

// Tons discretos da paleta; cada cliente fica sempre com o mesmo.
const tones = [
  'bg-primary-soft text-primary',
  'bg-muted text-foreground',
  'bg-success/12 text-success',
  'bg-foreground text-white',
]

export function Initials({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-11 shrink-0 place-items-center text-sm font-semibold tracking-wide',
        tones[tone(name)],
        className
      )}
    >
      {initials(name)}
    </span>
  )
}
