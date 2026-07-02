# Mimos da Alô API

API para o sistema de gerenciamento da loja **Mimos da Alô** (cosméticos, joias, perfumes e acessórios).

## Stack

- **Fastify** — framework HTTP
- **TypeScript**
- **Prisma ORM** + **PostgreSQL**
- **Zod** + `fastify-type-provider-zod` — validação e tipagem das rotas
- **Better Auth** — autenticação (e-mail/senha)
- **Swagger + Scalar** — documentação interativa da API (`/docs`)
- Arquitetura em **use cases** (uma classe por ação de negócio) + **erros customizados** + **rotas separadas por entidade**.

## Dados de exemplo (seed)

Rodar `npm prisma:seed` cria automaticamente:

- Um usuário de login: **admin@mimosdaalo.com** / **senha123456**
- 5 produtos (perfume, batom, brinco, bolsa, kit de pincéis)
- 2 clientes
- 1 venda à vista (PIX)
- 1 venda parcelada em promissória (3 parcelas), com a **1ª parcela propositalmente vencida**, para você testar o fluxo de notificação de atraso chamando `POST /notifications/run-overdue-check`

Pode rodar o seed quantas vezes quiser — ele não duplica os registros.

## Mapeamento dos Requisitos Funcionais

| Requisito | Descrição | Onde foi implementado |
|---|---|---|
| **RF01** | Autenticação de usuários | `src/lib/auth.ts` (Better Auth) + rota `/api/auth/*` |
| **RF02** | Gerenciamento de produtos | `src/routes/products.ts` — CRUD de produtos (categoria: cosmético, joia, perfume, acessório), com controle de estoque |
| **RF03** | Gerenciamento de dados de clientes | `src/routes/customers.ts` — CRUD de clientes |
| **RF04** | Notificações de pagamentos em atraso | `src/usecases/NotifyOverdueInstallments.ts`, exposto em `POST /notifications/run-overdue-check`. Varre parcelas vencidas e não pagas, marca como `ATRASADA` e gera um registro de notificação por cliente |
| **RF05** | Gerenciamento de vendas | `src/routes/sales.ts` — registra venda, dá baixa automática no estoque e calcula o total, em uma transação |
| **RF06** | Gerenciamento de promissórias | `src/routes/promissories.ts` — quando a venda é no método `PROMISSORIA`, o sistema gera a promissória com as parcelas (datas de vencimento e valores); permite registrar pagamento de cada parcela |
| **RF07** | Histórico de compras por cliente | `GET /customers/:customerId/purchases` — lista todas as vendas do cliente e o total já gasto |

## Mapeamento dos Requisitos Não Funcionais

| Requisito | Como é endereçado |
|---|---|
| **RNF01** (interface simples e intuitiva) | A API expõe contratos claros e padronizados (mesma forma de erro em todas as rotas, paginação/filtros simples), prontos para consumo por um front-end enxuto. A documentação Scalar (`/docs`) já oferece uma interface de teste simples |
| **RNF02** (disponibilidade) | Uso do Fastify (alta performance/baixa sobrecarga) e arquitetura stateless, compatível com deploy redundante e health checks |
| **RNF03** (suportar crescimento sem perda de desempenho) | Banco relacional com índices (`@@unique`, `@@index`) e acesso via Prisma com queries otimizadas; estrutura em camadas (rota → use case → Prisma) facilita escalar horizontalmente |
| **RNF04** (integridade dos dados) | Uso de transações (`prisma.$transaction`) ao registrar vendas (baixa de estoque + criação de parcelas), validações com Zod em todas as entradas, e produtos são **inativados** em vez de excluídos para preservar o histórico de vendas |

## Principais entidades (Prisma)

- `User` / `Session` / `Account` / `Verification` — autenticação (Better Auth)
- `Customer` — clientes da loja
- `Product` — produtos (categoria, preço em centavos, estoque)
- `Sale` / `SaleItem` — vendas e seus itens
- `Promissory` / `Installment` — promissórias e parcelas
- `Notification` — log de notificações de atraso enviadas


## Estrutura de pastas

```
src/
  errors/        # classes de erro de negócio
  lib/            # prisma client, configuração do better-auth
  routes/         # rotas HTTP por entidade (customers, products, sales, promissories, notifications)
  schemas/        # schemas Zod (validação + docs)
  usecases/       # uma classe por ação de negócio
  index.ts        # bootstrap do Fastify
prisma/
  schema.prisma   # modelo de dados
```

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

```bash
npm install
npm run build:api
```

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