import api from './client'
import type { Account } from './types'

export async function getAccounts(params?: Record<string, unknown>) {
  const res = await api.get<{ success: boolean; data: Account[] }>('/settings/accounts', { params })
  return res.data
}

export async function getAccount(id: number) {
  const res = await api.get<{ success: boolean; data: Account }>(`/settings/accounts/${id}`)
  return res.data
}
