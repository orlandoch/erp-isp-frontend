import api from './client'
import type { ApiResponse } from './types'

export interface EmissionPoint {
  id: number | null
  establishment_id: number | null
  code: string
  name: string
  is_active: boolean
  invoice_sequence: number
  liquidation_sequence: number
  credit_note_sequence: number
  debit_note_sequence: number
  guide_sequence: number
  retention_sequence: number
}

export interface Establishment {
  id: number | null
  issuer_id: number | null
  code: string
  name: string
  address: string
  is_active: boolean
  emission_points: EmissionPoint[]
}

export async function getEstablishments(): Promise<ApiResponse<Establishment[]>> {
  const { data } = await api.get('/establishments')
  return data
}

export async function createEstablishment(payload: Partial<Establishment>): Promise<ApiResponse<Establishment>> {
  const { data } = await api.post('/establishments', payload)
  return data
}

export async function updateEstablishment(id: number, payload: Partial<Establishment>): Promise<ApiResponse<Establishment>> {
  const { data } = await api.put(`/establishments/${id}`, payload)
  return data
}

export async function deleteEstablishment(id: number): Promise<ApiResponse<null>> {
  const { data } = await api.delete(`/establishments/${id}`)
  return data
}

export async function createEmissionPoint(payload: { establishment_id: number; code: string; name: string }): Promise<ApiResponse<EmissionPoint>> {
  const { data } = await api.post('/emission-points', payload)
  return data
}

export async function updateEmissionPoint(id: number, payload: Partial<EmissionPoint>): Promise<ApiResponse<EmissionPoint>> {
  const { data } = await api.put(`/emission-points/${id}`, payload)
  return data
}

export async function deleteEmissionPoint(id: number): Promise<ApiResponse<null>> {
  const { data } = await api.delete(`/emission-points/${id}`)
  return data
}
