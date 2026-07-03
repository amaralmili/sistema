import { ProductCategory } from '../generated/prisma/enums.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  category?: ProductCategory
  brand?: string
  search?: string
  onlyActive?: boolean
}

export class ListProducts {
  async execute(dto: InputDto) {
    return prisma.product.findMany({
      where: {
        category: dto.category,
        brand: dto.brand ? { equals: dto.brand, mode: 'insensitive' } : undefined,
        isActive: dto.onlyActive ? true : undefined,
        OR: dto.search
          ? [
              { name: { contains: dto.search, mode: 'insensitive' } },
              { brand: { contains: dto.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: { name: 'asc' },
    })
  }
}
