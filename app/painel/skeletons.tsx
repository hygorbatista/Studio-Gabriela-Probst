import { cn } from 'cn'

// Blocos cinza no formato do conteúdo enquanto os dados chegam: a tela não "pula".

function Bone({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-muted motion-reduce:animate-none', className)} />
}

function Loading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-label="Carregando" className={className}>
      {children}
    </div>
  )
}

const rows = (count: number) => Array.from({ length: count }, (_, i) => i)

// Lista de itens (clientes, serviços, despesas).
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Loading className="border-t border-border">
      {rows(count).map((i) => (
        <div key={i} className="flex min-h-16 items-center gap-4 border-b border-border py-3">
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-2/5" />
            <Bone className="h-4 w-1/4" />
          </div>
          <Bone className="h-4 w-16" />
        </div>
      ))}
    </Loading>
  )
}

// Agenda: visões, botões, título do dia, faixa da semana e lista.
export function AgendaSkeleton() {
  return (
    <Loading>
      <Bone className="mb-4 h-12 w-full" />
      <div className="mb-6 grid grid-cols-2 gap-2">
        <Bone className="h-12" />
        <Bone className="h-12" />
      </div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <Bone className="size-11" />
        <Bone className="h-8 w-48" />
        <Bone className="size-11" />
      </div>
      <div className="mb-8 grid grid-cols-7 gap-1">
        {rows(7).map((i) => (
          <Bone key={i} className="h-18" />
        ))}
      </div>
      <Bone className="mb-4 h-8 w-40" />
      <div className="flex flex-col gap-2">
        {rows(3).map((i) => (
          <Bone key={i} className="h-24" />
        ))}
      </div>
    </Loading>
  )
}

// Formulário: rótulos e campos.
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <Loading className="space-y-5">
      {rows(fields).map((i) => (
        <div key={i} className="space-y-2">
          <Bone className="h-3 w-24" />
          <Bone className="h-12 w-full" />
        </div>
      ))}
      <Bone className="h-12 w-full" />
    </Loading>
  )
}

// Detalhe ou resumo: título e blocos.
export function DetailSkeleton() {
  return (
    <Loading className="space-y-6">
      <Bone className="h-10 w-3/5" />
      <Bone className="h-32 w-full" />
      <Bone className="h-32 w-full" />
    </Loading>
  )
}
