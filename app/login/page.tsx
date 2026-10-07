import { LoginForm } from './login-form'

export const metadata = {
  title: 'Entrar',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[#FAFAFA] px-5 py-12 text-[#0B0B0C]">
      <div className="w-full max-w-sm border border-[#EAEAEA] bg-white p-8">
        <h1 className="mb-8 text-3xl">Gabriela Probst</h1>
        <LoginForm />
      </div>
    </main>
  )
}
