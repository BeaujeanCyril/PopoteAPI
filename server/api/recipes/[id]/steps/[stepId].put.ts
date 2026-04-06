import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const recipeId = Number(getRouterParam(event, 'id'))
  const stepId = Number(getRouterParam(event, 'stepId'))
  const body = await readBody(event)

  const step = await prisma.recipeStep.findFirst({
    where: { id: stepId, recipeId }
  })

  if (!step) {
    throw createError({ statusCode: 404, statusMessage: 'Step not found' })
  }

  const data: any = {}
  if (body.number !== undefined) data.number = body.number
  if (body.description !== undefined) data.description = body.description
  if (body.duration !== undefined) data.duration = body.duration
  if (body.type !== undefined) data.type = body.type
  if (body.mode !== undefined) data.mode = body.mode
  if (body.equipment !== undefined) data.equipment = body.equipment

  const updated = await prisma.recipeStep.update({
    where: { id: stepId },
    data
  })

  return updated
})
