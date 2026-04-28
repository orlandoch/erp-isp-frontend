<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import { getContract, getInternetPlans, changeContractPlan } from '@/api/contracts'
import type { Contract, InternetPlan } from '@/api/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const contract = ref<Contract | null>(null)
const plans = ref<InternetPlan[]>([])
const loading = ref(false)
const saving = ref(false)

const newPlanId = ref<number | null>(null)
const reason = ref('')

const selectedPlan = computed(() => {
  if (!newPlanId.value) return null
  return plans.value.find(p => p.id === newPlanId.value) ?? null
})

async function loadData() {
  loading.value = true
  try {
    const [cRes, pRes] = await Promise.all([
      getContract(Number(route.params.id)),
      getInternetPlans({ is_sellable: true, per_page: 500 }),
    ])
    contract.value = cRes.data
    plans.value = pRes.data ?? []
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos' })
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!newPlanId.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un plan' })
    return
  }
  saving.value = true
  try {
    await changeContractPlan(Number(route.params.id), newPlanId.value, reason.value || undefined)
    toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Plan cambiado exitosamente' })
    router.push(`/contracts/contracts/${route.params.id}`)
  } catch (e: any) {
    const msg = e?.response?.data?.message || 'Error al cambiar el plan'
    toast.add({ severity: 'error', summary: 'Error', detail: msg })
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Cambiar Plan — {{ contract?.code }}</h1>
      <Button label="Volver" severity="secondary" icon="pi pi-arrow-left" @click="router.push(`/contracts/contracts/${route.params.id}`)" />
    </div>

    <Card v-if="!loading">
      <template #content>
        <div class="mb-4" v-if="contract?.internet_plan">
          <Message severity="info" :closable="false">
            <strong>Plan actual:</strong> {{ contract.internet_plan.name }} —
            ${{ parseFloat(contract.price_snapshot).toFixed(2) }}/mes —
            {{ contract.download_speed_snapshot_mbps }} Mbps
          </Message>
        </div>

        <form @submit.prevent="save" class="space-y-4">
          <div>
            <label for="new_plan" class="block text-sm font-medium text-gray-700 mb-1">Nuevo Plan *</label>
            <Select id="new_plan" v-model="newPlanId" :options="plans" optionLabel="label" optionValue="id"
              :filter="true" placeholder="Seleccionar nuevo plan..." class="w-full">
              <template #value="{ value }">
                <span v-if="value">
                  {{ plans.find(p => p.id === value)?.code }} — {{ plans.find(p => p.id === value)?.name }}
                  (${{ parseFloat(plans.find(p => p.id === value)?.monthly_price ?? '0').toFixed(2) }})
                </span>
                <span v-else>Seleccionar plan</span>
              </template>
              <template #option="{ option }">
                {{ option.code }} — {{ option.name }} (${{ parseFloat(option.monthly_price).toFixed(2) }}) — {{ option.download_speed_mbps }}Mbps
              </template>
            </Select>
          </div>

          <div v-if="selectedPlan">
            <Message severity="success" :closable="false">
              <div class="grid grid-cols-3 gap-4">
                <div><strong>{{ selectedPlan.download_speed_mbps }} / {{ selectedPlan.upload_speed_mbps }} Mbps</strong></div>
                <div><strong>${{ parseFloat(selectedPlan.monthly_price).toFixed(2) }}/mes</strong></div>
                <div>{{ selectedPlan.connection_type }} — {{ selectedPlan.contention_ratio || '—' }}</div>
              </div>
            </Message>
          </div>

          <div>
            <label for="reason" class="block text-sm font-medium text-gray-700 mb-1">Motivo del Cambio</label>
            <Textarea id="reason" v-model="reason" rows="2" placeholder="Ej: Cliente solicitó mejora de velocidad" class="w-full" />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <Button type="button" label="Cancelar" severity="secondary" @click="router.back()" />
            <Button type="submit" label="Cambiar Plan" :loading="saving" icon="pi pi-sync" severity="info" />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>
