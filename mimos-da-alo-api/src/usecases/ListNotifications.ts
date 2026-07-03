import { prisma } from '../lib/db.js'

interface InputDto {
  customerId?: string
}

export class ListNotifications {
  async execute(dto: InputDto) {
    const notifications = await prisma.notification.findMany({
      where: { customerId: dto.customerId },
      include: { customer: true },
      orderBy: { sentAt: 'desc' },
    })

    return notifications.map((notification) => ({
      id: notification.id,
      customerId: notification.customerId,
      customerName: notification.customer.name,
      installmentId: notification.installmentId,
      message: notification.message,
      sentAt: notification.sentAt.toISOString(),
    }))
  }
}
