import { PaymentMethod } from '../generated/prisma/enums.js'
import {
  InsufficientStockError,
  InvalidInstallmentPlanError,
  NotFoundError,
} from '../errors/index.js'
import { prisma } from '../lib/db.js'

interface SaleItemInput {
  productId: string
  quantity: number
}

interface InstallmentPlanInput {
  numberOfInstallments: number
  firstDueDate: string // YYYY-MM-DD
  intervalInDays: number
}

interface InputDto {
  customerId: string
  sellerId: string
  paymentMethod: PaymentMethod
  items: SaleItemInput[]
  discountInCents?: number
  installmentPlan?: InstallmentPlanInput
}

export class CreateSale {
  async execute(dto: InputDto) {
    const customer = await prisma.customer.findUnique({
      where: { id: dto.customerId },
    })
    if (!customer) {
      throw new NotFoundError('Cliente não encontrado')
    }

    if (dto.paymentMethod === 'PROMISSORIA' && !dto.installmentPlan) {
      throw new InvalidInstallmentPlanError(
        'É necessário informar o plano de parcelamento para vendas no formato promissória'
      )
    }

    const productIds = dto.items.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    })

    const productsById = new Map(products.map((product) => [product.id, product]))

    for (const item of dto.items) {
      const product = productsById.get(item.productId)
      if (!product) {
        throw new NotFoundError(`Produto ${item.productId} não encontrado`)
      }
      if (product.stockQuantity < item.quantity) {
        throw new InsufficientStockError(
          `Estoque insuficiente para o produto "${product.name}"`
        )
      }
    }

    const subtotalInCents = dto.items.reduce((sum, item) => {
      const product = productsById.get(item.productId)!
      return sum + product.priceInCents * item.quantity
    }, 0)

    // O desconto nunca deixa o total ficar negativo, mesmo que informem
    // um valor maior que o subtotal da venda.
    const discountInCents = Math.min(dto.discountInCents ?? 0, subtotalInCents)
    const totalInCents = subtotalInCents - discountInCents

    const saleId = crypto.randomUUID()

    const sale = await prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        })
      }

      const createdSale = await tx.sale.create({
        data: {
          id: saleId,
          customerId: dto.customerId,
          sellerId: dto.sellerId,
          paymentMethod: dto.paymentMethod,
          discountInCents,
          totalInCents,
          items: {
            create: dto.items.map((item) => {
              const product = productsById.get(item.productId)!
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPriceInCents: product.priceInCents,
              }
            }),
          },
        },
        include: {
          items: { include: { product: true } },
        },
      })

      if (dto.paymentMethod === 'PROMISSORIA' && dto.installmentPlan) {
        const { numberOfInstallments, firstDueDate, intervalInDays } =
          dto.installmentPlan

        const baseAmount = Math.floor(totalInCents / numberOfInstallments)
        const remainder = totalInCents - baseAmount * numberOfInstallments

        const promissory = await tx.promissory.create({
          data: {
            id: crypto.randomUUID(),
            saleId,
            totalInCents,
          },
        })

        const firstDate = new Date(firstDueDate)
        for (let i = 0; i < numberOfInstallments; i++) {
          const dueDate = new Date(firstDate)
          dueDate.setDate(dueDate.getDate() + i * intervalInDays)

          await tx.installment.create({
            data: {
              id: crypto.randomUUID(),
              promissoryId: promissory.id,
              number: i + 1,
              // a última parcela absorve o resto da divisão (centavos)
              amountInCents:
                i === numberOfInstallments - 1
                  ? baseAmount + remainder
                  : baseAmount,
              dueDate,
            },
          })
        }
      }

      return createdSale
    })

    const promissory = await prisma.promissory.findUnique({
      where: { saleId },
    })

    return {
      id: sale.id,
      customerId: sale.customerId,
      sellerId: sale.sellerId,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      discountInCents: sale.discountInCents,
      totalInCents: sale.totalInCents,
      promissoryId: promissory?.id,
      items: sale.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unitPriceInCents: item.unitPriceInCents,
      })),
      createdAt: sale.createdAt.toISOString(),
    }
  }
}
