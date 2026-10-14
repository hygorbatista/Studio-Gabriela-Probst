import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

// Link antigo ou de algo que foi excluído.
export default function PainelNotFound() {
  return (
    <div className="flex flex-col gap-6 pt-6">
      <h1 className="font-serif text-4xl">Não encontrado</h1>
      <p className="text-base text-muted-foreground">
        Isso não existe mais ou foi excluído. Volte para a agenda e continue de lá.
      </p>
      <Link href="/painel" className={buttonVariants({ className: 'w-full' })}>
        Voltar para a agenda
      </Link>
    </div>
  )
}
