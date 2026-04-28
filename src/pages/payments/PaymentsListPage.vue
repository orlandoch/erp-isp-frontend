<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import type { Payment } from '@/api/payments'
import { getPayments } from '@/api/payments'

const payments = ref<Payment[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const perPage = 15

async function load() {
  loading.value = true
  try {
    const res = await getPayments(page.value)
    payments.value = res.data
    total.value = res.meta.total
  } finally {
    loading.value = false
  }
}

function onPage(e: { page: number }) {
  page.value = e.page + 1
  load()
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-gray-900">Pagos</h1>

    <DataTable
      :value="payments"
      :loading="loading"
      :lazy="true"
      :totalRecords="total"
      :rows="perPage"
      paginator
      @page="onPage"
      stripedRows
      class="p-datatable-sm"
    >
      <Column field="id" header="#" style="width: 60px" />
      <Column header="Cliente">
        <template #body="{ data }">
          {{ data.client?.full_name || '—' }}
        </template>
      </Column>
      <Column header="Factura">
        <template #body="{ data }">
          {{ data.invoice?.code || '—' }}
        </template>
      </Column>
      <Column header="Monto">
        <template #body="{ data }">
          ${{ Number(data.amount).toFixed(2) }}
        </template>
      </Column>
      <Column field="payment_date" header="Fecha" />
      <Column header="Método">
        <template #body="{ data }">
          {{ data.payment_method?.name || '—' }}
        </template>
      </Column>
    </DataTable>
  </div>
</template>
