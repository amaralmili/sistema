import { prisma } from '../lib/db.js'

interface InputDto {
  customerId?: string
}

export class ListSales {
  async execute(dto: InputDto) {
    const sales = await prisma.sale.findMany({
      where: { customerId: dto.customerId },
      include: {
        items: { include: { product: true } },
        promissory: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return sales.map((sale) => ({
      id: sale.id,
      customerId: sale.customerId,
      sellerId: sale.sellerId,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      discountInCents: sale.discountInCents,
      totalInCents: sale.totalInCents,
      promissoryId: sale.promissory?.id,
      items: sale.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unitPriceInCents: item.unitPriceInCents,
      })),
      createdAt: sale.createdAt.toISOString(),
    }))
  }
}
