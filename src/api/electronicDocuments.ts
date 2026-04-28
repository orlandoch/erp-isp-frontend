import api from './client'
import type { ApiResponse, PaginatedResponse } from './types'

export interface ElectronicDocument {
  id: number
  access_key: string
  sequential: number
  internal_status: string
  sri_status: string | null
  issue_date: string | null
  environment: string
  last_error: string | null
  logs?: unknown[]
  messages?: unknown[]
}

export async function getElectronicDocuments(page = 1): Promise<PaginatedResponse<ElectronicDocument>> {
  const { data } = await api.get<PaginatedResponse<ElectronicDocument>>('/electronic-documents', { params: { page } })
  return data
}

export async function getElectronicDocument(id: number): Promise<ApiResponse<ElectronicDocument>> {
  const { data } = await api.get<ApiResponse<ElectronicDocument>>(`/electronic-documents/${id}`)
  return data
}
