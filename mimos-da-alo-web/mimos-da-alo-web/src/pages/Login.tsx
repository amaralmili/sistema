import { Loader2, Lock, Mail, User } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext.tsx'

export function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      if (mode === 'signin') {
        await login(email, password)
      } else {
        await register(name, email, password)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível continuar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Painel de marca */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-wine-dark px-14 py-12 text-cream lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, #E4C48A 0, transparent 45%), radial-gradient(circle at 85% 75%, #C79A54 0, transparent 40%)',
          }}
        />
        <div className="relative z-10 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-wine-dark font-display text-lg font-semibold">
            M
          </span>
          <span className="font-display text-lg italic text-cream/90">Mimos da Alô</span>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="mb-4 font-display text-sm uppercase tracking-[0.2em] text-gold-light">
            Sistema da loja
          </p>
          <h1 className="font-display text-4xl font-medium leading-[1.15] text-cream">
            Cosméticos, joias, perfumes e acessórios — organizados do jeito que sua loja merece.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-cream/70">
            Cadastre clientes e produtos, registre vendas à vista ou em promissória, acompanhe
            parcelas e nunca perca um pagamento em atraso.
          </p>
        </div>

        {/* Fitas de status — o mesmo elemento de assinatura visto no app, aqui só como composição */}
        <div className="relative z-10 flex flex-wrap gap-2">
          {['Clientes', 'Produtos', 'Vendas', 'Promissórias'].map((label) => (
            <span
              key={label}
              className="ribbon border border-cream/25 bg-cream/10 text-cream/90"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <p className="font-display text-xl italic text-wine-dark">Mimos da Alô</p>
          </div>

          <div className="mb-7">
            <h2 className="font-display text-2xl font-medium text-wine-dark">
              {mode === 'signin' ? 'Bem-vinda de volta' : 'Criar sua conta'}
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              {mode === 'signin'
                ? 'Entre com seu e-mail e senha para acessar o painel.'
                : 'Leva menos de um minuto — depois é só entrar.'}
            </p>
          </div>

          <div className="mb-6 inline-flex rounded-lg border border-sand bg-surface p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`rounded-md px-4 py-1.5 font-medium transition ${
                mode === 'signin' ? 'bg-wine text-cream' : 'text-muted hover:text-ink'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`rounded-md px-4 py-1.5 font-medium transition ${
                mode === 'signup' ? 'bg-wine text-cream' : 'text-muted hover:text-ink'
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="field-label" htmlFor="name">
                  Nome
                </label>
                <div className="relative">
                  <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    id="name"
                    className="input-field pl-9"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="field-label" htmlFor="email">
                E-mail
              </label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="email"
                  type="email"
                  className="input-field pl-9"
                  placeholder="voce@mimosdaalo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="password"
                  type="password"
                  className="input-field pl-9"
                  placeholder="Mínimo de 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-rust/30 bg-rust-light px-3.5 py-2.5 text-sm text-rust">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-2.5" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Aguarde…
                </>
              ) : mode === 'signin' ? (
                'Entrar'
              ) : (
                'Criar conta'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
