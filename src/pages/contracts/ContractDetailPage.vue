<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'
import {
  getContract, activateContract, suspendContract, cancelContract,
  blockContract, unblockContract, getContractVersions, getContractCharges, getContractChangeLogs,
} from '@/api/contracts'
import type { Contract, ContractVersion, ContractCharge, ContractChangeLog } from '@/api/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const contract = ref<Contract | null>(null)
const versions = ref<ContractVersion[]>([])
const charges = ref<ContractCharge[]>([])
const changeLogs = ref<ContractChangeLog[]>([])

const loading = ref(false)
const activeTab = ref(0)

async function loadContract() {
  loading.value = true
  try {
    const res = await getContract(Number(route.params.id))
    contract.value = res.data
    if (res.data) {
      const [vRes, cRes, lRes] = await Promise.all([
        getContractVersions(res.data.id),
        getContractCharges(res.data.id),
        getContractChangeLogs(res.data.id),
      ])
      versions.value = vRes.data ?? []
      charges.value = cRes.data ?? []
      changeLogs.value = lRes.data ?? []
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el contrato' })
  } finally {
    loading.value = false
  }
}

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    draft: 'contrast', active: 'success', suspended: 'warn',
    canceled: 'danger', finished: 'info',
  }
  return map[status] ?? 'contrast'
}

function technicalBadge(status: string): string {
  const map: Record<string, string> = {
    pending_installation: 'warn', enabled: 'success', blocked: 'danger', disconnected: 'contrast',
  }
  return map[status] ?? 'contrast'
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: 'Borrador', active: 'Activo', suspended: 'Suspendido',
    canceled: 'Cancelado', finished: 'Finalizado',
  }
  return map[status] ?? status
}

function technicalLabel(status: string): string {
  const map: Record<string, string> = {
    pending_installation: 'Pendiente Instalación', enabled: 'Habilitado',
    blocked: 'Bloqueado', disconnected: 'Desconectado',
  }
  return map[status] ?? status
}

function connectionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    fiber: 'Fibra Óptica', dedicated_fiber: 'Fibra Dedicada', radio: 'Radio Enlace', other: 'Otro'
  }
  return map[type] ?? type
}

function cycleLabel(cycle: string): string {
  const map: Record<string, string> = {
    monthly: 'Mensual', quarterly: 'Trimestral', semiannual: 'Semestral', annual: 'Anual'
  }
  return map[cycle] ?? cycle
}

function chargeTypeLabel(type: string): string {
  const map: Record<string, string> = {
    monthly_service: 'Servicio Mensual',
    installation: 'Instalación',
    router_rental: 'Renta Router',
    adjustment: 'Ajuste',
    other: 'Otro',
  }
  return map[type] ?? type
}

function chargeStatusBadge(status: string): string {
  const map: Record<string, string> = { pending: 'warn', invoiced: 'success', reversed: 'info', canceled: 'contrast' }
  return map[status] ?? 'contrast'
}

function logActionLabel(action: string): string {
  const map: Record<string, string> = {
    contract_created: 'Creado',
    contract_activated: 'Activado',
    contract_suspended: 'Suspendido',
    contract_canceled: 'Cancelado',
    contract_blocked: 'Bloqueado',
    contract_unblocked: 'Desbloqueado',
    contract_plan_changed: 'Cambio de Plan',
    contract_ip_changed: 'Cambio de IP',
    contract_billing_day_changed: 'Cambio Día Facturación',
  }
  return map[action] ?? action
}

// Acciones
function confirmActivate() {
  if (!contract.value) return
  confirm.require({
    message: `¿Activar el contrato ${contract.value.code}?`,
    header: 'Activar Contrato', icon: 'pi pi-check-circle', acceptClass: 'p-button-success',
    accept: async () => {
      try {
        await activateContract(contract.value!.id)
        toast.add({ severity: 'success', summary: 'Activado', detail: 'Contrato activado' })
        await loadContract()
      } catch { toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo activar' }) }
    }
  })
}

function confirmSuspend() {
  if (!contract.value) return
  confirm.require({
    message: `¿Suspender el contrato ${contract.value.code}?`,
    header: 'Suspender', icon: 'pi pi-pause-circle', acceptClass: 'p-button-warning',
    accept: async () => {
      try {
        await suspendContract(contract.value!.id)
        toast.add({ severity: 'warn', summary: 'Suspendido', detail: 'Contrato suspendido' })
        await loadContract()
      } catch { toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo suspender' }) }
    }
  })
}

function confirmCancel() {
  if (!contract.value) return
  confirm.require({
    message: `¿Cancelar el contrato ${contract.value.code}? Esta acción es irreversible.`,
    header: 'Cancelar Contrato', icon: 'pi pi-trash', acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await cancelContract(contract.value!.id, 'Cancelación administrativa')
        toast.add({ severity: 'info', summary: 'Cancelado', detail: 'Contrato cancelado' })
        await loadContract()
      } catch { toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cancelar' }) }
    }
  })
}

function confirmBlock() {
  if (!contract.value) return
  confirm.require({
    message: `¿Bloquear técnicamente el contrato ${contract.value.code}?`,
    header: 'Bloqueo Técnico', icon: 'pi pi-ban', acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await blockContract(contract.value!.id)
        toast.add({ severity: 'warn', summary: 'Bloqueado', detail: 'Contrato bloqueado' })
        await loadContract()
      } catch { toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo bloquear' }) }
    }
  })
}

function confirmUnblock() {
  if (!contract.value) return
  confirm.require({
    message: `¿Desbloquear el contrato ${contract.value.code}?`,
    header: 'Desbloqueo', icon: 'pi pi-check-circle', acceptClass: 'p-button-success',
    accept: async () => {
      try {
        await unblockContract(contract.value!.id)
        toast.add({ severity: 'success', summary: 'Desbloqueado', detail: 'Contrato desbloqueado' })
        await loadContract()
      } catch { toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo desbloquear' }) }
    }
  })
}

onMounted(loadContract)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">
        Contrato {{ contract?.code }}
        <Tag v-if="contract" :value="statusLabel(contract.status)" :severity="statusBadge(contract.status)" class="ml-2" />
        <Tag v-if="contract" :value="technicalLabel(contract.technical_status)" :severity="technicalBadge(contract.technical_status)" class="ml-2" />
      </h1>
      <div class="flex gap-2">
        <Button v-if="contract?.status === 'draft'" icon="pi pi-play" label="Activar" severity="success" @click="confirmActivate" />
        <Button v-if="contract?.status === 'active'" icon="pi pi-pause" label="Suspender" severity="warn" @click="confirmSuspend" />
        <Button v-if="contract?.status === 'active'" icon="pi pi-sync" label="Cambiar Plan" severity="info"
          @click="router.push(`/contracts/contracts/${route.params.id}/change-plan`)" />
        <Button v-if="['active','suspended','draft'].includes(contract?.status ?? '')" icon="pi pi-trash" label="Cancelar" severity="danger" @click="confirmCancel" />
        <Button v-if="contract?.technical_status === 'enabled'" icon="pi pi-ban" label="Bloquear" severity="danger" @click="confirmBlock" />
        <Button v-if="contract?.technical_status === 'blocked'" icon="pi pi-check-circle" label="Desbloquear" severity="success" @click="confirmUnblock" />
        <Button label="Volver" severity="secondary" icon="pi pi-arrow-left" @click="router.push('/contracts/contracts')" />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center p-5">
      <ProgressSpinner />
    </div>

    <Card v-if="contract">
      <template #content>
        <TabView v-model:activeIndex="activeTab">
          <!-- Info General -->
          <TabPanel header="Información">
            <div class="grid grid-cols-12 gap-4">
              <div class="col-span-3">
                <label class="text-sm text-gray-500">Cliente</label>
                <p class="font-medium" v-if="contract.client">{{ contract.client.first_name }} {{ contract.client.last_name }} — {{ contract.client.document_number }}</p>
              </div>
              <div class="col-span-3">
                <label class="text-sm text-gray-500">Plan</label>
                <p class="font-medium" v-if="contract.internet_plan">{{ contract.internet_plan.name }}</p>
                <p v-else class="text-gray-400">—</p>
              </div>
              <div class="col-span-3">
                <label class="text-sm text-gray-500">Velocidad</label>
                <p class="font-medium">{{ contract.download_speed_snapshot_mbps }} / {{ contract.upload_speed_snapshot_mbps }} Mbps</p>
              </div>
              <div class="col-span-3">
                <label class="text-sm text-gray-500">Relación</label>
                <p class="font-medium">{{ contract.contention_ratio_snapshot || '—' }}</p>
              </div>
              <div class="col-span-3">
                <label class="text-sm text-gray-500">Conexión</label>
                <p class="font-medium">{{ connectionTypeLabel(contract.connection_type_snapshot) }}</p>
              </div>
              <div class="col-span-3">
                <label class="text-sm text-gray-500">Ciclo Facturación</label>
                <p class="font-medium">{{ cycleLabel(contract.billing_cycle) }}</p>
              </div>
              <div class="col-span-3">
                <label class="text-sm text-gray-500">Día Facturación</label>
                <p class="font-medium">{{ contract.billing_day || '—' }}</p>
              </div>
              <div class="col-span-3">
                <label class="text-sm text-gray-500">Próxima Facturación</label>
                <p class="font-medium">{{ contract.next_billing_date || '—' }}</p>
              </div>
              <div class="col-span-3">
                <label class="text-sm text-gray-500">Precio Mensual</label>
                <p class="font-medium text-xl">${{ parseFloat(contract.price_snapshot).toFixed(2) }}</p>
              </div>
              <div class="col-span-3">
                <label class="text-sm text-gray-500">Instalación</label>
                <p class="font-medium">${{ contract.installation_price_snapshot ? parseFloat(contract.installation_price_snapshot).toFixed(2) : '0.00' }}</p>
              </div>
              <div class="col-span-3">
                <label class="text-sm text-gray-500">Renta Router</label>
                <p class="font-medium">${{ contract.router_rental_price_snapshot ? parseFloat(contract.router_rental_price_snapshot).toFixed(2) : '0.00' }}</p>
              </div>
              <div class="col-span-6">
                <label class="text-sm text-gray-500">Fechas</label>
                <p class="font-medium">
                  Inicio: {{ contract.start_date }}
                  <span v-if="contract.activated_at"> | Activado: {{ contract.activated_at }}</span>
                  <span v-if="contract.canceled_at"> | Cancelado: {{ contract.canceled_at }}</span>
                </p>
              </div>
            </div>
          </TabPanel>

          <!-- Versiones -->
          <TabPanel header="Versiones">
            <DataTable :value="versions" stripedRows>
              <Column field="version_number" header="#" style="width:60px" />
              <Column header="Plan" style="min-width:160px">
                <template #body="{ data }">
                  {{ data.internet_plan?.name || '—' }}
                </template>
              </Column>
              <Column header="Velocidad" style="min-width:100px">
                <template #body="{ data }">{{ data.download_speed_snapshot_kbps / 1000 }} Mbps</template>
              </Column>
              <Column header="Precio" style="min-width:100px">
                <template #body="{ data }">${{ parseFloat(data.price_snapshot).toFixed(2) }}</template>
              </Column>
              <Column field="reason" header="Motivo" style="min-width:120px" />
              <Column field="start_date" header="Inicio" style="min-width:100px" />
              <Column field="end_date" header="Fin" style="min-width:100px">
                <template #body="{ data }">{{ data.end_date || 'Actual' }}</template>
              </Column>
              <Column header="Activa" style="width:80px">
                <template #body="{ data }">
                  <i :class="data.is_active ? 'pi pi-check text-green-500' : ''"></i>
                </template>
              </Column>
            </DataTable>
          </TabPanel>

          <!-- Cargos -->
          <TabPanel header="Cargos">
            <DataTable :value="charges" stripedRows>
              <Column field="billing_period" header="Período" sortable style="min-width:100px" />
              <Column header="Tipo" style="min-width:140px">
                <template #body="{ data }">{{ chargeTypeLabel(data.charge_type) }}</template>
              </Column>
              <Column field="description" header="Descripción" style="min-width:200px" />
              <Column header="Valor" style="min-width:100px">
                <template #body="{ data }">${{ parseFloat(data.unit_price).toFixed(2) }}</template>
              </Column>
              <Column header="Descuento" style="min-width:90px">
                <template #body="{ data }">${{ parseFloat(data.discount_amount).toFixed(2) }}</template>
              </Column>
              <Column header="Subtotal" style="min-width:100px">
                <template #body="{ data }">${{ parseFloat(data.subtotal).toFixed(2) }}</template>
              </Column>
              <Column header="Estado" style="min-width:100px">
                <template #body="{ data }">
                  <Tag :value="data.status" :severity="chargeStatusBadge(data.status)" />
                </template>
              </Column>
            </DataTable>
          </TabPanel>

          <!-- Historial -->
          <TabPanel header="Historial">
            <DataTable :value="changeLogs" stripedRows>
              <Column header="Acción" style="min-width:160px">
                <template #body="{ data }">{{ logActionLabel(data.action) }}</template>
              </Column>
              <Column field="description" header="Descripción" />
              <Column field="created_at" header="Fecha" style="min-width:160px" />
            </DataTable>
          </TabPanel>

          <!-- PPPoE / IP -->
          <TabPanel header="Red">
            <div class="grid grid-cols-12 gap-4">
              <div class="col-span-4"><label class="text-sm text-gray-500">Usuario PPPoE</label><p class="font-medium">{{ contract.pppoe_username || '—' }}</p></div>
              <div class="col-span-4"><label class="text-sm text-gray-500">Contraseña PPPoE</label><p class="font-medium">••••••••</p></div>
              <div class="col-span-4"><label class="text-sm text-gray-500">Tipo IP</label><p class="font-medium">{{ contract.ip_assignment_type || '—' }}</p></div>
              <div class="col-span-4"><label class="text-sm text-gray-500">IPv4</label><p class="font-medium">{{ contract.ipv4_address || '—' }}</p></div>
              <div class="col-span-4"><label class="text-sm text-gray-500">IPv6</label><p class="font-medium">{{ contract.ipv6_address || '—' }}</p></div>
              <div class="col-span-4"><label class="text-sm text-gray-500">IP Gestión</label><p class="font-medium">{{ contract.management_ip || '—' }}</p></div>
            </div>
          </TabPanel>
        </TabView>
      </template>
    </Card>
  </div>
</template>


