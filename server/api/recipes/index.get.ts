import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 0
  const limit = Number(query.limit) || 20
  const search = query.search as string | undefined
  const cuisine = query.cuisine as string | undefined
  const tag = query.tag as string | undefined

  const where: any = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ]
  }

  if (cuisine) {
    where.cuisine = cuisine
  }

  if (tag) {
    where.tags = { has: tag }
  }

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      include: { ingredients: true, steps: { orderBy: { number: 'asc' } } },
      skip: page * limit,
      take: limit,
      orderBy: { name: 'asc' }
    }),
    prisma.recipe.count({ where })
  ])

  return { recipes, total }
})
