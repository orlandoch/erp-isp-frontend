<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import { useToast } from 'primevue/usetoast'
import { getInvoice, issueInvoice, type Invoice } from '@/api/invoices'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const invoice = ref<Invoice | null>(null)
const loading = ref(true)
const issuing = ref(false)
const showPaymentDialog = ref(false)

const isDraft = computed(() => invoice.value?.status === 'draft')
const isIssued = computed(() => invoice.value?.status === 'issued')

// Payment form
const paymentForm = ref({
  payment_method_id: 1,
  amount: 0,
  payment_date: new Date().toISOString().split('T')[0],
})

async function handleIssue() {
  issuing.value = true
  try {
    const res = await issueInvoice(invoice.value!.id)
    invoice.value = res.data
    toast.add({ severity: 'success', summary: 'Factura emitida', detail: 'Se generó documento SRI', life: 5000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al emitir', life: 5000 })
  } finally {
    issuing.value = false
  }
}

onMounted(async () => {
  const id = Number(route.params.id)
  try {
    const res = await getInvoice(id)
    invoice.value = res.data
  } finally {
    loading.value = false
  }
})

function statusLabel(s: string) {
  const map: Record<string, string> = { draft: 'Borrador', issued: 'Emitida', cancelled: 'Anulada' }
  return map[s] || s
}

function statusSeverity(s: string) {
  if (s === 'issued') return 'success'
  if (s === 'draft') return 'warn'
  if (s === 'cancelled') return 'danger'
  return 'info'
}
</script>

<template>
  <div v-if="loading" class="text-center py-8 text-gray-500">Cargando...</div>
  <div v-else-if="invoice" class="space-y-6">
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Factura #{{ invoice.code }}</h1>
        <p class="text-sm text-gray-500 mt-1">
          Cliente: <strong>{{ invoice.client?.full_name || '—' }}</strong>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Tag :value="statusLabel(invoice.status)" :severity="statusSeverity(invoice.status)" class="text-sm" />
        <Button v-if="isDraft" :loading="issuing" label="Emitir Factura" icon="pi pi-send" severity="success" @click="handleIssue" />
        <Button label="Volver" icon="pi pi-arrow-left" text @click="router.push('/facturas')" />
      </div>
    </div>

    <Card>
      <template #title>Detalle de Productos</template>
      <template #content>
        <DataTable :value="invoice.items || []" stripedRows class="p-datatable-sm">
          <Column field="description" header="Descripción" />
          <Column field="quantity" header="Cantidad" style="width: 100px" />
          <Column field="unit_price" header="P. Unit." style="width: 120px">
            <template #body="{ data }">${{ Number(data.unit_price).toFixed(2) }}</template>
          </Column>
          <Column field="subtotal" header="Subtotal" style="width: 120px">
            <template #body="{ data }">${{ Number(data.subtotal).toFixed(2) }}</template>
          </Column>
          <Column field="tax_rate" header="IVA %" style="width: 80px">
            <template #body="{ data }">{{ data.tax_rate }}%</template>
          </Column>
          <Column field="tax_amount" header="IVA" style="width: 100px">
            <template #body="{ data }">${{ Number(data.tax_amount).toFixed(2) }}</template>
          </Column>
          <Column field="total" header="Total" style="width: 120px">
            <template #body="{ data }">${{ Number(data.total).toFixed(2) }}</template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Card>
      <template #content>
        <div class="flex justify-end">
          <div class="space-y-2 text-right">
            <div class="text-sm">
              <span class="text-gray-500">Subtotal:</span>
              <span class="ml-4 font-medium">${{ Number(invoice.subtotal).toFixed(2) }}</span>
            </div>
            <div v-if="Number(invoice.discount_total) > 0" class="text-sm">
              <span class="text-gray-500">Descuento:</span>
              <span class="ml-4 font-medium text-red-600">-${{ Number(invoice.discount_total).toFixed(2) }}</span>
            </div>
            <div class="text-sm">
              <span class="text-gray-500">IVA:</span>
              <span class="ml-4 font-medium">${{ Number(invoice.tax_total).toFixed(2) }}</span>
            </div>
            <div class="text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span class="ml-4">${{ Number(invoice.total).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
