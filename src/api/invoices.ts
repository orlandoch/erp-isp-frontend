import api from './client'
import type { ApiResponse, PaginatedResponse } from './types'

export interface InvoiceItem {
  id: number
  item_type: string
  description: string
  quantity: number
  unit_price: number
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
}

export interface Invoice {
  id: number
  code: string
  client?: { id: number; full_name: string; document_number: string }
  issue_date: string | null
  status: string
  subtotal: number
  discount_total: number
  tax_total: number
  total: number
  items?: InvoiceItem[]
}

export async function getInvoices(page = 1, status?: string): Promise<PaginatedResponse<Invoice>> {
  const params: Record<string, unknown> = { page }
  if (status) params.status = status
  const { data } = await api.get<PaginatedResponse<Invoice>>('/invoices', { params })
  return data
}

export async function getInvoice(id: number): Promise<ApiResponse<Invoice>> {
  const { data } = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`)
  return data
}

export async function createInvoice(payload: Record<string, unknown>): Promise<ApiResponse<Invoice>> {
  const { data } = await api.post<ApiResponse<Invoice>>('/invoices', payload)
  return data
}

export async function issueInvoice(id: number): Promise<ApiResponse<Invoice>> {
  const { data } = await api.post<ApiResponse<Invoice>>(`/invoices/${id}/issue`)
  return data
}
