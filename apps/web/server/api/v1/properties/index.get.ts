import { catalogApi } from '../../../utils/catalog-api'
export default defineEventHandler((event) => catalogApi(event, ''))
