<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Textarea from 'primevue/textarea'
import Calendar from 'primevue/calendar'
import Checkbox from 'primevue/checkbox'
import { getInternetPlan, createInternetPlan, updateInternetPlan } from '@/api/contracts'
import { getIvas } from '@/api/ivas'
import { getAccounts } from '@/api/accounts'
import type { InternetPlan, Iva } from '@/api/types'
import type { Account } from '@/api/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const saving = ref(false)

const ivas = ref<Iva[]>([])
const accountOptions = ref<{ label: string; value: number }[]>([])

const form = ref<Record<string, unknown>>({
  code: '',
  name: '',
  description: '',
  connection_type: 'fiber',
  billing_cycle: 'monthly',
  download_speed_mbps: 100,
  upload_speed_mbps: 100,
  contention_ratio: '4:1',
  monthly_price: 0,
  installation_price: 0,
  router_rental_price: 0,
  iva_id: null,
  income_account_id: null,
  deferred_income_account_id: null,
  is_active: true,
  is_sellable: true,
  requires_installation: true,
  requires_equipment: false,
})

const connectionTypes = [
  { label: 'Fibra Óptica', value: 'fiber' },
  { label: 'Radio Enlace', value: 'radio' },
  { label: 'Fibra Dedicada', value: 'dedicated_fiber' },
  { label: 'Otro', value: 'other' },
]

const billingCycles = [
  { label: 'Mensual', value: 'monthly' },
  { label: 'Trimestral', value: 'quarterly' },
  { label: 'Semestral', value: 'semiannual' },
  { label: 'Anual', value: 'annual' },
]

async function loadData() {
  loading.value = true
  try {
    const [ivasRes, accountsRes] = await Promise.all([
      getIvas(),
      getAccounts(),
    ])
    ivas.value = ivasRes.data ?? []
    const rawAccounts: Account[] = accountsRes.data ?? []
    accountOptions.value = rawAccounts.map(a => ({
      label: `${a.code} — ${a.name}`,
      value: a.id,
    }))

    // Seleccionar IVA por defecto si es creación
    if (!isEdit.value) {
      const defaultIva = ivas.value.find(i => i.is_default)
      if (defaultIva) {
        form.value.iva_id = defaultIva.id
      }
    }

    if (isEdit.value) {
      const res = await getInternetPlan(Number(route.params.id))
      if (res.data) {
        form.value = {
          ...res.data,
          download_speed_mbps: res.data.download_speed_kbps / 1000,
          upload_speed_mbps: res.data.upload_speed_kbps / 1000,
        }
      }
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos' })
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    const payload = {
      ...form.value,
      download_speed_kbps: Number(form.value.download_speed_mbps) * 1000,
      upload_speed_kbps: Number(form.value.upload_speed_mbps) * 1000,
    }
    delete payload.download_speed_mbps
    delete payload.upload_speed_mbps

    if (!payload.iva_id) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un IVA' })
      return
    }

    if (isEdit.value) {
      await updateInternetPlan(Number(route.params.id), payload)
      toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Plan actualizado exitosamente' })
    } else {
      await createInternetPlan(payload)
      toast.add({ severity: 'success', summary: 'Creado', detail: 'Plan creado exitosamente' })
    }
    router.push('/contracts/internet-plans')
  } catch (e: any) {
    const msg = e?.response?.data?.message || 'Error al guardar el plan'
    toast.add({ severity: 'error', summary: 'Error', detail: msg })
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? 'Editar Plan' : 'Nuevo Plan de Internet' }}</h1>
    </div>

    <div v-if="loading" class="text-center py-8 text-gray-500">Cargando...</div>

    <Card v-else>
      <template #title>Información del Plan</template>
      <template #content>
        <form @submit.prevent="save" class="space-y-6">
          <!-- Identificación -->
          <div>
            <h3 class="text-lg font-semibold mb-3 border-b pb-2">Identificación</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-sm font-medium" for="code">Código *</label>
                <InputText id="code" v-model="form.code" class="w-full" required />
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium" for="name">Nombre *</label>
                <InputText id="name" v-model="form.name" class="w-full" required />
              </div>
            </div>
            <div class="space-y-1 mt-4">
              <label class="text-sm font-medium" for="description">Descripción</label>
              <Textarea id="description" v-model="form.description" rows="2" class="w-full" />
            </div>
          </div>

          <!-- Especificaciones Técnicas -->
          <div>
            <h3 class="text-lg font-semibold mb-3 border-b pb-2">Especificaciones Técnicas</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="space-y-1">
                <label class="text-sm font-medium" for="connection_type">Tipo de Conexión *</label>
                <Select id="connection_type" v-model="form.connection_type" :options="connectionTypes" optionLabel="label" optionValue="value" class="w-full" />
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium" for="billing_cycle">Ciclo de Facturación *</label>
                <Select id="billing_cycle" v-model="form.billing_cycle" :options="billingCycles" optionLabel="label" optionValue="value" class="w-full" />
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium" for="contention_ratio">Relación de Contención</label>
                <InputText id="contention_ratio" v-model="form.contention_ratio" placeholder="Ej: 4:1" class="w-full" />
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium">Velocidad Descarga (Mbps) *</label>
                <InputNumber v-model="form.download_speed_mbps" :min="1" :max="100000" class="w-full" />
              </div>
              <div class="space-y-1 md:col-span-1 lg:col-span-1">
                <label class="text-sm font-medium">Velocidad Subida (Mbps) *</label>
                <InputNumber v-model="form.upload_speed_mbps" :min="1" :max="100000" class="w-full" />
              </div>
            </div>
          </div>

          <!-- Precios -->
          <div>
            <h3 class="text-lg font-semibold mb-3 border-b pb-2">Precios</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-1">
                <label class="text-sm font-medium" for="monthly_price">Precio Mensual *</label>
                <InputNumber id="monthly_price" v-model="form.monthly_price" :min="0" mode="currency" currency="USD" class="w-full" />
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium" for="installation_price">Precio Instalación</label>
                <InputNumber id="installation_price" v-model="form.installation_price" :min="0" mode="currency" currency="USD" class="w-full" />
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium" for="router_rental_price">Renta Router</label>
                <InputNumber id="router_rental_price" v-model="form.router_rental_price" :min="0" mode="currency" currency="USD" class="w-full" />
              </div>
            </div>
          </div>

          <!-- Configuración -->
          <div>
            <h3 class="text-lg font-semibold mb-3 border-b pb-2">Configuración Contable</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-1">
                <label class="text-sm font-medium" for="iva_id">IVA *</label>
                <Select id="iva_id" v-model="form.iva_id" :options="ivas" optionLabel="label" optionValue="id" :showClear="true" class="w-full">
                  <template #value="{ value }">
                    <span v-if="value">{{ ivas.find(i => i.id === value)?.name }} ({{ ivas.find(i => i.id === value)?.percentage }}%)</span>
                    <span v-else>Seleccionar IVA</span>
                  </template>
                  <template #option="{ option }">
                    {{ option.name }} ({{ option.percentage }}%)
                  </template>
                </Select>
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium" for="income_account_id">Cuenta Ingresos</label>
                <Select id="income_account_id" v-model="form.income_account_id" :options="accountOptions" optionLabel="label" optionValue="value" :showClear="true" :filter="true" class="w-full">
                  <template #value="{ value }">
                    <span v-if="value">{{ accountOptions.find(a => a.value === value)?.label }}</span>
                    <span v-else>Seleccionar cuenta</span>
                  </template>
                  <template #option="{ option }">
                    {{ option.label }}
                  </template>
                </Select>
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium" for="deferred_income_account_id">Cuenta Ingresos Diferidos</label>
                <Select id="deferred_income_account_id" v-model="form.deferred_income_account_id" :options="accountOptions" optionLabel="label" optionValue="value" :showClear="true" :filter="true" class="w-full">
                  <template #value="{ value }">
                    <span v-if="value">{{ accountOptions.find(a => a.value === value)?.label }}</span>
                    <span v-else>Seleccionar cuenta</span>
                  </template>
                  <template #option="{ option }">
                    {{ option.label }}
                  </template>
                </Select>
              </div>
            </div>
          </div>

          <!-- Opciones -->
          <div>
            <h3 class="text-lg font-semibold mb-3 border-b pb-2">Opciones</h3>
            <div class="flex flex-wrap gap-6">
              <div class="flex items-center gap-2">
                <Checkbox id="is_active" v-model="form.is_active" binary />
                <label for="is_active" class="text-sm">Activo</label>
              </div>
              <div class="flex items-center gap-2">
                <Checkbox id="is_sellable" v-model="form.is_sellable" binary />
                <label for="is_sellable" class="text-sm">Vendible</label>
              </div>
              <div class="flex items-center gap-2">
                <Checkbox id="requires_installation" v-model="form.requires_installation" binary />
                <label for="requires_installation" class="text-sm">Requiere Instalación</label>
              </div>
              <div class="flex items-center gap-2">
                <Checkbox id="requires_equipment" v-model="form.requires_equipment" binary />
                <label for="requires_equipment" class="text-sm">Requiere Equipo</label>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" label="Cancelar" severity="secondary" @click="router.back()" />
            <Button type="submit" label="Guardar" :loading="saving" icon="pi pi-check" />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>
