import { ProductCategory } from '../generated/prisma/enums.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  name: string
  description?: string
  category: ProductCategory
  brand?: string
  priceInCents: number
  stockQuantity: number
  imageUrl?: string
}

export class CreateProduct {
  async execute(dto: InputDto) {
    return prisma.product.create({
      data: {
        id: crypto.randomUUID(),
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
