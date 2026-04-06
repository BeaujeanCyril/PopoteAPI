import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const prisma = new PrismaClient()

interface RawRecipe {
  n: string; d: string; t: string; c: string;
  tags: string[]; ing: string[]; tp: string[]; b: number;
}

async function main() {
  const jsonPath = resolve(__dirname, '../../PopoteAngular/src/assets/recipes.json')
  const recipes: RawRecipe[] = JSON.parse(readFileSync(jsonPath, 'utf-8'))
  const first5 = recipes.slice(0, 5)

  for (const r of first5) {
    const existing = await prisma.recipe.findFirst({ where: { name: r.n, source: 'popote' } })
    if (existing) { console.log(`Skip: ${r.n}`); continue }

    const recipe = await prisma.recipe.create({
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
    console.log(`Created: ${recipe.name} (${recipe.id})`)
  }
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect() })
