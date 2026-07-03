import 'dotenv/config'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import fastifyCors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import fastifySwagger from '@fastify/swagger'
import ScalarApiReference from '@scalar/fastify-api-reference'
import { fromNodeHeaders } from 'better-auth/node'
import Fastify from 'fastify'
import fs from 'node:fs'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from './lib/auth.js'
import { customerRoutes } from './routes/customers.js'
import { notificationRoutes } from './routes/notifications.js'
import { productRoutes } from './routes/products.js'
import { promissoryRoutes } from './routes/promissories.js'
import { saleRoutes } from './routes/sales.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Pasta onde fica o build do frontend (mimos-da-alo-web/dist copiado para cá).
// Veja o README para o passo a passo de build + cópia.
const WEB_DIST_DIR = path.join(__dirname, '..', 'public')
const WEB_INDEX_HTML = path.join(WEB_DIST_DIR, 'index.html')
const isWebBuildAvailable = fs.existsSync(WEB_INDEX_HTML)

const app = Fastify({
  logger: true,
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

await app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Mimos da Alô API',
      description:
        'API para gerenciamento da loja Mimos da Alô (cosméticos, joias, perfumes e acessórios)',
      version: '1.0.0',
    },
    servers: [
      {
        description: 'Local development server',
        url: 'http://localhost:8080',
      },
    ],
  },
  transform: jsonSchemaTransform,
})

await app.register(ScalarApiReference, {
  routePrefix: '/docs',
  configuration: {
    theme: 'elysiajs',
    sources: [
      {
        title: 'Mimos da Alô API',
        slug: 'mimos-da-alo-api',
        url: '/swagger.json',
      },
      {
        title: 'Auth API',
        slug: 'auth-api',
        url: '/api/auth/open-api/generate-schema',
      },
    ],
  },
})

await app.register(fastifyCors, {
  origin: ['http://localhost:3000'],
  credentials: true,
})

// Serve o build do frontend (mimos-da-alo-web) quando presente em /public.
// Sem isso, a API funciona normalmente sozinha (ex: durante o desenvolvimento
// com `npm run dev` no frontend, apontando VITE_API_URL para esta API).
if (isWebBuildAvailable) {
  await app.register(fastifyStatic, {
    root: WEB_DIST_DIR,
    prefix: '/',
  })
}

// RESTful
// Routes
await app.register(customerRoutes, { prefix: '/customers' }) // RF03 / RF07
await app.register(productRoutes, { prefix: '/products' }) // RF02
await app.register(saleRoutes, { prefix: '/sales' }) // RF05
await app.register(promissoryRoutes, { prefix: '/promissories' }) // RF06
await app.register(notificationRoutes, { prefix: '/notifications' }) // RF04

app.withTypeProvider<ZodTypeProvider>().route({
  method: 'GET',
  url: '/swagger.json',
  schema: {
    hide: true,
  },
  handler: async () => {
    return app.swagger()
  },
})

// Quando não há build do frontend disponível, a raiz responde com uma
// mensagem simples (é o que a API já fazia antes de servir o front).
if (!isWebBuildAvailable) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/',
    schema: {
      description: 'Hello World',
      tags: ['Bem-vindo'],
      response: {
        200: z.object({
          message: z.string(),
        }),
      },
    },
    handler: () => {
      return {
        message:
          'Mimos da Alô API - sistema para a loja. Build do frontend não encontrado em /public — veja o README.',
      }
    },
  })
}

// RF01 - autenticação (Better Auth)
app.route({
  method: ['GET', 'POST'],
  url: '/api/auth/*',
  async handler(request, reply) {
    try {
      // Construct request URL
      const url = new URL(request.url, `http://${request.headers.host}`)

      // Convert Fastify headers to standard Headers object
      const headers = fromNodeHeaders(request.headers)
      // Create Fetch API-compatible request
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      })
      // Process authentication request
      const response = await auth.handler(req)
      // Forward response to client
      reply.status(response.status)
      response.headers.forEach((value, key) => reply.header(key, value))
      reply.send(response.body ? await response.text() : null)
    } catch (error) {
      app.log.error(error)
      reply.status(500).send({
        error: 'Internal authentication error',
        code: 'AUTH_FAILURE',
      })
    }
  },
})

// Fallback de SPA: qualquer GET que não bateu em nenhuma rota da API nem em
// um arquivo estático real (ex: /clientes, /vendas/nova, /promissorias) cai
// aqui. Se o build do frontend existir, devolve o index.html e deixa o
// React Router decidir o que mostrar; senão, responde 404 normalmente.
app.setNotFoundHandler((request, reply) => {
  const isBrowserNavigation =
    request.method === 'GET' && !request.raw.url?.startsWith('/api') && !path.extname(request.raw.url ?? '')

  if (isWebBuildAvailable && isBrowserNavigation) {
    return reply.type('text/html').send(fs.createReadStream(WEB_INDEX_HTML))
  }

  return reply.status(404).send({ error: 'Rota não encontrada', code: 'NOT_FOUND' })
})

try {
  await app.listen({ port: Number(process.env.PORT) })
  console.log(`Server is running on port ${process.env.PORT}`)
  console.log(`Server is running on http://localhost:${process.env.PORT}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
