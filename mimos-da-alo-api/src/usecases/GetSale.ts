import { NotFoundError } from '../errors/index.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  saleId: string
}

export class GetSale {
  async execute(dto: InputDto) {
    const sale = await prisma.sale.findUnique({
      where: { id: dto.saleId },
      include: {
        items: { include: { product: true } },
        promissory: true,
      },
    })

    if (!sale) {
      throw new NotFoundError('Venda não encontrada')
    }

    return {
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
    }
  }
}
