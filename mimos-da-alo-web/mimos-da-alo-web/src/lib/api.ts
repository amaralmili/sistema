export const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:8080'

export class ApiError extends Error {
  code: string
  status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

// Mensagens em pt-BR para os códigos de erro que a API pode devolver,
// para não expor a mensagem "crua" do backend na interface.
const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Sua sessão expirou. Entre novamente.',
  NOT_FOUND_ERROR: 'Registro não encontrado.',
  DUPLICATE_DOCUMENT_ERROR: 'Já existe um cliente cadastrado com esse CPF/documento.',
  INSUFFICIENT_STOCK_ERROR: 'Estoque insuficiente para concluir a venda.',
  INVALID_INSTALLMENT_PLAN_ERROR: 'O plano de parcelamento informado é inválido.',
  INSTALLMENT_ALREADY_PAID_ERROR: 'Essa parcela já está paga.',
  INTERNAL_SERVER_ERROR: 'Erro interno no servidor. Tente novamente em instantes.',
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
}

function buildQuery(query?: RequestOptions['query']) {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '' || value === false) continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query } = options

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}${buildQuery(query)}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(
      API_URL
        ? `Não foi possível conectar à API em ${API_URL}. Confira se ela está rodando.`
        : 'Não foi possível conectar à API. Confira se o servidor está rodando.',
      'NETWORK_ERROR',
      0,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json().catch(() => null) : null

  if (!response.ok) {
    const code = data?.code ?? 'UNKNOWN_ERROR'
    const message = ERROR_MESSAGES[code] ?? data?.error ?? data?.message ?? 'Ocorreu um erro inesperado.'
    throw new ApiError(message, code, response.status)
  }

  return data as T
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query']) => request<T>(path, { method: 'GET', query }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
