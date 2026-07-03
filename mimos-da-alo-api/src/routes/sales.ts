import { fromNodeHeaders } from 'better-auth/node'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import {
  InsufficientStockError,
  InvalidInstallmentPlanError,
  NotFoundError,
} from '../errors/index.js'
import { auth } from '../lib/auth.js'
import {
  CreateSaleBodySchema,
  ErrorSchema,
  ListSalesQuerySchema,
  ListSalesSchema,
  SaleSchema,
} from '../schemas/index.js'
import { CreateSale } from '../usecases/CreateSale.js'
import { GetSale } from '../usecases/GetSale.js'
import { ListSales } from '../usecases/ListSales.js'

export const saleRoutes = (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/',
    schema: {
      tags: ['Vendas'],
      summary: 'Listar vendas',
      querystring: ListSalesQuerySchema,
      response: { 200: ListSalesSchema, 401: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
        }

        const result = await new ListSales().execute({
          customerId: request.query.customerId,
        })
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
      tags: ['Vendas'],
      summary: 'Registrar venda (gera promissória/parcelas se aplicável)',
      body: CreateSaleBodySchema,
      response: {
        201: SaleSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        409: ErrorSchema,
        422: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
        }

        const result = await new CreateSale().execute({
          ...request.body,
          sellerId: session.user.id,
        })
        return reply.status(201).send(result)
      } catch (error) {
        app.log.error(error)
        if (error instanceof NotFoundError) {
          return reply.status(404).send({ error: error.message, code: 'NOT_FOUND_ERROR' })
        }
        if (error instanceof InsufficientStockError) {
          return reply
            .status(409)
            .send({ error: error.message, code: 'INSUFFICIENT_STOCK_ERROR' })
        }
        if (error instanceof InvalidInstallmentPlanError) {
          return reply
            .status(422)
            .send({ error: error.message, code: 'INVALID_INSTALLMENT_PLAN_ERROR' })
        }
        return reply
          .status(500)
          .send({ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' })
      }
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/:saleId',
    schema: {
      tags: ['Vendas'],
      summary: 'Buscar venda por id',
      params: z.object({ saleId: z.string().min(1) }),
      response: { 200: SaleSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
        }

        const result = await new GetSale().execute({ saleId: request.params.saleId })
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
