'use client'

import { LoaderCircle } from 'lucide-react'
import { useLinkStatus } from 'next/link'

export function NavigationPending({ className }: { className?: string }) {
  const { pending } = useLinkStatus()

  return (
    <span className={className}>
      <LoaderCircle
        className={`size-3.5 motion-reduce:animate-none ${pending ? 'animate-spin' : 'invisible'}`}
        aria-hidden="true"
      />
      <span role="status" className="sr-only">{pending ? 'Carregando...' : ''}</span>
    </span>
  )
}
