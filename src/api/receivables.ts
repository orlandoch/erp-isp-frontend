import api from './client'
import type { ApiResponse, PaginatedResponse } from './types'

export interface Receivable {
  id: number
  client?: { id: number; full_name: string }
  invoice?: { id: number; code: string }
  total_amount: number
  paid_amount: number
  balance: number
  status: string
  due_date: string | null
  installments?: unknown[]
}

export async function getReceivables(page = 1, status?: string): Promise<PaginatedResponse<Receivable>> {
  const params: Record<string, unknown> = { page }
  if (status) params.status = status
  const { data } = await api.get<PaginatedResponse<Receivable>>('/receivables', { params })
  return data
}

export async function getReceivable(id: number): Promise<ApiResponse<Receivable>> {
  const { data } = await api.get<ApiResponse<Receivable>>(`/receivables/${id}`)
  return data
}
