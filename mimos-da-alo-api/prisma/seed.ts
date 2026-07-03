import 'dotenv/config'

import { auth } from '../src/lib/auth.js'
import { prisma } from '../src/lib/db.js'

async function main() {
  console.log('Iniciando seed...')

  // ----------------------------------------------------------------
  // Usuário de login (RF01)
  // ----------------------------------------------------------------
  const existingUser = await prisma.user.findUnique({
    where: { email: 'admin@mimosdaalo.com' },
  })

  if (!existingUser) {
    await auth.api.signUpEmail({
      body: {
        name: 'Admin Mimos da Alô',
        email: 'admin@mimosdaalo.com',
        password: 'senha123456',
      },
    })
    console.log('✔ Usuário criado: admin@mimosdaalo.com / senha123456')
  } else {
    console.log('- Usuário admin já existia, pulando')
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { email: 'admin@mimosdaalo.com' },
  })

  // ----------------------------------------------------------------
  // Produtos (RF02)
  // ----------------------------------------------------------------
  const productsData = [
    {
      name: 'Perfume Encanto 100ml',
      description: 'Fragrância floral amadeirada de longa duração',
      category: 'PERFUME' as const,
      brand: 'O Boticário',
      priceInCents: 8990,
      stockQuantity: 15,
    },
    {
      name: 'Batom Matte Vermelho',
      description: 'Acabamento matte, alta pigmentação',
      category: 'COSMETICO' as const,
      brand: 'Eudora',
      priceInCents: 2490,
      stockQuantity: 30,
    },
    {
      name: 'Brinco Prata 925 Gota',
      description: 'Brinco banhado em prata 925',
      category: 'JOIA' as const,
      brand: 'Rommanel',
      priceInCents: 5990,
      stockQuantity: 10,
    },
    {
      name: 'Bolsa Transversal Couro Sintético',
      description: 'Bolsa pequena, alça ajustável',
      category: 'ACESSORIO' as const,
      brand: 'Petite Jolie',
      priceInCents: 12990,
      stockQuantity: 8,
    },
    {
      name: 'Kit Pincéis de Maquiagem (6 peças)',
      description: 'Cerdas macias, cabo de madeira',
      category: 'COSMETICO' as const,
      brand: 'Eudora',
      priceInCents: 4990,
      stockQuantity: 20,
    },
  ]

  const products = []
  for (const data of productsData) {
    const product = await prisma.product.upsert({
      where: { id: `seed-${data.name}` },
      update: { brand: data.brand },
      create: { id: `seed-${data.name}`, ...data },
    })
    products.push(product)
  }
  console.log(`✔ ${products.length} produtos cadastrados`)

  // ----------------------------------------------------------------
  // Clientes (RF03)
  // ----------------------------------------------------------------
  const customersData = [
    {
      id: 'seed-customer-maria',
      name: 'Maria Silva',
      document: '11122233344',
      phone: '(18) 99999-0001',
      email: 'maria.silva@example.com',
      address: 'Rua das Flores, 123 - Santo Anastácio/SP',
    },
    {
      id: 'seed-customer-joana',
      name: 'Joana Pereira',
      document: '55566677788',
      phone: '(18) 99999-0002',
      email: 'joana.pereira@example.com',
      address: 'Av. Brasil, 456 - Santo Anastácio/SP',
    },
  ]

  const customers = []
  for (const data of customersData) {
    const customer = await prisma.customer.upsert({
      where: { id: data.id },
      update: {},
      create: data,
    })
    customers.push(customer)
  }
  console.log(`✔ ${customers.length} clientes cadastrados`)

  // ----------------------------------------------------------------
  // Venda à vista (RF05)
  // ----------------------------------------------------------------
  const existingCashSale = await prisma.sale.findFirst({
    where: { id: 'seed-sale-cash' },
  })

  if (!existingCashSale) {
    const perfume = products[0]
    const batom = products[1]

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: perfume.id },
        data: { stockQuantity: { decrement: 1 } },
      })
      await tx.product.update({
        where: { id: batom.id },
        data: { stockQuantity: { decrement: 2 } },
      })

      await tx.sale.create({
        data: {
          id: 'seed-sale-cash',
          customerId: customers[0].id,
          sellerId: user.id,
          paymentMethod: 'PIX',
          totalInCents: perfume.priceInCents + batom.priceInCents * 2,
          items: {
            create: [
              {
                productId: perfume.id,
                quantity: 1,
                unitPriceInCents: perfume.priceInCents,
              },
              {
                productId: batom.id,
                quantity: 2,
                unitPriceInCents: batom.priceInCents,
              },
            ],
          },
        },
      })
    })
    console.log('✔ Venda à vista de exemplo criada (PIX)')
  }

  // ----------------------------------------------------------------
  // Venda parcelada / promissória (RF05 + RF06), com uma parcela
  // propositalmente vencida para demonstrar o RF04
  // ----------------------------------------------------------------
  const existingPromissorySale = await prisma.sale.findFirst({
    where: { id: 'seed-sale-promissory' },
  })

  if (!existingPromissorySale) {
    const brinco = products[2]
    const bolsa = products[3]
    const total = brinco.priceInCents + bolsa.priceInCents

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: brinco.id },
        data: { stockQuantity: { decrement: 1 } },
      })
      await tx.product.update({
        where: { id: bolsa.id },
        data: { stockQuantity: { decrement: 1 } },
      })

      await tx.sale.create({
        data: {
          id: 'seed-sale-promissory',
          customerId: customers[1].id,
          sellerId: user.id,
          paymentMethod: 'PROMISSORIA',
          totalInCents: total,
          items: {
            create: [
              {
                productId: brinco.id,
                quantity: 1,
                unitPriceInCents: brinco.priceInCents,
              },
              {
                productId: bolsa.id,
                quantity: 1,
                unitPriceInCents: bolsa.priceInCents,
              },
            ],
          },
        },
      })

      const promissory = await tx.promissory.create({
        data: {
          id: 'seed-promissory-1',
          saleId: 'seed-sale-promissory',
          totalInCents: total,
        },
      })

      const baseAmount = Math.floor(total / 3)
      const remainder = total - baseAmount * 3

      // Parcela 1: vencida há 10 dias (não paga) -> aparece no RF04
      const overdueDate = new Date()
      overdueDate.setDate(overdueDate.getDate() - 10)

      // Parcelas 2 e 3: futuras
      const secondDueDate = new Date()
      secondDueDate.setDate(secondDueDate.getDate() + 20)
      const thirdDueDate = new Date()
      thirdDueDate.setDate(thirdDueDate.getDate() + 50)

      await tx.installment.createMany({
        data: [
          {
            id: 'seed-installment-1',
            promissoryId: promissory.id,
            number: 1,
            amountInCents: baseAmount,
            dueDate: overdueDate,
            status: 'PENDENTE',
          },
          {
            id: 'seed-installment-2',
            promissoryId: promissory.id,
            number: 2,
            amountInCents: baseAmount,
            dueDate: secondDueDate,
            status: 'PENDENTE',
          },
          {
            id: 'seed-installment-3',
            promissoryId: promissory.id,
            number: 3,
            amountInCents: baseAmount + remainder,
            dueDate: thirdDueDate,
            status: 'PENDENTE',
          },
        ],
      })
    })

    console.log(
      '✔ Venda parcelada de exemplo criada (promissória com 3 parcelas, ' +
        'a 1ª propositalmente vencida para você testar o RF04)'
    )
  }

  console.log('\nSeed concluído!')
  console.log('Login de teste -> email: admin@mimosdaalo.com | senha: senha123456')
  console.log(
    'Dica: chame POST /notifications/run-overdue-check para ver a notificação de atraso sendo gerada.'
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
