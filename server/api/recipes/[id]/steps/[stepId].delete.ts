import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const recipeId = Number(getRouterParam(event, 'id'))
  const stepId = Number(getRouterParam(event, 'stepId'))

  const step = await prisma.recipeStep.findFirst({
    where: { id: stepId, recipeId }
  })

  if (!step) {
    throw createError({ statusCode: 404, statusMessage: 'Step not found' })
  }

  await prisma.recipeStep.delete({ where: { id: stepId } })

  return { deleted: true }
})
