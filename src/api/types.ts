export interface ApiResponse<T> {
  success: boolean
  data: T | null
  message?: string
  errors?: unknown
}

export interface PaginationMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: PaginationMeta
  message?: string
}

// ============ CONTRACTS / INTERNET PLANS ============

export interface InternetPlan {
  id: number
  code: string
  name: string
  description: string | null
  connection_type: string
  billing_cycle: string
  download_speed_kbps: number
  upload_speed_kbps: number
  download_speed_mbps: number
  upload_speed_mbps: number
  contention_ratio: string | null
  monthly_price: string
  installation_price: string | null
  router_rental_price: string | null
  iva: { id: number; name: string; percentage: number } | null
  income_account_id: number | null
  deferred_income_account_id: number | null
  is_active: boolean
  is_sellable: boolean
  requires_installation: boolean
  requires_equipment: boolean
  created_at: string
  updated_at: string
}

export interface Contract {
  id: number
  code: string
  client: { id: number; first_name: string; last_name: string; document_number: string } | null
  internet_plan: { id: number; code: string; name: string } | null
  contract_template_id: number | null
  status: string
  technical_status: string
  start_date: string
  end_date: string | null
  activated_at: string | null
  canceled_at: string | null
  billing_day: number | null
  next_billing_date: string | null
  billing_cycle: string
  price_snapshot: string
  installation_price_snapshot: string | null
  router_rental_price_snapshot: string | null
  download_speed_snapshot_kbps: number
  upload_speed_snapshot_kbps: number
  download_speed_snapshot_mbps: number
  upload_speed_snapshot_mbps: number
  contention_ratio_snapshot: string | null
  connection_type_snapshot: string
  service_location: Record<string, unknown> | null
  current_version: ContractVersion | null
  created_at: string
  updated_at: string
}

export interface ContractVersion {
  id: number
  contract_id: number
  version_number: number
  internet_plan: { id: number; code: string; name: string } | null
  price_snapshot: string
  download_speed_snapshot_kbps: number
  upload_speed_snapshot_kbps: number
  billing_cycle: string
  connection_type_snapshot: string
  rendered_contract_text: string | null
  reason: string
  is_active: boolean
  start_date: string
  end_date: string | null
  created_at: string
}

export interface ContractCharge {
  id: number
  contract_id: number
  period_start: string
  period_end: string
  billing_period: string
  charge_type: string
  description: string
  quantity: string
  unit_price: string
  discount_amount: string
  subtotal: string
  status: string
  invoice_id: number | null
  created_at: string
}

export interface ContractChangeLog {
  id: number
  contract_id: number
  action: string
  description: string | null
  created_at: string
}

// ============ IVA ============

export interface Iva {
  id: number
  name: string
  code: string
  percentage: number
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

// ============ CUENTAS CONTABLES ============

export interface Account {
  id: number
  code: string
  name: string
  account_type: string
  normal_balance: string
  is_group: boolean
  level: number
  parent_id: number | null
  created_at: string
  updated_at: string


// ============ PLANTILLAS DE CONTRATO ============

export interface ContractTemplate {
  id: number
  name: string
  code: string
  description: string | null
  content: string
  body: string | null
  is_active: boolean
  is_default: boolean
  variables?: string[]
  created_by?: number | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface ContractTemplateVariable {
  id: number
  key: string
  label: string
  description?: string | null
  group: string
  data_type?: string
  example_value?: string | null
  is_active: boolean
  sort_order: number
  token: string
  created_at?: string
  updated_at?: string
}
