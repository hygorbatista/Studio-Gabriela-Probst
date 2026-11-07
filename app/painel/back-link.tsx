'use client'

import { useRememberedLocation } from './navigation-memory'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NavigationPending } from './navigation-pending'

export function BackLink({ href, label }: { href: string; label: string }) {
  const destination = useRememberedLocation(href)
  return (
    <Link
      href={destination}
      className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {label}
      <NavigationPending />
    </Link>
  )
}
