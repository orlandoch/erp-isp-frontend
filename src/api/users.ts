import api from './client'
import type { ApiResponse, PaginatedResponse } from './types'

export interface User {
  id: number
  name: string
  email: string
  is_active: boolean
  roles?: { id: number; code: string; name: string }[]
  permissions?: string[]
  created_at?: string
  updated_at?: string
}

export interface UserPayload {
  name: string
  email: string
  password?: string
  is_active?: boolean
  roles?: number[]
}

export async function getUsers(params?: { search?: string; per_page?: number; page?: number }): Promise<PaginatedResponse<User>> {
  const { data } = await api.get<ApiResponse<PaginatedResponse<User>>>('/users', { params })
  return data.data!
}

export async function getUser(id: number): Promise<User> {
  const { data } = await api.get<ApiResponse<User>>(`/users/${id}`)
  return data.data!
}

export async function createUser(payload: UserPayload): Promise<User> {
  const { data } = await api.post<ApiResponse<User>>('/users', payload)
  return data.data!
}

export async function updateUser(id: number, payload: Partial<UserPayload>): Promise<User> {
  const { data } = await api.put<ApiResponse<User>>(`/users/${id}`, payload)
  return data.data!
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`)
}
