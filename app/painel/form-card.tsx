import { cn } from 'cn'
import { card } from './styles'

// Bloco branco que agrupa campos de um formulário. O botão de salvar fica fora,
// logo abaixo, para ser sempre o mesmo lugar.
export function FormCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn(card, 'flex flex-col gap-5', className)}>{children}</div>
}
