import { fromNodeHeaders } from 'better-auth/node'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { auth } from '../lib/auth.js'
import {
  ErrorSchema,
  ListNotificationsQuerySchema,
  ListNotificationsSchema,
  RunOverdueNotificationsResultSchema,
} from '../schemas/index.js'
import { ListNotifications } from '../usecases/ListNotifications.js'
import { NotifyOverdueInstallments } from '../usecases/NotifyOverdueInstallments.js'

export const notificationRoutes = (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/',
    schema: {
      tags: ['Notificações'],
      summary: 'Listar notificações de atraso já enviadas',
      querystring: ListNotificationsQuerySchema,
      response: { 200: ListNotificationsSchema, 401: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        })
        if (!session) {
          return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
        }

        const result = await new ListNotifications().execute(request.query)
        return reply.status(200).send(result)
      } catch (error) {
        app.log.error(error)
        return reply
          .status(500)
          .send({ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' })
      }
    },
  })

  // Dispara a varredura de parcelas em atraso e gera as notificações (RF04).
  // Em produção, este endpoint seria chamado por um agendador (cron job)
  // diariamente, em vez de manualmente.
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/run-overdue-check',
    schema: {
      tags: ['Notificações'],
      summary: 'Executar verificação de parcelas em atraso e notificar clientes',
      response: {
        200: RunOverdueNotificationsResultSchema,
        401: ErrorSchema,
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

        const result = await new NotifyOverdueInstallments().execute()
        return reply.status(200).send(result)
      } catch (error) {
        app.log.error(error)
        return reply
          .status(500)
          .send({ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' })
      }
    },
  })
}
