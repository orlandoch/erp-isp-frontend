import api from './client'
import type { ApiResponse, PaginatedResponse } from './types'

export interface User {
  id: number
  name: string
  email: string
}

export interface LoginPayload {
  email: string
  password: string
}

export async function login(payload: LoginPayload): Promise<{ user: User; token: string }> {
  const { data } = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', payload)
  return data.data!
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function me(): Promise<User> {
  const { data } = await api.get<ApiResponse<User>>('/auth/me')
  return data.data!
}
