<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Tooltip from 'primevue/tooltip'
import { getInternetPlans, activateInternetPlan, deactivateInternetPlan } from '@/api/contracts'
import type { InternetPlan } from '@/api/types'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const plans = ref<InternetPlan[]>([])
const loading = ref(false)

async function loadPlans() {
  loading.value = true
  try {
    const res = await getInternetPlans({ per_page: 100 })
    plans.value = res.data ?? []
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los planes' })
  } finally {
    loading.value = false
  }
}

function goCreate() {
  router.push('/contracts/internet-plans/new')
}

function goEdit(id: number) {
  router.push(`/contracts/internet-plans/${id}/edit`)
}

function goDetail(id: number) {
  router.push(`/contracts/internet-plans/${id}`)
}

function confirmActivate(plan: InternetPlan) {
  confirm.require({
    message: `¿Activar el plan "${plan.name}"?`,
    header: 'Activar Plan',
    icon: 'pi pi-check-circle',
    acceptClass: 'p-button-success',
    accept: async () => {
      try {
        await activateInternetPlan(plan.id)
        toast.add({ severity: 'success', summary: 'Activado', detail: `Plan "${plan.name}" activado` })
        await loadPlans()
      } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo activar el plan' })
      }
    }
  })
}

function confirmDeactivate(plan: InternetPlan) {
  confirm.require({
    message: `¿Desactivar el plan "${plan.name}"? Los contratos existentes no se verán afectados.`,
    header: 'Desactivar Plan',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-warning',
    accept: async () => {
      try {
        await deactivateInternetPlan(plan.id)
        toast.add({ severity: 'warn', summary: 'Desactivado', detail: `Plan "${plan.name}" desactivado` })
        await loadPlans()
      } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo desactivar el plan' })
      }
    }
  })
}

function connectionTypeBadge(type: string): string {
  const map: Record<string, string> = {
    fiber: 'info',
    dedicated_fiber: 'success',
    radio: 'warn',
    other: 'contrast'
  }
  return map[type] ?? 'contrast'
}

function connectionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    fiber: 'Fibra Óptica',
    dedicated_fiber: 'Fibra Dedicada',
    radio: 'Radio Enlace',
    other: 'Otro'
  }
  return map[type] ?? type
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

onMounted(loadPlans)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Planes de Internet</h1>
      <Button label="Nuevo Plan" icon="pi pi-plus" @click="goCreate" />
    </div>

    <DataTable :value="plans" :loading="loading" stripedRows paginator :rows="20" sortField="code" :sortOrder="1">
      <Column field="code" header="Código" sortable style="min-width:140px" />
      <Column field="name" header="Nombre" sortable style="min-width:200px" />
      <Column field="connection_type" header="Tipo" sortable style="min-width:130px">
        <template #body="{ data }">
          <Tag :value="connectionTypeLabel(data.connection_type)" :severity="connectionTypeBadge(data.connection_type)" />
        </template>
      </Column>
      <Column header="Velocidad" style="min-width:140px">
        <template #body="{ data }">
          {{ data.download_speed_mbps }} / {{ data.upload_speed_mbps }} Mbps
        </template>
      </Column>
      <Column header="Relación" style="min-width:90px">
        <template #body="{ data }">
          {{ data.contention_ratio || '—' }}
        </template>
      </Column>
      <Column field="monthly_price" header="Precio Mensual" sortable style="min-width:120px">
        <template #body="{ data }">
          ${{ parseFloat(data.monthly_price).toFixed(2) }}
        </template>
      </Column>
      <Column field="billing_cycle" header="Ciclo" sortable style="min-width:100px">
        <template #body="{ data }">
          {{ cycleLabel(data.billing_cycle) }}
        </template>
      </Column>
      <Column field="is_active" header="Estado" sortable style="min-width:100px">
        <template #body="{ data }">
          <Tag :value="data.is_active ? 'Activo' : 'Inactivo'" :severity="data.is_active ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column field="is_sellable" header="Vendible" sortable style="min-width:100px">
        <template #body="{ data }">
          <i :class="data.is_sellable ? 'pi pi-check text-green-500' : 'pi pi-times text-gray-400'"></i>
        </template>
      </Column>
      <Column header="Acciones" style="min-width:200px">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button icon="pi pi-eye" severity="info" text rounded @click="goDetail(data.id)" v-tooltip.top="'Ver detalle'" />
            <Button icon="pi pi-pencil" severity="secondary" text rounded @click="goEdit(data.id)" v-tooltip.top="'Editar'" />
            <Button
              v-if="data.is_active"
              icon="pi pi-pause-circle"
              severity="warn"
              text rounded
              @click="confirmDeactivate(data)"
              v-tooltip.top="'Desactivar'"
            />
            <Button
              v-else
              icon="pi pi-play-circle"
              severity="success"
              text rounded
              @click="confirmActivate(data)"
              v-tooltip.top="'Activar'"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
