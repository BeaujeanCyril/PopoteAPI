import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const existing = await prisma.recipe.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Recipe not found' })
  }

  await prisma.recipe.delete({ where: { id } })

  return { deleted: true }
})
