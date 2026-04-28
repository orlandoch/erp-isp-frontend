import api from './client'
import type { ApiResponse } from './types'

export interface SystemSetting {
  id: number
  key: string
  value: string
  type: string
  group: string
  description: string | null
  is_encrypted: boolean
}

export async function getSettings(group?: string): Promise<ApiResponse<SystemSetting[]>> {
  const params = group ? { group } : {}
  const { data } = await api.get('/settings', { params })
  return data
}

export async function updateSetting(id: number, value: string): Promise<ApiResponse<SystemSetting>> {
  const { data } = await api.put(`/settings/${id}`, { value })
  return data
}

export async function getSettingByKey(settings: SystemSetting[], key: string, fallback = ''): Promise<string> {
  return settings.find(s => s.key === key)?.value ?? fallback
}
