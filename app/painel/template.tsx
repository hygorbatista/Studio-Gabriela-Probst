// Entrada suave ao trocar de seção do painel (Agenda, Clientes...). O template
// remonta quando a seção muda; trocar o dia ou a busca não repete a animação.
// Desligada para quem ativa "reduzir movimento" no celular.
export default function PainelTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
      {children}
    </div>
  )
}
