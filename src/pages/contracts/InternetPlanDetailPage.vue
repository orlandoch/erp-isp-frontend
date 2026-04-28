<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import { getInternetPlan } from '@/api/contracts'
import type { InternetPlan } from '@/api/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const plan = ref<InternetPlan | null>(null)
const loading = ref(false)

async function loadPlan() {
  loading.value = true
  try {
    const res = await getInternetPlan(Number(route.params.id))
    plan.value = res.data
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el plan' })
  } finally {
    loading.value = false
  }
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

onMounted(loadPlan)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Detalle del Plan</h1>
      <div class="flex gap-2">
        <Button label="Editar" icon="pi pi-pencil" @click="router.push(`/contracts/internet-plans/${route.params.id}/edit`)" />
        <Button label="Volver" severity="secondary" icon="pi pi-arrow-left" @click="router.push('/contracts/internet-plans')" />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center p-5">
      <ProgressSpinner />
    </div>

    <Card v-if="plan">
      <template #content>
        <div class="grid grid-cols-12 gap-4">
          <!-- Identificación -->
          <div class="col-span-12">
            <h3 class="text-lg font-semibold mb-3">Identificación</h3>
          </div>
          <div class="col-span-3">
            <label class="text-sm text-gray-500">Código</label>
            <p class="font-medium">{{ plan.code }}</p>
          </div>
          <div class="col-span-6">
            <label class="text-sm text-gray-500">Nombre</label>
            <p class="font-medium">{{ plan.name }}</p>
          </div>
          <div class="col-span-3">
            <label class="text-sm text-gray-500">Estado</label>
            <p>
              <Tag :value="plan.is_active ? 'Activo' : 'Inactivo'" :severity="plan.is_active ? 'success' : 'danger'" />
            </p>
          </div>
          <div class="col-span-12" v-if="plan.description">
            <label class="text-sm text-gray-500">Descripción</label>
            <p>{{ plan.description }}</p>
          </div>

          <!-- Técnicas -->
          <div class="col-span-12">
            <h3 class="text-lg font-semibold mb-3 pt-3 border-t border-gray-200">Especificaciones Técnicas</h3>
          </div>
          <div class="col-span-3">
            <label class="text-sm text-gray-500">Tipo de Conexión</label>
            <p class="font-medium">{{ connectionTypeLabel(plan.connection_type) }}</p>
          </div>
          <div class="col-span-2">
            <label class="text-sm text-gray-500">Descarga</label>
            <p class="font-medium">{{ plan.download_speed_mbps }} Mbps</p>
          </div>
          <div class="col-span-2">
            <label class="text-sm text-gray-500">Subida</label>
            <p class="font-medium">{{ plan.upload_speed_mbps }} Mbps</p>
          </div>
          <div class="col-span-2">
            <label class="text-sm text-gray-500">Relación</label>
            <p class="font-medium">{{ plan.contention_ratio || '—' }}</p>
          </div>
          <div class="col-span-3">
            <label class="text-sm text-gray-500">Ciclo Facturación</label>
            <p class="font-medium">{{ cycleLabel(plan.billing_cycle) }}</p>
          </div>

          <!-- Precios -->
          <div class="col-span-12">
            <h3 class="text-lg font-semibold mb-3 pt-3 border-t border-gray-200">Precios</h3>
          </div>
          <div class="col-span-3">
            <label class="text-sm text-gray-500">Precio Mensual</label>
            <p class="font-medium text-xl">${{ parseFloat(plan.monthly_price).toFixed(2) }}</p>
          </div>
          <div class="col-span-3">
            <label class="text-sm text-gray-500">Instalación</label>
            <p class="font-medium">${{ plan.installation_price ? parseFloat(plan.installation_price).toFixed(2) : '0.00' }}</p>
          </div>
          <div class="col-span-3">
            <label class="text-sm text-gray-500">Renta Router</label>
            <p class="font-medium">${{ plan.router_rental_price ? parseFloat(plan.router_rental_price).toFixed(2) : '0.00' }}</p>
          </div>
          <div class="col-span-3">
            <label class="text-sm text-gray-500">IVA</label>
            <p class="font-medium" v-if="plan.iva">{{ plan.iva.name }} ({{ plan.iva.percentage }}%)</p>
          </div>

          <!-- Opciones -->
          <div class="col-span-12">
            <h3 class="text-lg font-semibold mb-3 pt-3 border-t border-gray-200">Opciones</h3>
          </div>
          <div class="col-span-3">
            <i :class="plan.is_sellable ? 'pi pi-check text-green-500' : 'pi pi-times text-gray-400'" class="mr-1"></i>
            <span :class="plan.is_sellable ? '' : 'text-gray-400'">Vendible</span>
          </div>
          <div class="col-span-3">
            <i :class="plan.requires_installation ? 'pi pi-check text-green-500' : 'pi pi-times text-gray-400'" class="mr-1"></i>
            <span :class="plan.requires_installation ? '' : 'text-gray-400'">Requiere Instalación</span>
          </div>
          <div class="col-span-3">
            <i :class="plan.requires_equipment ? 'pi pi-check text-green-500' : 'pi pi-times text-gray-400'" class="mr-1"></i>
            <span :class="plan.requires_equipment ? '' : 'text-gray-400'">Requiere Equipo</span>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
