import api from './client'
import type { ApiResponse, PaginatedResponse } from './types'

export interface Iva {
  id: number
  name: string
  percentage: string
  sri_code: string
  is_active: boolean
  is_default: boolean
}

export async function getIvas(): Promise<PaginatedResponse<Iva>> {
  const { data } = await api.get('/ivas')
  return data
}
