import { NotFoundError } from '../errors/index.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  productId: string
}

// Não removemos o produto fisicamente (RNF04 - integridade dos dados),
// pois ele pode estar referenciado em vendas já realizadas.
export class DeactivateProduct {
  async execute(dto: InputDto) {
    const product = await prisma.product.findUnique({
      where: { id: dto.productId },
    })

    if (!product) {
      throw new NotFoundError('Produto não encontrado')
    }

    return prisma.product.update({
      where: { id: dto.productId },
      data: { isActive: false },
    })
  }
}
