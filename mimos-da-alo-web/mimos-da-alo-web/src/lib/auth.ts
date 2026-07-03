import { API_URL } from './api.ts'
import type { AuthUser } from './types.ts'

async function authFetch(path: string, body?: unknown) {
  const response = await fetch(`${API_URL}/api/auth${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message = data?.message ?? data?.error?.message ?? 'Não foi possível autenticar.'
    throw new Error(translateAuthMessage(message))
  }

  return data
}

// Better Auth devolve mensagens em inglês; traduzimos as mais comuns.
function translateAuthMessage(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('invalid email or password') || normalized.includes('invalid password')) {
    return 'E-mail ou senha inválidos.'
  }
  if (normalized.includes('user already exists') || normalized.includes('already exists')) {
    return 'Já existe uma conta com esse e-mail.'
  }
  if (normalized.includes('password') && normalized.includes('short')) {
    return 'A senha precisa ter pelo menos 8 caracteres.'
  }
  return message
}

export async function signIn(email: string, password: string) {
  return authFetch('/sign-in/email', { email, password })
}

export async function signUp(name: string, email: string, password: string) {
  return authFetch('/sign-up/email', { name, email, password })
}

export async function signOut() {
  return authFetch('/sign-out')
}

export async function getSession(): Promise<{ user: AuthUser } | null> {
  const response = await fetch(`${API_URL}/api/auth/get-session`, {
    credentials: 'include',
  })
  if (!response.ok) return null
  const data = await response.json().catch(() => null)
  if (!data?.user) return null
  return { user: data.user }
}
