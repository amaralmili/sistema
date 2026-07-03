import { fromNodeHeaders } from 'better-auth/node'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { DuplicateDocumentError, NotFoundError } from '../errors/index.js'
import { auth } from '../lib/auth.js'
import {
  CreateCustomerBodySchema,
  CustomerSchema,
  CustomerPurchaseHistorySchema,
  ErrorSchema,
  ListCustomersQuerySchema,
  ListCustomersSchema,
  UpdateCustomerBodySchema,
} from '../schemas/index.js'
import { CreateCustomer } from '../usecases/CreateCustomer.js'
import { DeleteCustomer } from '../usecases/DeleteCustomer.js'
import { GetCustomer } from '../usecases/GetCustomer.js'
import { GetCustomerPurchaseHistory } from '../usecases/GetCustomerPurchaseHistory.js'
import { ListCustomers } from '../usecases/ListCustomers.js'
import { UpdateCustomer } from '../usecases/UpdateCustomer.js'

export const customerRoutes = (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/',
    schema: {
      tags: ['Clientes'],
      summary: 'Listar clientes',
      querystring: ListCustomersQuerySchema,
      response: { 200: ListCustomersSchema, 401: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
        }

        const result = await new ListCustomers().execute({
          search: request.query.search,
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
      tags: ['Clientes'],
      summary: 'Cadastrar cliente',
      body: CreateCustomerBodySchema,
      response: {
        201: CustomerSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        409: ErrorSchema,
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

        const result = await new CreateCustomer().execute(request.body)
        return reply.status(201).send(result)
      } catch (error) {
        app.log.error(error)
        if (error instanceof DuplicateDocumentError) {
          return reply
            .status(409)
            .send({ error: error.message, code: 'DUPLICATE_DOCUMENT_ERROR' })
        }
        return reply
          .status(500)
          .send({ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' })
      }
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/:customerId',
    schema: {
      tags: ['Clientes'],
      summary: 'Buscar cliente por id',
      params: z.object({ customerId: z.string().min(1) }),
      response: { 200: CustomerSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
        }

        const result = await new GetCustomer().execute({
          customerId: request.params.customerId,
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
    url: '/:customerId',
    schema: {
      tags: ['Clientes'],
      summary: 'Atualizar cliente',
      params: z.object({ customerId: z.string().min(1) }),
      body: UpdateCustomerBodySchema,
      response: {
        200: CustomerSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        409: ErrorSchema,
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

        const result = await new UpdateCustomer().execute({
          customerId: request.params.customerId,
          ...request.body,
        })
        return reply.status(200).send(result)
      } catch (error) {
        app.log.error(error)
        if (error instanceof NotFoundError) {
          return reply.status(404).send({ error: error.message, code: 'NOT_FOUND_ERROR' })
        }
        if (error instanceof DuplicateDocumentError) {
          return reply
            .status(409)
            .send({ error: error.message, code: 'DUPLICATE_DOCUMENT_ERROR' })
        }
        return reply
          .status(500)
          .send({ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' })
      }
    },
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/:customerId',
    schema: {
      tags: ['Clientes'],
      summary: 'Remover cliente',
      params: z.object({ customerId: z.string().min(1) }),
      response: { 204: z.null(), 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
        }

        await new DeleteCustomer().execute({ customerId: request.params.customerId })
        return reply.status(204).send()
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

  // RF07 - histórico de compras do cliente
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/:customerId/purchases',
    schema: {
      tags: ['Clientes'],
      summary: 'Histórico de compras do cliente',
      params: z.object({ customerId: z.string().min(1) }),
      response: {
        200: CustomerPurchaseHistorySchema,
        401: ErrorSchema,
        404: ErrorSchema,
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

        const result = await new GetCustomerPurchaseHistory().execute({
          customerId: request.params.customerId,
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
