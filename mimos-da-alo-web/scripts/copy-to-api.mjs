// Copia o build (dist/) para dentro da pasta public/ da mimos-da-alo-api,
// para que a API sirva o frontend na mesma porta (ver README).
//
// Uso:
//   node scripts/copy-to-api.mjs [caminho-da-api]
//
// Por padrão assume que as duas pastas são vizinhas:
//   alguma-pasta/
//     mimos-da-alo-api/
//     mimos-da-alo-web/   <- você está aqui

import { existsSync, cpSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

const apiPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(projectRoot, '..', 'mimos-da-alo-api')
const distDir = path.join(projectRoot, 'dist')
const publicDir = path.join(apiPath, 'public')

if (!existsSync(distDir)) {
  console.error('✘ Pasta dist/ não encontrada. Rode "npm run build" antes de copiar.')
  process.exit(1)
}

if (!existsSync(apiPath)) {
  console.error(`✘ Não encontrei a pasta da API em "${apiPath}".`)
  console.error('  Passe o caminho manualmente: node scripts/copy-to-api.mjs ../caminho/para/mimos-da-alo-api')
  process.exit(1)
}

rmSync(publicDir, { recursive: true, force: true })
cpSync(distDir, publicDir, { recursive: true })

console.log(`✔ Build copiado para ${publicDir}`)
console.log('  Agora rode "npm run dev" (ou "npm start") na API e acesse http://localhost:8080')
