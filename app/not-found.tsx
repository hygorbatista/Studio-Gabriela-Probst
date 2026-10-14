import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { site } from '@/lib/site'

export const metadata = { title: 'Página não encontrada' }

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Erro 404</p>
      <h1 className="font-serif text-4xl md:text-5xl">Página não encontrada</h1>
      <p className="max-w-md text-base text-muted-foreground">
        O endereço pode ter mudado. Volte para o início para ver os serviços e agendar com a{' '}
        {site.name.split(' ')[0]}.
      </p>
      <Link href="/" className={buttonVariants()}>
        Ir para o início
      </Link>
    </main>
  )
}
