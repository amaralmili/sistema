import { NotFoundError } from '../errors/index.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  customerId: string
}

export class GetCustomer {
  async execute(dto: InputDto) {
    const customer = await prisma.customer.findUnique({
      where: { id: dto.customerId },
    })

    if (!customer) {
      throw new NotFoundError('Cliente não encontrado')
    }

    return customer
  }
}
