import prisma from '~/server/utils/db'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

function budgetFromPrice(pricePerServing: number | undefined): number {
  if (!pricePerServing) return 2
  // pricePerServing is in US cents
  if (pricePerServing < 150) return 1
  if (pricePerServing < 400) return 2
  return 3
}

function buildTags(info: any): string[] {
  const tags: string[] = []
  if (info.vegetarian) tags.push('vegetarian')
  if (info.vegan) tags.push('vegan')
  if (info.glutenFree) tags.push('sans gluten')
  if (info.dairyFree) tags.push('sans lactose')
  if (info.veryHealthy) tags.push('healthy')
  return tags
}

export default defineEventHandler(async (event) => {
  const apiKey = process.env.SPOONACULAR_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 503, statusMessage: 'Spoonacular API key is not configured' })
  }

  const body = await readBody(event)
  const query = body?.query
  if (!query || typeof query !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Body field "query" is required' })
  }

  let spoonRecipe: any

  // 1. Search for the recipe
  try {
    const searchUrl = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&number=1&addRecipeInformation=true&apiKey=${apiKey}`
    const searchData: any = await $fetch(searchUrl)

    if (!searchData.results?.length) {
      throw createError({ statusCode: 404, statusMessage: `No recipe found for "${query}"` })
    }

    spoonRecipe = searchData.results[0]
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 502, statusMessage: `Spoonacular search failed: ${err.message ?? 'Unknown error'}` })
  }

  // 2. Get analyzed instructions
  let instructions: any[] = []
  try {
    const instructionsUrl = `https://api.spoonacular.com/recipes/${spoonRecipe.id}/analyzedInstructions?apiKey=${apiKey}`
    const instructionsData: any = await $fetch(instructionsUrl)
    if (Array.isArray(instructionsData) && instructionsData.length > 0) {
      instructions = instructionsData[0].steps ?? []
    }
  } catch {
    // Non-blocking: we can still create the recipe without detailed steps
  }

  // 3. Build ingredients from extendedIngredients
  const ingredients = (spoonRecipe.extendedIngredients ?? []).map((ing: any) => ({
    name: ing.name ?? ing.originalName ?? 'Unknown',
    quantity: ing.amount != null ? String(ing.amount) : null,
    unit: ing.unit || null
  }))

  // 4. Build steps from analyzed instructions
  const steps = instructions.map((step: any, index: number) => ({
    number: step.number ?? index + 1,
    description: step.step ?? '',
    type: 'prep' as const,
    mode: 'actif' as const,
    equipment: (step.equipment ?? []).map((e: any) => e.name).join(', ') || null
  }))

  // 5. Create the recipe in the database
  try {
    const recipe = await prisma.recipe.create({
      data: {
        name: spoonRecipe.title,
        description: spoonRecipe.summary ? stripHtml(spoonRecipe.summary) : null,
        time: spoonRecipe.readyInMinutes ? `${spoonRecipe.readyInMinutes} min` : null,
        cuisine: spoonRecipe.cuisines?.length ? spoonRecipe.cuisines[0] : 'Autre',
        budget: budgetFromPrice(spoonRecipe.pricePerServing),
        tags: buildTags(spoonRecipe),
        mealTypes: spoonRecipe.dishTypes ?? [],
        source: 'spoonacular',
        sourceId: String(spoonRecipe.id),
        servings: spoonRecipe.servings ?? 4,
        imageUrl: spoonRecipe.image ?? null,
        ingredients: ingredients.length
          ? { create: ingredients }
          : undefined,
        steps: steps.length
          ? { create: steps }
          : undefined
      },
      include: { ingredients: true, steps: { orderBy: { number: 'asc' } } }
    })

    return recipe
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: `Failed to save recipe: ${err.message ?? 'Unknown error'}` })
  }
})
