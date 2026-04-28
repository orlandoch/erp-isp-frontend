<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import InputIcon from 'primevue/inputicon'
import IconField from 'primevue/iconfield'
import Select from 'primevue/select'
import { getContracts, activateContract, suspendContract, cancelContract, blockContract, unblockContract } from '@/api/contracts'
import type { Contract } from '@/api/types'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const contracts = ref<Contract[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const perPage = ref(20)
const search = ref('')
const statusFilter = ref('')
const technicalStatusFilter = ref('')
let searchDebounce: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    page.value = 1
    loadContracts()
  }, 400)
}

async function loadContracts() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      per_page: perPage.value,
      page: page.value,
    }
    if (search.value) params.search = search.value
    if (statusFilter.value) params.status = statusFilter.value
    if (technicalStatusFilter.value) params.technical_status = technicalStatusFilter.value

    const res = await getContracts(params)
    contracts.value = res.data ?? []
    total.value = res.meta?.total ?? 0
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los contratos' })
  } finally {
    loading.value = false
  }
}

function goCreate() {
  router.push('/contracts/contracts/new')
}

function goDetail(id: number) {
  router.push(`/contracts/contracts/${id}`)
}

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    draft: 'contrast',
    active: 'success',
    suspended: 'warn',
    canceled: 'danger',
    finished: 'info',
  }
  return map[status] ?? 'contrast'
}

function technicalBadge(status: string): string {
  const map: Record<string, string> = {
    pending_installation: 'warn',
    enabled: 'success',
    blocked: 'danger',
    disconnected: 'contrast',
  }
  return map[status] ?? 'contrast'
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: 'Borrador',
    active: 'Activo',
    suspended: 'Suspendido',
    canceled: 'Cancelado',
    finished: 'Finalizado',
  }
  return map[status] ?? status
}

function technicalLabel(status: string): string {
  const map: Record<string, string> = {
    pending_installation: 'Pendiente Instalación',
    enabled: 'Habilitado',
    blocked: 'Bloqueado',
    disconnected: 'Desconectado',
  }
  return map[status] ?? status
}

function cycleLabel(cycle: string): string {
  const map: Record<string, string> = {
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    semiannual: 'Semestral',
    annual: 'Anual'
  }
  return map[cycle] ?? cycle
}

// Acciones
function confirmActivate(contract: Contract) {
  confirm.require({
    message: `¿Activar el contrato "${contract.code}"?`,
    header: 'Activar Contrato',
    icon: 'pi pi-check-circle',
    acceptClass: 'p-button-success',
    accept: async () => {
      try {
        await activateContract(contract.id)
        toast.add({ severity: 'success', summary: 'Activado', detail: `Contrato ${contract.code} activado` })
        await loadContracts()
      } catch { toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo activar el contrato' }) }
    }
  })
}

function confirmSuspend(contract: Contract) {
  confirm.require({
    message: `¿Suspender el contrato "${contract.code}"?`,
    header: 'Suspender Contrato',
    icon: 'pi pi-pause-circle',
    acceptClass: 'p-button-warning',
    accept: async () => {
      try {
        await suspendContract(contract.id)
        toast.add({ severity: 'warn', summary: 'Suspendido', detail: `Contrato ${contract.code} suspendido` })
        await loadContracts()
      } catch { toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo suspender' }) }
    }
  })
}

function confirmCancel(contract: Contract) {
  confirm.require({
    message: `¿Cancelar el contrato "${contract.code}"? Esta acción no se puede deshacer.`,
    header: 'Cancelar Contrato',
    icon: 'pi pi-trash',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await cancelContract(contract.id, 'Cancelación administrativa')
        toast.add({ severity: 'info', summary: 'Cancelado', detail: `Contrato ${contract.code} cancelado` })
        await loadContracts()
      } catch { toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cancelar' }) }
    }
  })
}

function confirmBlock(contract: Contract) {
  confirm.require({
    message: `¿Bloquear técnicamente el contrato "${contract.code}"?`,
    header: 'Bloqueo Técnico',
    icon: 'pi pi-ban',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await blockContract(contract.id)
        toast.add({ severity: 'warn', summary: 'Bloqueado', detail: `Contrato ${contract.code} bloqueado` })
        await loadContracts()
      } catch { toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo bloquear' }) }
    }
  })
}

function confirmUnblock(contract: Contract) {
  confirm.require({
    message: `¿Desbloquear el contrato "${contract.code}"?`,
    header: 'Desbloqueo Técnico',
    icon: 'pi pi-check-circle',
    acceptClass: 'p-button-success',
    accept: async () => {
      try {
        await unblockContract(contract.id)
        toast.add({ severity: 'success', summary: 'Desbloqueado', detail: `Contrato ${contract.code} desbloqueado` })
        await loadContracts()
      } catch { toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo desbloquear' }) }
    }
  })
}

onMounted(loadContracts)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Contratos</h1>
      <Button label="Nuevo Contrato" icon="pi pi-plus" @click="goCreate" />
    </div>

    <!-- Filtros -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <IconField iconPosition="left" class="w-full">
          <InputIcon class="pi pi-search" />
          <InputText v-model="search" placeholder="Buscar por cliente..." @input="onSearchInput" class="w-full" />
        </IconField>
      </div>
      <div>
        <Select v-model="statusFilter" :options="[
          { label: 'Todos los estados', value: '' },
          { label: 'Borrador', value: 'draft' },
          { label: 'Activo', value: 'active' },
          { label: 'Suspendido', value: 'suspended' },
          { label: 'Cancelado', value: 'canceled' },
          { label: 'Finalizado', value: 'finished' },
        ]" optionLabel="label" optionValue="value" placeholder="Estado" class="w-full" @change="loadContracts" />
      </div>
      <div>
        <Select v-model="technicalStatusFilter" :options="[
          { label: 'Todos técnicos', value: '' },
          { label: 'Pendiente Instalación', value: 'pending_installation' },
          { label: 'Habilitado', value: 'enabled' },
          { label: 'Bloqueado', value: 'blocked' },
          { label: 'Desconectado', value: 'disconnected' },
        ]" optionLabel="label" optionValue="value" placeholder="Estado Técnico" class="w-full" @change="loadContracts" />
      </div>
    </div>

    <DataTable :value="contracts" :loading="loading" stripedRows paginator :rows="perPage" :totalRecords="total" :lazy="true"
      @page="(e: any) => { page = e.page + 1; loadContracts() }" sortField="created_at" :sortOrder="-1">
      <Column header="Identificación" sortable style="min-width:160px">
        <template #body="{ data }">
          <span v-if="data.client">{{ data.client.document_number }}</span>
          <span v-else class="text-gray-400">—</span>
        </template>
      </Column>
      <Column header="Cliente" sortable style="min-width:220px">
        <template #body="{ data }">
          <span v-if="data.client">{{ data.client.first_name }} {{ data.client.last_name }}</span>
          <span v-else class="text-gray-400">—</span>
        </template>
      </Column>
      <Column header="Plan" style="min-width:200px">
        <template #body="{ data }">
          <span v-if="data.internet_plan">{{ data.internet_plan.code }} — {{ data.internet_plan.name }}</span>
          <span v-else class="text-gray-400">—</span>
        </template>
      </Column>
      <Column header="Velocidad" style="min-width:100px">
        <template #body="{ data }">
          {{ data.download_speed_snapshot_mbps }} Mbps
        </template>
      </Column>
      <Column field="price_snapshot" header="Precio" sortable style="min-width:100px">
        <template #body="{ data }">
          ${{ parseFloat(data.price_snapshot).toFixed(2) }}
        </template>
      </Column>
      <Column field="billing_cycle" header="Ciclo" style="min-width:90px">
        <template #body="{ data }">
          {{ cycleLabel(data.billing_cycle) }}
        </template>
      </Column>
      <Column header="Estado" style="min-width:120px">
        <template #body="{ data }">
          <Tag :value="statusLabel(data.status)" :severity="statusBadge(data.status)" />
        </template>
      </Column>
      <Column header="Técnico" style="min-width:130px">
        <template #body="{ data }">
          <Tag :value="technicalLabel(data.technical_status)" :severity="technicalBadge(data.technical_status)" />
        </template>
      </Column>
      <Column header="Acciones" style="min-width:250px">
        <template #body="{ data }">
          <div class="flex gap-1 flex-wrap">
            <Button icon="pi pi-eye" severity="info" text rounded @click="goDetail(data.id)" v-tooltip.top="'Ver detalle'" />

            <!-- Activar (solo draft) -->
            <Button v-if="data.status === 'draft'" icon="pi pi-play" severity="success" text rounded
              @click="confirmActivate(data)" v-tooltip.top="'Activar'" />

            <!-- Suspender (solo active) -->
            <Button v-if="data.status === 'active'" icon="pi pi-pause" severity="warn" text rounded
              @click="confirmSuspend(data)" v-tooltip.top="'Suspender'" />

            <!-- Cancelar (solo active/suspended/draft) -->
            <Button v-if="['active','suspended','draft'].includes(data.status)" icon="pi pi-trash" severity="danger" text rounded
              @click="confirmCancel(data)" v-tooltip.top="'Cancelar'" />

            <!-- Bloquear (solo enabled) -->
            <Button v-if="data.technical_status === 'enabled'" icon="pi pi-ban" severity="danger" text rounded
              @click="confirmBlock(data)" v-tooltip.top="'Bloquear'" />

            <!-- Desbloquear (solo blocked) -->
            <Button v-if="data.technical_status === 'blocked'" icon="pi pi-check-circle" severity="success" text rounded
              @click="confirmUnblock(data)" v-tooltip.top="'Desbloquear'" />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
