import { DuplicateDocumentError } from '../errors/index.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  name: string
  document?: string
  phone: string
  email?: string
  address?: string
  notes?: string
}

export class CreateCustomer {
  async execute(dto: InputDto) {
    if (dto.document) {
      const existing = await prisma.customer.findUnique({
        where: { document: dto.document },
      })
      if (existing) {
        throw new DuplicateDocumentError(
          'Já existe um cliente cadastrado com este documento'
        )
      }
    }

    return prisma.customer.create({
      data: {
        id: crypto.randomUUID(),
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
