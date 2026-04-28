import api from './client'
import type { ApiResponse, PaginatedResponse } from './types'

export interface Product {
  id: number
  name: string
  code: string
  auxiliary_code: string | null
  item_type: string
  unit: string
  price: number
  cost: number
  is_sellable: boolean
  is_purchasable: boolean
  is_inventory_controlled: boolean
  has_serial: boolean
  category_id: number | null
  iva_id: number | null
  income_account_id: number | null
  expense_account_id: number | null
  inventory_account_id: number | null
  cogs_account_id: number | null
  is_active: boolean
  brand?: any
  category?: any
  iva?: any
}

export interface CreateProductPayload {
  name: string
  code?: string
  item_type: string
  unit: string
  price: number
  cost?: number
  is_sellable?: boolean
  is_purchasable?: boolean
  category_id?: number | null
  iva_id?: number | null
  income_account_id?: number | null
  expense_account_id?: number | null
  inventory_account_id?: number | null
  cogs_account_id?: number | null
}

export async function getProducts(page = 1): Promise<PaginatedResponse<Product>> {
  const { data } = await api.get('/products', { params: { page } })
  return data
}

export async function getProduct(id: number): Promise<ApiResponse<Product>> {
  const { data } = await api.get(`/products/${id}`)
  return data
}

export async function createProduct(payload: CreateProductPayload): Promise<ApiResponse<Product>> {
  const { data } = await api.post('/products', payload)
  return data
}

export async function updateProduct(id: number, payload: Partial<CreateProductPayload>): Promise<ApiResponse<Product>> {
  const { data } = await api.put(`/products/${id}`, payload)
  return data
}

export async function deleteProduct(id: number): Promise<ApiResponse<null>> {
  const { data } = await api.delete(`/products/${id}`)
  return data
}
