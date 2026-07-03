import { NotFoundError } from '../errors/index.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  customerId: string
}

// RF07 - histórico de compras de cada cliente
export class GetCustomerPurchaseHistory {
  async execute(dto: InputDto) {
    const customer = await prisma.customer.findUnique({
      where: { id: dto.customerId },
    })

    if (!customer) {
      throw new NotFoundError('Cliente não encontrado')
    }

    const sales = await prisma.sale.findMany({
      where: { customerId: dto.customerId, status: 'CONCLUIDA' },
      include: {
        items: { include: { product: true } },
        promissory: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalSpentInCents = sales.reduce(
      (sum, sale) => sum + sale.totalInCents,
      0
    )

    return {
      customer,
      totalSpentInCents,
      sales: sales.map((sale) => ({
        id: sale.id,
        customerId: sale.customerId,
        sellerId: sale.sellerId,
        paymentMethod: sale.paymentMethod,
        status: sale.status,
        totalInCents: sale.totalInCents,
        promissoryId: sale.promissory?.id,
        items: sale.items.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          unitPriceInCents: item.unitPriceInCents,
        })),
        createdAt: sale.createdAt.toISOString(),
      })),
    }
  }
}
