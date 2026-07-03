import { NotFoundError } from '../errors/index.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  productId: string
}

export class GetProduct {
  async execute(dto: InputDto) {
    const product = await prisma.product.findUnique({
      where: { id: dto.productId },
    })

    if (!product) {
      throw new NotFoundError('Produto não encontrado')
    }

    return product
  }
}
