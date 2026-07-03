import { fromNodeHeaders } from 'better-auth/node'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { InstallmentAlreadyPaidError, NotFoundError } from '../errors/index.js'
import { auth } from '../lib/auth.js'
import {
  ErrorSchema,
  InstallmentSchema,
  ListPromissoriesQuerySchema,
  ListPromissoriesSchema,
  PayInstallmentBodySchema,
} from '../schemas/index.js'
import { ListPromissories } from '../usecases/ListPromissories.js'
import { PayInstallment } from '../usecases/PayInstallment.js'

export const promissoryRoutes = (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/',
    schema: {
      tags: ['Promissórias'],
      summary: 'Listar promissórias e suas parcelas',
      querystring: ListPromissoriesQuerySchema,
      response: { 200: ListPromissoriesSchema, 401: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
        }

        const result = await new ListPromissories().execute(request.query)
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
    method: 'PATCH',
    url: '/installments/:installmentId/pay',
    schema: {
      tags: ['Promissórias'],
      summary: 'Registrar pagamento de uma parcela',
      params: z.object({ installmentId: z.string().min(1) }),
      body: PayInstallmentBodySchema,
      response: {
        200: InstallmentSchema,
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

        const installment = await new PayInstallment().execute({
          installmentId: request.params.installmentId,
          paidAt: request.body.paidAt,
        })

        return reply.status(200).send({
          id: installment.id,
          number: installment.number,
          amountInCents: installment.amountInCents,
          dueDate: installment.dueDate.toISOString().slice(0, 10),
          status: installment.status,
          paidAt: installment.paidAt?.toISOString(),
        })
      } catch (error) {
        app.log.error(error)
        if (error instanceof NotFoundError) {
          return reply.status(404).send({ error: error.message, code: 'NOT_FOUND_ERROR' })
        }
        if (error instanceof InstallmentAlreadyPaidError) {
          return reply
            .status(409)
            .send({ error: error.message, code: 'INSTALLMENT_ALREADY_PAID_ERROR' })
        }
        return reply
          .status(500)
          .send({ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' })
      }
    },
  })
}
