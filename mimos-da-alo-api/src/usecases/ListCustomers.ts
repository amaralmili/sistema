import { prisma } from '../lib/db.js'

interface InputDto {
  search?: string
}

export class ListCustomers {
  async execute(dto: InputDto) {
    return prisma.customer.findMany({
      where: dto.search
        ? {
            OR: [
              { name: { contains: dto.search, mode: 'insensitive' } },
              { document: { contains: dto.search, mode: 'insensitive' } },
              { phone: { contains: dto.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
    })
  }
}
