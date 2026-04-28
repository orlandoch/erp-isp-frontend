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
import Message from 'primevue/message'
import OverlayPanel from 'primevue/overlaypanel'
import { createContract, updateContract, getContract, getInternetPlans } from '@/api/contracts'
import { getClients } from '@/api/clients'
import type { InternetPlan } from '@/api/types'
import type { Client } from '@/api/clients'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const saving = ref(false)

const plans = ref<InternetPlan[]>([])
const clientSearch = ref('')
const clientResults = ref<any[]>([])
const clientSearching = ref(false)
const selectedClient = ref<any>(null)
let clientDebounce: ReturnType<typeof setTimeout> | null = null

async function searchClients() {
  const q = clientSearch.value.trim()
  if (!q || q.length === 0) {
    clientResults.value = []
    return
  }
  clientSearching.value = true
  try {
    const res = await getClients(1, { search: q, per_page: 20 })
    clientResults.value = res.data ?? []
  } catch {
    clientResults.value = []
  } finally {
    clientSearching.value = false
  }
}

function onClientSearchInput() {
  if (clientDebounce) clearTimeout(clientDebounce)
  clientDebounce = setTimeout(searchClients, 400)
}

function pickClient(c: any) {
  selectedClient.value = c
  form.value.client_id = c.id
  clientSearch.value = `${c.first_name ?? ''} ${c.last_name ?? ''} — ${c.document_number ?? ''}`
  clientResults.value = []
}

const form = ref<Record<string, unknown>>({
  client_id: null,
  internet_plan_id: null,
  start_date: new Date().toISOString().split('T')[0],
  billing_day: null,
  billing_cycle: 'monthly',
  pppoe_username: '',
  pppoe_password: '',
  ip_assignment_type: null,
  ipv4_address: '',
  ipv6_address: '',
  management_ip: '',
  notes: '',
})

const billingCycles = [
  { label: 'Mensual', value: 'monthly' },
  { label: 'Trimestral', value: 'quarterly' },
  { label: 'Semestral', value: 'semiannual' },
  { label: 'Anual', value: 'annual' },
]

const ipAssignmentTypes = [
  { label: 'Dinámica', value: 'dynamic' },
  { label: 'Estática', value: 'static' },
  { label: 'Pública Estática', value: 'public_static' },
  { label: 'Privada Estática', value: 'private_static' },
  { label: 'Pool', value: 'pool' },
]

const selectedPlan = computed(() => {
  if (!form.value.internet_plan_id) return null
  return plans.value.find(p => p.id === form.value.internet_plan_id) ?? null
})

async function loadData() {
  loading.value = true
  try {
    const [plansRes] = await Promise.all([
      getInternetPlans({ is_sellable: true, per_page: 500 }),
    ])
    plans.value = plansRes.data ?? []

    if (isEdit.value) {
      const res = await getContract(Number(route.params.id))
      if (res.data) {
        const client = res.data.client
        form.value = {
          client_id: client?.id ?? null,
          internet_plan_id: res.data.internet_plan?.id ?? null,
          start_date: res.data.start_date,
          billing_day: res.data.billing_day,
          billing_cycle: res.data.billing_cycle,
          pppoe_username: '',
          pppoe_password: '',
          ip_assignment_type: null,
          ipv4_address: '',
          ipv6_address: '',
          management_ip: '',
          notes: '',
        }
        if (client) {
          selectedClient.value = client
          clientSearch.value = `${client.first_name ?? ''} ${client.last_name ?? ''} — ${client.document_number ?? ''}`
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
    const payload = { ...form.value }

    // Limpiar campos vacios
    if (!payload.billing_day) payload.billing_day = null
    if (!payload.pppoe_username) delete payload.pppoe_username
    if (!payload.pppoe_password) delete payload.pppoe_password
    if (!payload.ipv4_address) delete payload.ipv4_address
    if (!payload.ipv6_address) delete payload.ipv6_address
    if (!payload.management_ip) delete payload.management_ip
    if (!payload.notes) delete payload.notes

    if (isEdit.value) {
      await updateContract(Number(route.params.id), payload)
      toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Contrato actualizado exitosamente' })
    } else {
      await createContract(payload)
      toast.add({ severity: 'success', summary: 'Creado', detail: 'Contrato creado exitosamente' })
    }
    router.push('/contracts/contracts')
  } catch (e: any) {
    const msg = e?.response?.data?.message || 'Error al guardar el contrato'
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
      <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? 'Editar Contrato' : 'Nuevo Contrato' }}</h1>
    </div>

    <div v-if="loading" class="text-center py-8 text-gray-500">Cargando...</div>

    <Card v-else>
      <template #title>Datos del Contrato</template>
      <template #content>
        <form @submit.prevent="save" class="space-y-6">
          <!-- Cliente y Plan -->
          <div>
            <h3 class="text-lg font-semibold mb-3 border-b pb-2">Cliente y Plan</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1 relative">
                <label class="text-sm font-medium" for="client-search">Cliente *</label>
                <div class="relative">
                  <InputText
                    id="client-search"
                    v-model="clientSearch"
                    @input="onClientSearchInput"
                    placeholder="Buscar cliente (nombre, cédula)..."
                    class="w-full"
                  />
                  <i v-if="clientSearching" class="pi pi-spin pi-spinner absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <i v-if="!clientSearching && selectedClient" class="pi pi-times absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600" @click="selectedClient=null; form.client_id=null; clientSearch=''; clientResults=[]"></i>
                </div>
                <!-- Resultados de búsqueda -->
                <div
                  v-if="clientResults.length > 0"
                  class="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  <div
                    v-for="c in clientResults"
                    :key="c.id"
                    class="px-3 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                    @click="pickClient(c)"
                  >
                    <div class="text-sm font-medium">{{ c.first_name }} {{ c.last_name }}</div>
                    <div class="text-xs text-gray-500">{{ c.document_type === '05' ? 'RUC' : c.document_type === '04' ? 'Cédula' : c.document_type }}: {{ c.document_number }}</div>
                  </div>
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium" for="internet_plan_id">Plan de Internet *</label>
                <Select id="internet_plan_id" v-model="form.internet_plan_id" :options="plans" optionLabel="label" optionValue="id"
                  :filter="true" :showClear="true" placeholder="Buscar plan..." class="w-full">
                  <template #value="{ value }">
                    <span v-if="value">{{ plans.find(p => p.id === value)?.code }} — {{ plans.find(p => p.id === value)?.name }} (${{ parseFloat(plans.find(p => p.id === value)?.monthly_price ?? '0').toFixed(2) }})</span>
                    <span v-else>Seleccionar plan</span>
                  </template>
                  <template #option="{ option }">
                    {{ option.code }} — {{ option.name }} (${{ parseFloat(option.monthly_price).toFixed(2) }})
                  </template>
                </Select>
              </div>
            </div>

            <!-- Detalles del plan seleccionado -->
            <div v-if="selectedPlan" class="mt-4">
              <Message severity="info" :closable="false" class="text-sm">
                <div class="flex flex-wrap gap-4">
                  <span><strong>{{ selectedPlan.download_speed_mbps }} / {{ selectedPlan.upload_speed_mbps }} Mbps</strong> — {{ selectedPlan.connection_type }}</span>
                  <span><strong>${{ parseFloat(selectedPlan.monthly_price).toFixed(2) }}/mes</strong> — Instalación: ${{ selectedPlan.installation_price ? parseFloat(selectedPlan.installation_price).toFixed(2) : 'Gratis' }}</span>
                  <span v-if="selectedPlan.iva">IVA: {{ selectedPlan.iva.name }} ({{ selectedPlan.iva.percentage }}%)</span>
                </div>
              </Message>
            </div>
          </div>

          <!-- Configuración Inicial -->
          <div>
            <h3 class="text-lg font-semibold mb-3 border-b pb-2">Configuración Inicial</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-1">
                <label class="text-sm font-medium" for="start_date">Fecha Inicio *</label>
                <Calendar id="start_date" v-model="form.start_date" dateFormat="yy-mm-dd" showIcon class="w-full" />
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium" for="billing_cycle">Ciclo Facturación *</label>
                <Select id="billing_cycle" v-model="form.billing_cycle" :options="billingCycles" optionLabel="label" optionValue="value" class="w-full" />
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium" for="billing_day">Día de Facturación</label>
                <InputNumber id="billing_day" v-model="form.billing_day" :min="1" :max="31" placeholder="1-31" class="w-full" />
              </div>
            </div>
          </div>

          <!-- Credenciales PPPoE -->
          <div>
            <h3 class="text-lg font-semibold mb-3 border-b pb-2">Credenciales PPPoE</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-sm font-medium" for="pppoe_username">Usuario PPPoE</label>
                <InputText id="pppoe_username" v-model="form.pppoe_username" class="w-full" />
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium" for="pppoe_password">Contraseña PPPoE</label>
                <InputText id="pppoe_password" v-model="form.pppoe_password" type="password" class="w-full" />
              </div>
            </div>
          </div>

          <!-- IP -->
          <div>
            <h3 class="text-lg font-semibold mb-3 border-b pb-2">Asignación de IP</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="space-y-1">
                <label class="text-sm font-medium" for="ip_assignment_type">Tipo IP</label>
                <Select id="ip_assignment_type" v-model="form.ip_assignment_type" :options="ipAssignmentTypes" optionLabel="label" optionValue="value" :showClear="true" class="w-full" />
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium" for="ipv4_address">IPv4</label>
                <InputText id="ipv4_address" v-model="form.ipv4_address" placeholder="192.168.1.1/32" class="w-full" />
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium" for="ipv6_address">IPv6</label>
                <InputText id="ipv6_address" v-model="form.ipv6_address" placeholder="::1/64" class="w-full" />
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium" for="management_ip">IP Gestión</label>
                <InputText id="management_ip" v-model="form.management_ip" placeholder="10.0.0.1/32" class="w-full" />
              </div>
            </div>
          </div>

          <!-- Notas -->
          <div>
            <h3 class="text-lg font-semibold mb-3 border-b pb-2">Notas</h3>
            <div class="space-y-1">
              <Textarea id="notes" v-model="form.notes" rows="3" class="w-full" />
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
