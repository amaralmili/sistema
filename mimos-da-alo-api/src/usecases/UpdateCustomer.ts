import { DuplicateDocumentError, NotFoundError } from '../errors/index.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  customerId: string
  name?: string
  document?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

export class UpdateCustomer {
  async execute(dto: InputDto) {
    const customer = await prisma.customer.findUnique({
      where: { id: dto.customerId },
    })

    if (!customer) {
      throw new NotFoundError('Cliente não encontrado')
    }

    if (dto.document && dto.document !== customer.document) {
      const existing = await prisma.customer.findUnique({
        where: { document: dto.document },
      })
      if (existing) {
        throw new DuplicateDocumentError(
          'Já existe um cliente cadastrado com este documento'
        )
      }
    }

    return prisma.customer.update({
      where: { id: dto.customerId },
      data: {
        name: dto.name,
        document: dto.document,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        notes: dto.notes,
      },
    })
  }
}
