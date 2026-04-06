import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const recipe = await prisma.recipe.create({
    data: {
      name: body.name,
      description: body.description,
      time: body.time,
      cuisine: body.cuisine,
      budget: body.budget ?? 2,
      tags: body.tags ?? [],
      mealTypes: body.mealTypes ?? [],
      servings: body.servings ?? 4,
      source: 'custom',
      ingredients: body.ingredients?.length
        ? { create: body.ingredients.map((ing: any) => ({ name: ing.name, quantity: ing.quantity, unit: ing.unit })) }
        : undefined,
      steps: body.steps?.length
        ? {
            create: body.steps.map((s: any) => ({
              number: s.number,
              description: s.description,
              duration: s.duration,
              type: s.type ?? 'prep',
              mode: s.mode ?? 'actif',
              equipment: s.equipment
            }))
          }
        : undefined
    },
    include: { ingredients: true, steps: { orderBy: { number: 'asc' } } }
  })

  return recipe
})
