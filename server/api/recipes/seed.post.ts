import prisma from '~/server/utils/db'
import { readFileSync } from 'fs'
import { resolve } from 'path'

interface RawRecipe {
  n: string; d: string; t: string; c: string;
  tags: string[]; ing: string[]; tp: string[]; b: number;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const from = body.from ?? 0
  const count = body.count ?? 10

  const jsonPath = resolve(process.cwd(), '../PopoteAngular/src/assets/recipes.json')
  const recipes: RawRecipe[] = JSON.parse(readFileSync(jsonPath, 'utf-8'))
  const slice = recipes.slice(from, from + count)

  let created = 0

  for (const r of slice) {
    const existing = await prisma.recipe.findFirst({ where: { name: r.n, source: 'popote' } })
    if (existing) continue

    await prisma.recipe.create({
      data: {
        name: r.n,
        description: r.d,
        time: r.t,
        cuisine: r.c,
        budget: r.b,
        tags: r.tags,
        mealTypes: r.tp,
        source: 'popote',
        ingredients: {
          create: r.ing.map(name => ({ name }))
        }
      }
    })
    created++
  }

  return { created }
})
