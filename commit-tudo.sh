#!/bin/bash
# commit-tudo.sh
# Rode este script DENTRO da pasta "Nova pasta (4)" (a que tem as pastas
# mimos-da-alo-api e mimos-da-alo-web dentro), usando o Git Bash.
#
# Como rodar:
#   1. Abra o git-bash.exe
#   2. Navegue ate a pasta do projeto, ex:
#        cd "/c/Users/Aloisia/Documents/Downloads/Nova pasta (4)"
#   3. Rode:
#        bash commit-tudo.sh
#
# O script segue mesmo se algum "git add" nao encontrar um arquivo -- ao
# final, confira com "git log --oneline" e "git status" se ficou tudo certo.

set +e  # nao para o script se algum comando individual falhar

echo "==> Iniciando repositorio..."
git init

# ---------------------------------------------------------------
# .gitignore
# ---------------------------------------------------------------
cat > .gitignore << 'GITIGNORE'
# Dependências
node_modules/

# Builds
dist/
mimos-da-alo-api/public/*
!mimos-da-alo-api/public/.gitkeep

# Ambiente
.env
.env.local

# Prisma (gerado automaticamente por `prisma generate`)
mimos-da-alo-api/src/generated/

# Editor / SO
.vscode/
*.tsbuildinfo
.DS_Store
Thumbs.db
GITIGNORE

git add .gitignore
git commit -m "chore: configuracao inicial do .gitignore"

# ---------------------------------------------------------------
# Remote
# ---------------------------------------------------------------
echo "==> Conectando ao repositorio remoto..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/amaralmili/sistema.git

# ---------------------------------------------------------------
# BACKEND
# ---------------------------------------------------------------
echo "==> Commits do backend..."

git add mimos-da-alo-api/package.json mimos-da-alo-api/package-lock.json mimos-da-alo-api/tsconfig.json mimos-da-alo-api/eslint.config.js mimos-da-alo-api/.prettierrc mimos-da-alo-api/.gitignore mimos-da-alo-api/prisma.config.ts mimos-da-alo-api/README.md mimos-da-alo-api/.env.example
git commit -m "chore(api): estrutura inicial do projeto (Fastify + TypeScript + Prisma)"

git add mimos-da-alo-api/prisma
git commit -m "feat(api): modelagem do banco de dados, migrations e seed inicial"

git add mimos-da-alo-api/src/lib mimos-da-alo-api/src/errors mimos-da-alo-api/src/schemas
git commit -m "feat(api): configuracao base (Prisma client, Better Auth, schemas Zod, tratamento de erros)"

git add mimos-da-alo-api/src/usecases/CreateCustomer.ts mimos-da-alo-api/src/usecases/UpdateCustomer.ts mimos-da-alo-api/src/usecases/DeleteCustomer.ts mimos-da-alo-api/src/usecases/GetCustomer.ts mimos-da-alo-api/src/usecases/ListCustomers.ts mimos-da-alo-api/src/routes/customers.ts
git commit -m "feat(api): RF03 - cadastro e gestao de clientes"

git add mimos-da-alo-api/src/usecases/CreateProduct.ts mimos-da-alo-api/src/usecases/UpdateProduct.ts mimos-da-alo-api/src/usecases/DeactivateProduct.ts mimos-da-alo-api/src/usecases/GetProduct.ts mimos-da-alo-api/src/usecases/ListProducts.ts mimos-da-alo-api/src/routes/products.ts
git commit -m "feat(api): RF02 - cadastro e gestao de produtos"

git add mimos-da-alo-api/src/usecases/CreateSale.ts mimos-da-alo-api/src/usecases/GetSale.ts mimos-da-alo-api/src/usecases/ListSales.ts mimos-da-alo-api/src/routes/sales.ts
git commit -m "feat(api): RF05 - registro de vendas"

git add mimos-da-alo-api/src/usecases/ListPromissories.ts mimos-da-alo-api/src/usecases/PayInstallment.ts mimos-da-alo-api/src/routes/promissories.ts
git commit -m "feat(api): RF06 - promissorias e controle de parcelas"

git add mimos-da-alo-api/src/usecases/ListNotifications.ts mimos-da-alo-api/src/usecases/NotifyOverdueInstallments.ts mimos-da-alo-api/src/routes/notifications.ts
git commit -m "feat(api): RF04 - notificacao automatica de parcelas em atraso"

git add mimos-da-alo-api/src/usecases/GetCustomerPurchaseHistory.ts
git commit -m "feat(api): RF07 - historico de compras por cliente"

git add mimos-da-alo-api/src/index.ts
git commit -m "feat(api): configuracao do servidor, CORS, Swagger/Scalar e rotas"

# ---------------------------------------------------------------
# FRONTEND
# ---------------------------------------------------------------
echo "==> Commits do frontend..."

git add mimos-da-alo-web/package.json mimos-da-alo-web/package-lock.json mimos-da-alo-web/tsconfig.json mimos-da-alo-web/tsconfig.node.json mimos-da-alo-web/vite.config.ts mimos-da-alo-web/tailwind.config.js mimos-da-alo-web/postcss.config.js mimos-da-alo-web/index.html mimos-da-alo-web/.gitignore mimos-da-alo-web/.env.example mimos-da-alo-web/.env.production mimos-da-alo-web/README.md mimos-da-alo-web/src/main.tsx mimos-da-alo-web/src/index.css mimos-da-alo-web/src/vite-env.d.ts mimos-da-alo-web/src/App.tsx
git commit -m "chore(web): estrutura inicial do projeto (Vite + React + TypeScript + Tailwind)"

git add mimos-da-alo-web/src/lib mimos-da-alo-web/src/context
git commit -m "feat(web): cliente HTTP, autenticacao (Better Auth) e formatacao"

git add mimos-da-alo-web/src/components
git commit -m "feat(web): componentes de interface reutilizaveis (layout, modal, badges, etc)"

git add mimos-da-alo-web/src/pages/Login.tsx
git commit -m "feat(web): RF01 - tela de login e cadastro"

git add mimos-da-alo-web/src/pages/Dashboard.tsx
git commit -m "feat(web): painel com resumo geral da loja"

git add mimos-da-alo-web/src/pages/Customers.tsx mimos-da-alo-web/src/pages/CustomerDetail.tsx
git commit -m "feat(web): RF03/RF07 - gestao de clientes e historico de compras"

git add mimos-da-alo-web/src/pages/Products.tsx
git commit -m "feat(web): RF02 - gestao de produtos"

git add mimos-da-alo-web/src/pages/Sales.tsx mimos-da-alo-web/src/pages/NewSale.tsx mimos-da-alo-web/src/pages/SaleDetail.tsx
git commit -m "feat(web): RF05 - fluxo de nova venda e detalhe da venda"

git add mimos-da-alo-web/src/pages/Promissories.tsx
git commit -m "feat(web): RF06 - promissorias e baixa de parcelas"

git add mimos-da-alo-web/src/pages/Notifications.tsx
git commit -m "feat(web): RF04 - notificacoes de atraso"

# ---------------------------------------------------------------
# INTEGRACAO E RESTO
# ---------------------------------------------------------------
echo "==> Commit de integracao..."

git add mimos-da-alo-api/public/.gitkeep mimos-da-alo-web/scripts
git commit -m "feat: API passa a servir o build do frontend (fallback de SPA, servidor unico)"

echo "==> Pegando o que sobrou (json-examples, etc)..."
git add -A
git commit -m "docs: exemplos de payloads e arquivos remanescentes"

echo ""
echo "==> Pronto! Historico de commits:"
git log --oneline

echo ""
echo "==> Conferindo se sobrou algo fora dos commits:"
git status

echo ""
echo "Se estiver tudo certo acima, envie para o GitHub com:"
echo "  git branch                 (confira se e 'main' ou 'master')"
echo "  git push -u origin main    (ou 'master', conforme o nome acima)"
