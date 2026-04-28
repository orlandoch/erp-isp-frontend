import api from './client'
import type { ApiResponse } from './types'

export interface Role {
  id: number
  code: string
  name: string
  description: string | null
  guard_name: string
  users_count?: number
  permissions_count?: number
  permissions?: Permission[]
  created_at?: string
  updated_at?: string
}

export interface Permission {
  id: number
  code: string
  name: string
  module: string
  description: string | null
  guard_name: string
}

export interface RolePayload {
  code: string
  name: string
  description?: string
}

export async function getRoles(): Promise<Role[]> {
  const { data } = await api.get<ApiResponse<Role[]>>('/roles')
  return data.data!
}

export async function getRole(id: number): Promise<Role> {
  const { data } = await api.get<ApiResponse<Role>>(`/roles/${id}`)
  return data.data!
}

export async function createRole(payload: RolePayload): Promise<Role> {
  const { data } = await api.post<ApiResponse<Role>>('/roles', payload)
  return data.data!
}

export async function updateRole(id: number, payload: Partial<RolePayload>): Promise<Role> {
  const { data } = await api.put<ApiResponse<Role>>(`/roles/${id}`, payload)
  return data.data!
}

export async function deleteRole(id: number): Promise<void> {
  await api.delete(`/roles/${id}`)
}

export async function syncRolePermissions(id: number, permissionIds: number[]): Promise<Role> {
  const { data } = await api.post<ApiResponse<Role>>(`/roles/${id}/permissions`, { permissions: permissionIds })
  return data.data!
}

export interface PermissionsCatalog {
  [module: string]: Permission[]
}

export async function getPermissionsCatalog(): Promise<PermissionsCatalog> {
  const { data } = await api.get<ApiResponse<PermissionsCatalog>>('/permissions/catalog')
  return data.data!
}
