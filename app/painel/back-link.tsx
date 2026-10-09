import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-6 inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {label}
    </Link>
  )
}
