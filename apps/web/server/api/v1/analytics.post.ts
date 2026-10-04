export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)
  if (
    !body ||
    Object.keys(body).some((key) => !['property_id', 'event'].includes(key))
  )
    throw createError({
      statusCode: 422,
      statusMessage: 'Field tidak diizinkan',
    })
  try {
    await $fetch(`${useRuntimeConfig().apiBase}/api/v1/analytics`, {
      method: 'POST',
      body,
      headers: publicHeaders(event, 'POST', '/api/v1/analytics'),
      timeout: 3000,
    })
    event.node.res.statusCode = 202
    return { accepted: true }
  } catch (error) {
    const code = (error as { statusCode?: number }).statusCode
    throw createError({
      statusCode: [404, 422, 429].includes(code ?? 0) ? code : 503,
    })
  }
})
