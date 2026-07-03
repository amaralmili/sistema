import { fromNodeHeaders } from 'better-auth/node'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { NotFoundError } from '../errors/index.js'
import { auth } from '../lib/auth.js'
import {
  CreateProductBodySchema,
  ErrorSchema,
  ListProductsQuerySchema,
  ListProductsSchema,
  ProductSchema,
  UpdateProductBodySchema,
} from '../schemas/index.js'
import { CreateProduct } from '../usecases/CreateProduct.js'
import { DeactivateProduct } from '../usecases/DeactivateProduct.js'
import { GetProduct } from '../usecases/GetProduct.js'
import { ListProducts } from '../usecases/ListProducts.js'
import { UpdateProduct } from '../usecases/UpdateProduct.js'

export const productRoutes = (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/',
    schema: {
      tags: ['Produtos'],
      summary: 'Listar produtos',
      querystring: ListProductsQuerySchema,
      response: { 200: ListProductsSchema, 401: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
        }

        const result = await new ListProducts().execute(request.query)
        return reply.status(200).send(result)
      } catch (error) {
        app.log.error(error)
        return reply
          .status(500)
          .send({ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' })
      }
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/',
    schema: {
      tags: ['Produtos'],
      summary: 'Cadastrar produto',
      body: CreateProductBodySchema,
      response: { 201: ProductSchema, 401: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
        }

        const result = await new CreateProduct().execute(request.body)
        return reply.status(201).send(result)
      } catch (error) {
        app.log.error(error)
        return reply
          .status(500)
          .send({ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' })
      }
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/:productId',
    schema: {
      tags: ['Produtos'],
      summary: 'Buscar produto por id',
      params: z.object({ productId: z.string().min(1) }),
      response: { 200: ProductSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
        }

        const result = await new GetProduct().execute({
          productId: request.params.productId,
        })
        return reply.status(200).send(result)
      } catch (error) {
        app.log.error(error)
        if (error instanceof NotFoundError) {
          return reply.status(404).send({ error: error.message, code: 'NOT_FOUND_ERROR' })
        }
        return reply
          .status(500)
          .send({ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' })
      }
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/:productId',
    schema: {
      tags: ['Produtos'],
      summary: 'Atualizar produto',
      params: z.object({ productId: z.string().min(1) }),
      body: UpdateProductBodySchema,
      response: { 200: ProductSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
        }

        const result = await new UpdateProduct().execute({
          productId: request.params.productId,
          ...request.body,
        })
        return reply.status(200).send(result)
      } catch (error) {
        app.log.error(error)
        if (error instanceof NotFoundError) {
          return reply.status(404).send({ error: error.message, code: 'NOT_FOUND_ERROR' })
        }
        return reply
          .status(500)
          .send({ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' })
      }
    },
  })

  // Inativa o produto em vez de excluir, preservando a integridade do
  // histórico de vendas já realizadas (RNF04).
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/:productId',
    schema: {
      tags: ['Produtos'],
      summary: 'Inativar produto',
      params: z.object({ productId: z.string().min(1) }),
      response: { 200: ProductSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
        }

        const result = await new DeactivateProduct().execute({
          productId: request.params.productId,
        })
        return reply.status(200).send(result)
      } catch (error) {
        app.log.error(error)
        if (error instanceof NotFoundError) {
          return reply.status(404).send({ error: error.message, code: 'NOT_FOUND_ERROR' })
        }
        return reply
          .status(500)
          .send({ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' })
      }
    },
  })
}
