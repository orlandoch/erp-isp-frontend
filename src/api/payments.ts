import api from './client'
import type { ApiResponse, PaginatedResponse } from './types'

export interface Payment {
  id: number
  client?: { id: number; full_name: string }
  invoice?: { id: number; code: string }
  amount: number
  payment_date: string
  payment_method?: { id: number; name: string }
  reference?: string
}

export async function getPayments(page = 1, clientId?: number): Promise<PaginatedResponse<Payment>> {
  const params: Record<string, unknown> = { page }
  if (clientId) params.client_id = clientId
  const { data } = await api.get<PaginatedResponse<Payment>>('/payments', { params })
  return data
}

export async function registerPayment(payload: Record<string, unknown>): Promise<ApiResponse<Payment>> {
  const { data } = await api.post<ApiResponse<Payment>>('/payments', payload)
  return data
}
