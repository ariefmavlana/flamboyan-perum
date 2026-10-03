import { catalogApi } from '../../../utils/catalog-api'
export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 160)
    throw createError({ statusCode: 404 })
  return catalogApi(event, `/${slug}`)
})
