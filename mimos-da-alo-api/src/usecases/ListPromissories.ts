import { prisma } from '../lib/db.js'

interface InputDto {
  customerId?: string
  onlyOverdue?: boolean
}

export class ListPromissories {
  async execute(dto: InputDto) {
    const promissories = await prisma.promissory.findMany({
      where: {
        sale: { customerId: dto.customerId },
        installments: dto.onlyOverdue
          ? { some: { status: 'ATRASADA' } }
          : undefined,
      },
      include: {
        sale: { include: { customer: true } },
        installments: { orderBy: { number: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return promissories.map((promissory) => ({
      id: promissory.id,
      saleId: promissory.saleId,
      customerId: promissory.sale.customerId,
      customerName: promissory.sale.customer.name,
      totalInCents: promissory.totalInCents,
      installments: promissory.installments.map((installment) => ({
        id: installment.id,
        number: installment.number,
        amountInCents: installment.amountInCents,
        dueDate: installment.dueDate.toISOString().slice(0, 10),
        status: installment.status,
        paidAt: installment.paidAt?.toISOString(),
      })),
    }))
  }
}
