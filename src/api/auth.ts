import api from './client'
import type { ApiResponse, PaginatedResponse } from './types'

export interface User {
  id: number
  name: string
  email: string
  is_active?: boolean
  roles?: string[]
  permissions?: string[]
  created_at?: string
  updated_at?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
  roles: string[]
  permissions: string[]
}

export interface MeResponse {
  user: User
  roles: string[]
  permissions: string[]
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', payload)
  return data.data!
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function me(): Promise<MeResponse> {
  const { data } = await api.get<ApiResponse<MeResponse>>('/auth/me')
  return data.data!
}
