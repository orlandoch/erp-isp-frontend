<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import type { Receivable } from '@/api/receivables'
import { getReceivables } from '@/api/receivables'

const receivables = ref<Receivable[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const perPage = 15

async function load() {
  loading.value = true
  try {
    const res = await getReceivables(page.value)
    receivables.value = res.data
    total.value = res.meta.total
  } finally {
    loading.value = false
  }
}

function onPage(e: { page: number }) {
  page.value = e.page + 1
  load()
}

function statusSeverity(s: string) {
  if (s === 'paid') return 'success'
  if (s === 'pending') return 'warn'
  if (s === 'overdue') return 'danger'
  return 'info'
}

function statusLabel(s: string) {
  const map: Record<string, string> = { pending: 'Pendiente', paid: 'Pagada', overdue: 'Vencida' }
  return map[s] || s
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-gray-900">Cuentas por Cobrar</h1>

    <DataTable
      :value="receivables"
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
      <Column header="Total">
        <template #body="{ data }">${{ Number(data.total_amount).toFixed(2) }}</template>
      </Column>
      <Column header="Pagado">
        <template #body="{ data }">${{ Number(data.paid_amount).toFixed(2) }}</template>
      </Column>
      <Column header="Saldo">
        <template #body="{ data }">${{ Number(data.balance).toFixed(2) }}</template>
      </Column>
      <Column header="Estado">
        <template #body="{ data }">
          <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
        </template>
      </Column>
      <Column field="due_date" header="Vencimiento" />
    </DataTable>
  </div>
</template>
