import api from './client'
import type { ApiResponse, PaginatedResponse } from './types'

export interface ProductCategory {
  id: number
  name: string
  parent_id: number | null
  iva_id: number | null
  income_account_id: number | null
  expense_account_id: number | null
  inventory_account_id: number | null
  cogs_account_id: number | null
  description: string | null
  is_active: boolean
  parent?: ProductCategory | null
  children?: ProductCategory[]
}

export async function getProductCategories(page = 1): Promise<PaginatedResponse<ProductCategory>> {
  const { data } = await api.get('/product-categories', { params: { page, is_active: true } })
  return data
}

export async function getProductCategory(id: number): Promise<ApiResponse<ProductCategory>> {
  const { data } = await api.get(`/product-categories/${id}`)
  return data
}
