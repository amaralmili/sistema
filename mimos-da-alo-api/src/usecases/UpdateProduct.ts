import { ProductCategory } from '../generated/prisma/enums.js'
import { NotFoundError } from '../errors/index.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  productId: string
  name?: string
  description?: string
  category?: ProductCategory
  brand?: string
  priceInCents?: number
  stockQuantity?: number
  imageUrl?: string
}

export class UpdateProduct {
  async execute(dto: InputDto) {
    const product = await prisma.product.findUnique({
      where: { id: dto.productId },
    })

    if (!product) {
      throw new NotFoundError('Produto não encontrado')
    }

    return prisma.product.update({
      where: { id: dto.productId },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        brand: dto.brand,
        priceInCents: dto.priceInCents,
        stockQuantity: dto.stockQuantity,
        imageUrl: dto.imageUrl,
      },
    })
  }
}
