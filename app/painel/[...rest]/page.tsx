import { notFound } from 'next/navigation'

// Qualquer endereço desconhecido dentro de /painel mostra o "Não encontrado" do
// próprio painel (com a barra de navegação), não o 404 do site.
export default function PainelCatchAll() {
  notFound()
}
