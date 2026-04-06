export default defineEventHandler(async (event) => {
  const apiKey = process.env.SPOONACULAR_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 503, statusMessage: 'Spoonacular API key is not configured' })
  }

  const { query } = getQuery(event)
  if (!query || typeof query !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Query parameter "query" is required' })
  }

  try {
    const url = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&number=5&addRecipeInformation=true&apiKey=${apiKey}`
    const data: any = await $fetch(url)

    const results = (data.results ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      image: r.image,
      readyInMinutes: r.readyInMinutes,
      servings: r.servings
    }))

    return { results }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 502, statusMessage: `Spoonacular API error: ${err.message ?? 'Unknown error'}` })
  }
})
