import Link from 'next/link'
import { LoginForm } from './login-form'

export const metadata = {
  title: 'Entrar',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-background px-5 py-12 text-foreground">
      <div className="w-full max-w-sm border border-border bg-surface p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Painel</p>
        <h1 className="mt-2 mb-8 font-serif text-4xl">Gabriela Probst</h1>
        <LoginForm />
      </div>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center text-base text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Voltar para o site
      </Link>
    </main>
  )
}
