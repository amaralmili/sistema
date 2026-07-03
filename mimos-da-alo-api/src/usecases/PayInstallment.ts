import { InstallmentAlreadyPaidError, NotFoundError } from '../errors/index.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  installmentId: string
  paidAt?: string
}

// RF06 - baixa de pagamento de uma parcela da promissória
export class PayInstallment {
  async execute(dto: InputDto) {
    const installment = await prisma.installment.findUnique({
      where: { id: dto.installmentId },
    })

    if (!installment) {
      throw new NotFoundError('Parcela não encontrada')
    }

    if (installment.status === 'PAGA') {
      throw new InstallmentAlreadyPaidError('Esta parcela já foi paga')
    }

    return prisma.installment.update({
      where: { id: dto.installmentId },
      data: {
        status: 'PAGA',
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
      },
    })
  }
}
