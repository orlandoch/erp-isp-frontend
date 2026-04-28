import api from './client'
import type { ApiResponse, PaginatedResponse } from './types'

export interface Phone {
  id?: number
  number: string
  type?: string
  is_primary?: boolean
}

export interface Email {
  id?: number
  email: string
  type?: string
  is_primary?: boolean
}

export interface Address {
  id?: number
  address: string
  reference?: string | null
  latitude?: number | null
  longitude?: number | null
  is_primary?: boolean
}

export interface Client {
  id: number
  first_name: string | null
  last_name: string | null
  business_name: string | null
  full_name: string
  document_type: string
  document_number: string
  is_active: boolean
  phones?: Phone[]
  emails?: Email[]
  addresses?: Address[]
  created_at?: string
}

export interface ClientPayload {
  first_name?: string
  last_name?: string
  business_name?: string
  document_type: string
  document_number: string
  phones?: Omit<Phone, 'id'>[]
  emails?: Omit<Email, 'id'>[]
  addresses?: Omit<Address, 'id'>[]
}

export async function getClients(page = 1, extraParams?: Record<string, any>): Promise<PaginatedResponse<Client>> {
  const params = { page, ...extraParams }
  const { data } = await api.get<PaginatedResponse<Client>>('/clients', { params })
  return data
}

export async function getClient(id: number): Promise<ApiResponse<Client>> {
  const { data } = await api.get<ApiResponse<Client>>(`/clients/${id}`)
  return data
}

export async function createClient(payload: ClientPayload): Promise<ApiResponse<Client>> {
  const { data } = await api.post<ApiResponse<Client>>('/clients', payload)
  return data
}

export async function updateClient(id: number, payload: Partial<ClientPayload>): Promise<ApiResponse<Client>> {
  const { data } = await api.put<ApiResponse<Client>>(`/clients/${id}`, payload)
  return data
}

export async function deleteClient(id: number): Promise<ApiResponse<null>> {
  const { data } = await api.delete<ApiResponse<null>>(`/clients/${id}`)
  return data
}
