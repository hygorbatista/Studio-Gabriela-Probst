import { Suspense } from 'react'
import Link from 'next/link'
import { LoginForm } from './login-form'

export const metadata = {
  title: 'Entrar',
  robots: { index: false, follow: false },
  // O login abre dentro do app instalado, então aponta para o mesmo manifesto.
  manifest: '/painel.webmanifest',
  appleWebApp: { capable: true, title: 'Gabriela', statusBarStyle: 'default' },
}

async function LoginWithReturn({ searchParams }: Pick<PageProps<'/login'>, 'searchParams'>) {
  const { voltar } = await searchParams
  return <LoginForm returnTo={typeof voltar === 'string' ? voltar : undefined} />
}

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    // Fundo preto do topo do site; o cartão do formulário continua branco.
    <main className="painel-theme flex flex-1 flex-col items-center justify-center bg-foreground px-5 py-12 text-foreground">
      <div className="w-full max-w-sm bg-surface p-8 shadow-card">
        <span
          aria-hidden="true"
          className="grid size-12 place-items-center bg-foreground font-serif text-3xl leading-none text-white"
        >
          G
        </span>
        <h1 className="mt-6 font-serif text-4xl">Gabriela Probst</h1>
        <p className="mt-1 mb-8 text-base text-muted-foreground">Painel do studio</p>
        {/* Sem esperar o endereço: o formulário já aparece pronto para usar. */}
        <Suspense fallback={<LoginForm />}>
          <LoginWithReturn searchParams={searchParams} />
        </Suspense>
      </div>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center text-base text-white/70 underline underline-offset-4 hover:text-white"
      >
        Voltar para o site
      </Link>
    </main>
  )
}
