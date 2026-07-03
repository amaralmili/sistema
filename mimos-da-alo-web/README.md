# Mimos da Alô — Web

Frontend do sistema de gerenciamento da loja **Mimos da Alô** (cosméticos, joias,
perfumes e acessórios), construído para consumir a `mimos-da-alo-api`.

## Stack

- **React 18** + **TypeScript**
- **Vite**
- **React Router**
- **Tailwind CSS**
- **lucide-react** — ícones
- Autenticação via cookie de sessão do **Better Auth**, consumindo direto
  `/api/auth/*` da API

## Como rodar

Há dois jeitos de rodar este frontend:

### 1. Desenvolvimento (dois servidores, com hot-reload)

A API roda em `http://localhost:8080` e o frontend em `http://localhost:3000`
(CORS e cookies já configurados na API para isso).

```bash
npm install
cp .env.example .env   # ajuste VITE_API_URL se a API não estiver em localhost:8080
npm run dev
```

### 2. Produção / servidor único (a API serve o frontend buildado)

Gera o build e copia para dentro de `mimos-da-alo-api/public`, para que a
própria API sirva tudo em `http://localhost:8080` — sem CORS, sem porta
separada. Veja também o README da API.

Assumindo que as duas pastas são vizinhas (`mimos-da-alo-api/` e
`mimos-da-alo-web/` lado a lado):

```bash
npm install
npm run build:api
```

Isso roda `vite build` (usando `.env.production`, que deixa a URL da API
relativa/mesma origem) e depois copia `dist/` para `../mimos-da-alo-api/public`.
Se as pastas não forem vizinhas, informe o caminho:

```bash
npm run build && node scripts/copy-to-api.mjs ../caminho/para/mimos-da-alo-api
```

Depois é só rodar a API normalmente (`npm run dev` ou `npm start` nela) e
acessar `http://localhost:8080` — o front e a API sobem juntos.

### Primeiro acesso

Se ainda não existe usuário, use a aba **"Criar conta"** na tela de login
(equivalente ao `POST /api/auth/sign-up/email`). Se você já rodou o seed da
API, entre com:

- **admin@mimosdaalo.com** / **senha123456**

## Estrutura

```
src/
  lib/          # cliente HTTP da API, autenticação, formatação, tipos
  context/       # AuthContext (sessão) e ToastContext (feedback)
  components/    # componentes de UI reutilizáveis
  pages/         # telas: Login, Dashboard, Clientes, Produtos, Vendas,
                 # Promissórias, Notificações
```

## Telas

| Tela | Rota | O que faz |
|---|---|---|
| Login / Cadastro | `/login` | Entrar ou criar o primeiro usuário (RF01) |
| Dashboard | `/dashboard` | Visão geral: clientes, produtos, vendas do mês, parcelas em atraso |
| Clientes | `/clientes` | CRUD de clientes (RF03) + acesso ao histórico de compras (RF07) |
| Histórico do cliente | `/clientes/:id` | Compras e total gasto pelo cliente |
| Produtos | `/produtos` | CRUD de produtos, filtro por categoria/estoque (RF02) |
| Vendas | `/vendas` | Lista de vendas, filtro por cliente (RF05) |
| Nova venda | `/vendas/nova` | Monta o carrinho, escolhe forma de pagamento e gera promissória se parcelado (RF05 + RF06) |
| Detalhe da venda | `/vendas/:id` | Itens da venda e link para a promissória gerada |
| Promissórias | `/promissorias` | Parcelas por cliente, baixa de pagamento (RF06) |
| Notificações | `/notificacoes` | Roda a verificação de atraso e lista notificações já enviadas (RF04) |
