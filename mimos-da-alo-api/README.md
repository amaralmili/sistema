# Mimos da Alô API

API para o sistema de gerenciamento da loja **Mimos da Alô** (cosméticos, joias, perfumes e acessórios).

Projeto construído seguindo a mesma stack e arquitetura usada em sala de aula no projeto de referência `meus-treinos-api`.

## Stack

- **Fastify** — framework HTTP
- **TypeScript**
- **Prisma ORM** + **PostgreSQL**
- **Zod** + `fastify-type-provider-zod` — validação e tipagem das rotas
- **Better Auth** — autenticação (e-mail/senha)
- **Swagger + Scalar** — documentação interativa da API (`/docs`)
- Arquitetura em **use cases** (uma classe por ação de negócio) + **erros customizados** + **rotas separadas por entidade**, mantendo o mesmo padrão do projeto de referência.

## Como rodar

```bash
pnpm install
cp .env.example .env   # ajuste DATABASE_URL e BETTER_AUTH_SECRET
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed        # opcional: popula o banco com dados de exemplo
pnpm dev
```

Se estiver usando `npm` em vez de `pnpm`, troque `pnpm` por `npm run` nos comandos acima (ex: `npm run prisma:migrate`).

A documentação interativa fica disponível em `http://localhost:8080/docs`.

## Servindo o frontend junto (servidor único)

A API consegue servir o build do **mimos-da-alo-web** direto, numa porta só —
sem CORS, sem servidor separado.

1. No projeto do frontend, rode `npm run build:api` (builda e copia o
   resultado para a pasta `public/` desta API — veja o README do frontend
   para detalhes).
2. Suba a API normalmente (`pnpm dev` ou `pnpm build && node dist/index.js`).
3. Acesse `http://localhost:8080` — a API detecta o build em `public/` e
   passa a servir o app nessa mesma porta, com fallback de rota para o
   React Router (`/clientes`, `/vendas/nova` etc. continuam funcionando ao
   dar F5).

Sem o build em `public/`, a API funciona exatamente como antes (só a API,
`GET /` devolve a mensagem de boas-vindas em JSON).

## Dados de exemplo (seed)

Rodar `pnpm prisma:seed` (ou `npm run prisma:seed`) cria automaticamente:

- Um usuário de login: **admin@mimosdaalo.com** / **senha123456**
- 5 produtos (perfume, batom, brinco, bolsa, kit de pincéis)
- 2 clientes
- 1 venda à vista (PIX)
- 1 venda parcelada em promissória (3 parcelas), com a **1ª parcela propositalmente vencida**, para você testar o fluxo de notificação de atraso chamando `POST /notifications/run-overdue-check`

Pode rodar o seed quantas vezes quiser — ele não duplica os registros.

## Exemplos prontos para testar (`json-examples/`)

A pasta `json-examples/` tem um JSON de exemplo para cada fluxo principal da API, prontos para colar direto no corpo da requisição no Scalar (`/docs`):

1. `01-sign-up.json` — criar usuário/login (RF01)
2. `02-sign-in.json` — login com usuário existente
3. `03-customer.json` — cadastrar cliente (RF03)
4. `04-product.json` — cadastrar produto (RF02)
5. `05-sale-a-vista.json` — venda à vista (RF05)
6. `06-sale-promissoria.json` — venda parcelada, gera as parcelas (RF05 + RF06)
7. `07-pay-installment.json` — dar baixa em uma parcela (RF06)

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

## Exemplo de fluxo: venda parcelada (RF05 + RF06)

1. `POST /customers` — cadastra o cliente
2. `POST /products` — cadastra os produtos
3. `POST /sales` com `paymentMethod: "PROMISSORIA"` e um `installmentPlan` — registra a venda, baixa o estoque e gera a promissória com as parcelas
4. `GET /promissories?customerId=...` — consulta as parcelas geradas
5. `PATCH /promissories/installments/:id/pay` — dá baixa no pagamento de uma parcela
6. `POST /notifications/run-overdue-check` — (rodaria via cron em produção) identifica parcelas vencidas não pagas e gera notificações
7. `GET /customers/:id/purchases` — consulta o histórico de compras do cliente
