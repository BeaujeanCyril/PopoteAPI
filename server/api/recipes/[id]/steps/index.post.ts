import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const recipeId = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } })
  if (!recipe) {
    throw createError({ statusCode: 404, statusMessage: 'Recipe not found' })
  }

  const step = await prisma.recipeStep.create({
    data: {
      number: body.number,
      description: body.description,
      duration: body.duration,
      type: body.type ?? 'prep',
      mode: body.mode ?? 'actif',
      equipment: body.equipment,
      recipeId
    }
  })

  return step
})
