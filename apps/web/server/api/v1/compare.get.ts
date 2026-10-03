import { publicApi } from '../../utils/public-api'
export default defineEventHandler((event) => publicApi(event, 'compare'))
