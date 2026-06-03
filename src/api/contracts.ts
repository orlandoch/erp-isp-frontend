import api from './client'
import type { PaginatedResponse, InternetPlan, Contract, ContractCharge, ContractChangeLog, ContractTemplate, ContractVersion } from './types'

// ============ HELPERS ============

export function getContractPdfUrl(contractId: number): string {
  return `${import.meta.env.VITE_API_URL}/contracts/${contractId}/pdf`
}

export function getContractVersionPdfUrl(contractId: number, versionId: number): string {
  return `${import.meta.env.VITE_API_URL}/contracts/${contractId}/versions/${versionId}/pdf`
}

// ============ PLANTILLAS DE CONTRATO ============

export async function getContractTemplatesList(params?: Record<string, unknown>) {
  const res = await api.get<{ success: boolean; data: ContractTemplate[] }>('/contract-templates', { params })
  return res.data
}

// ============ PLANES DE INTERNET ============

export async function getInternetPlans(params?: Record<string, unknown>) {
  const res = await api.get<PaginatedResponse<InternetPlan>>('/internet-plans', { params })
  return res.data
}

export async function getInternetPlan(id: number) {
  const res = await api.get<{ success: boolean; data: InternetPlan }>(`/internet-plans/${id}`)
  return res.data
}

export async function createInternetPlan(data: Record<string, unknown>) {
  const res = await api.post<{ success: boolean; data: InternetPlan; message: string }>('/internet-plans', data)
  return res.data
}

export async function updateInternetPlan(id: number, data: Record<string, unknown>) {
  const res = await api.put<{ success: boolean; data: InternetPlan; message: string }>(`/internet-plans/${id}`, data)
  return res.data
}

export async function deleteInternetPlan(id: number) {
  const res = await api.delete<{ success: boolean; message: string }>(`/internet-plans/${id}`)
  return res.data
}

export async function activateInternetPlan(id: number) {
  const res = await api.post<{ success: boolean; data: InternetPlan; message: string }>(`/internet-plans/${id}/activate`)
  return res.data
}

export async function deactivateInternetPlan(id: number) {
  const res = await api.post<{ success: boolean; data: InternetPlan; message: string }>(`/internet-plans/${id}/deactivate`)
  return res.data
}

// ============ CONTRATOS ============

export async function getContracts(params?: Record<string, unknown>) {
  const res = await api.get<PaginatedResponse<Contract>>('/contracts', { params })
  return res.data
}

export async function getContract(id: number) {
  const res = await api.get<{ success: boolean; data: Contract }>(`/contracts/${id}`)
  return res.data
}

export async function createContract(data: Record<string, unknown>) {
  const res = await api.post<{ success: boolean; data: Contract; message: string }>('/contracts', data)
  return res.data
}

export async function updateContract(id: number, data: Record<string, unknown>) {
  const res = await api.put<{ success: boolean; data: Contract; message: string }>(`/contracts/${id}`, data)
  return res.data
}

export async function deleteContract(id: number) {
  const res = await api.delete<{ success: boolean; message: string }>(`/contracts/${id}`)
  return res.data
}

export async function activateContract(id: number) {
  const res = await api.post<{ success: boolean; data: Contract; message: string }>(`/contracts/${id}/activate`)
  return res.data
}

export async function suspendContract(id: number, reason?: string) {
  const res = await api.post<{ success: boolean; data: Contract; message: string }>(`/contracts/${id}/suspend`, { reason })
  return res.data
}

export async function cancelContract(id: number, reason: string, cancelPendingCharges = false) {
  const res = await api.post<{ success: boolean; data: Contract; message: string }>(`/contracts/${id}/cancel`, { reason, cancel_pending_charges: cancelPendingCharges })
  return res.data
}

export async function blockContract(id: number, reason?: string) {
  const res = await api.post<{ success: boolean; data: Contract; message: string }>(`/contracts/${id}/block`, { reason })
  return res.data
}

export async function unblockContract(id: number, reason?: string) {
  const res = await api.post<{ success: boolean; data: Contract; message: string }>(`/contracts/${id}/unblock`, { reason })
  return res.data
}

export async function changeContractPlan(id: number, internetPlanId: number, reason?: string) {
  const res = await api.post<{ success: boolean; data: Contract; message: string }>(`/contracts/${id}/change-plan`, { internet_plan_id: internetPlanId, reason })
  return res.data
}

export async function getContractVersions(id: number) {
  const res = await api.get<{ success: boolean; data: ContractVersion[] }>(`/contracts/${id}/versions`)
  return res.data
}

export async function getContractCharges(id: number, params?: Record<string, unknown>) {
  const res = await api.get<{ success: boolean; data: ContractCharge[] }>(`/contracts/${id}/charges`, { params })
  return res.data
}

export async function getContractChangeLogs(id: number) {
  const res = await api.get<{ success: boolean; data: ContractChangeLog[] }>(`/contracts/${id}/change-logs`)
  return res.data
}
