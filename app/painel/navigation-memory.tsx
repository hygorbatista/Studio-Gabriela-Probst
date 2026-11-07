'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const event = 'panel-navigation'
const storageKey = (path: string) => 'panel:last:' + path
function subscribe(update: () => void) {
  window.addEventListener(event, update)
  window.addEventListener('storage', update)
  return () => { window.removeEventListener(event, update); window.removeEventListener('storage', update) }
}
export function useRememberedLocation(fallback: string) {
  const base = fallback
  return useSyncExternalStore(subscribe, () => {
    if (base !== '/painel' && base !== '/painel/clientes') return fallback
    try {
      const saved = sessionStorage.getItem(storageKey(base))
      if (!saved) return fallback
      const url = new URL(saved, window.location.origin)
      return url.origin === window.location.origin && url.pathname === base ? url.pathname + url.search : fallback
    } catch { return fallback }
  }, () => fallback)
}
export function NavigationMemory() {
  const pathname = usePathname()
  const params = useSearchParams()
  useEffect(() => {
    if (pathname !== '/painel' && pathname !== '/painel/clientes') return
    const query = new URLSearchParams(params.toString())
    query.delete('ok')
    try {
      sessionStorage.setItem(storageKey(pathname), pathname + (query.size ? '?' + query : ''))
      window.dispatchEvent(new Event(event))
    } catch { /* Navigation remains available when storage is disabled. */ }
  }, [pathname, params])
  return null
}
