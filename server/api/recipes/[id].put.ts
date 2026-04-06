import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const existing = await prisma.recipe.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Recipe not found' })
  }

  // Update recipe fields
  const data: any = {}
  if (body.name !== undefined) data.name = body.name
  if (body.description !== undefined) data.description = body.description
  if (body.time !== undefined) data.time = body.time
  if (body.cuisine !== undefined) data.cuisine = body.cuisine
  if (body.budget !== undefined) data.budget = body.budget
  if (body.tags !== undefined) data.tags = body.tags
  if (body.mealTypes !== undefined) data.mealTypes = body.mealTypes
  if (body.servings !== undefined) data.servings = body.servings
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl

  // Replace ingredients if provided
  if (body.ingredients) {
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } })
    data.ingredients = {
      create: body.ingredients.map((ing: any) => ({ name: ing.name, quantity: ing.quantity, unit: ing.unit }))
    }
  }

  // Replace steps if provided
  if (body.steps) {
    await prisma.recipeStep.deleteMany({ where: { recipeId: id } })
    data.steps = {
      create: body.steps.map((s: any) => ({
        number: s.number,
        description: s.description,
        duration: s.duration,
        type: s.type ?? 'prep',
        mode: s.mode ?? 'actif',
        equipment: s.equipment
      }))
    }
  }

  const recipe = await prisma.recipe.update({
    where: { id },
    data,
    include: { ingredients: true, steps: { orderBy: { number: 'asc' } } }
  })

  return recipe
})
