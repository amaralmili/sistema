import dayjs from 'dayjs'

import { prisma } from '../lib/db.js'

// RF04 - identifica parcelas vencidas e não pagas, marca como ATRASADA
// e gera um registro de notificação para o cliente.
//
// Em produção este use case seria disparado por um job agendado (cron),
// mas aqui também é exposto via rota para poder ser testado manualmente.
export class NotifyOverdueInstallments {
  async execute() {
    const today = dayjs().startOf('day').toDate()

    const overdueInstallments = await prisma.installment.findMany({
      where: {
        status: 'PENDENTE',
        dueDate: { lt: today },
      },
      include: {
        promissory: { include: { sale: { include: { customer: true } } } },
      },
    })

    const notifications = []

    for (const installment of overdueInstallments) {
      await prisma.installment.update({
        where: { id: installment.id },
        data: { status: 'ATRASADA' },
      })

      const customer = installment.promissory.sale.customer
      const message = `Olá ${customer.name}, a parcela ${installment.number} no valor de R$ ${(
        installment.amountInCents / 100
      ).toFixed(2)} venceu em ${dayjs(installment.dueDate).format(
        'DD/MM/YYYY'
      )} e ainda não foi paga. Entre em contato para regularizar.`

      const notification = await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          customerId: customer.id,
          installmentId: installment.id,
          message,
        },
      })

      notifications.push({
        id: notification.id,
        customerId: customer.id,
        customerName: customer.name,
        installmentId: installment.id,
        message: notification.message,
        sentAt: notification.sentAt.toISOString(),
      })
    }

    return {
      overdueInstallmentsFound: overdueInstallments.length,
      notificationsCreated: notifications,
    }
  }
}
