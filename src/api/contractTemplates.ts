import type { ContractTemplate, ContractTemplateVariable } from './types'

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`

// ===== Plantillas =====

export async function getContractTemplates(params?: Record<string, any>): Promise<{ data: ContractTemplate[] }> {
  const qs = params ? '?' + new URLSearchParams(params as any).toString() : ''
  const res = await fetch(`${BASE}/contract-templates${qs}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  })
  if (!res.ok) throw new Error(`Error fetching templates: ${res.status}`)
  return res.json()
}

export async function getContractTemplate(id: number): Promise<{ data: ContractTemplate }> {
  const res = await fetch(`${BASE}/contract-templates/${id}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  })
  if (!res.ok) throw new Error(`Error fetching template: ${res.status}`)
  return res.json()
}

export async function createContractTemplate(payload: Partial<ContractTemplate>): Promise<{ data: ContractTemplate }> {
  const res = await fetch(`${BASE}/contract-templates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Error creating template: ${res.status}`)
  return res.json()
}

export async function updateContractTemplate(id: number, payload: Partial<ContractTemplate>): Promise<{ data: ContractTemplate }> {
  const res = await fetch(`${BASE}/contract-templates/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Error updating template: ${res.status}`)
  return res.json()
}

export async function deleteContractTemplate(id: number): Promise<void> {
  const res = await fetch(`${BASE}/contract-templates/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  })
  if (!res.ok) throw new Error(`Error deleting template: ${res.status}`)
}

export async function setDefaultContractTemplate(id: number): Promise<{ data: ContractTemplate }> {
  const res = await fetch(`${BASE}/contract-templates/${id}/set-default`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  })
  if (!res.ok) throw new Error(`Error setting default: ${res.status}`)
  return res.json()
}

// ===== Variables =====

export async function getContractTemplateVariables(params?: Record<string, any>): Promise<{ data: ContractTemplateVariable[] }> {
  const qs = params ? '?' + new URLSearchParams(params as any).toString() : ''
  const res = await fetch(`${BASE}/contract-template-variables${qs}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  })
  if (!res.ok) throw new Error(`Error fetching variables: ${res.status}`)
  return res.json()
}

export async function createContractTemplateVariable(payload: Partial<ContractTemplateVariable>): Promise<{ data: ContractTemplateVariable }> {
  const res = await fetch(`${BASE}/contract-template-variables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Error creating variable: ${res.status}`)
  return res.json()
}

export async function updateContractTemplateVariable(id: number, payload: Partial<ContractTemplateVariable>): Promise<{ data: ContractTemplateVariable }> {
  const res = await fetch(`${BASE}/contract-template-variables/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Error updating variable: ${res.status}`)
  return res.json()
}

export async function deleteContractTemplateVariable(id: number): Promise<void> {
  const res = await fetch(`${BASE}/contract-template-variables/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  })
  if (!res.ok) throw new Error(`Error deleting variable: ${res.status}`)
}
