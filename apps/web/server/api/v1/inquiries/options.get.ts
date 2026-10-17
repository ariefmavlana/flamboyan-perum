import { inquiryApi } from '../../../utils/inquiry-api'
export default defineEventHandler((event) => inquiryApi(event, 'options'))
