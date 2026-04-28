<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import type { Invoice } from '@/api/invoices'
import { getInvoices } from '@/api/invoices'

const router = useRouter()
const invoices = ref<Invoice[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const perPage = 15

async function load() {
  loading.value = true
  try {
    const res = await getInvoices(page.value)
    invoices.value = res.data
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
  if (s === 'issued') return 'success'
  if (s === 'draft') return 'warn'
  if (s === 'cancelled') return 'danger'
  return 'info'
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    draft: 'Borrador',
    issued: 'Emitida',
    cancelled: 'Anulada',
  }
  return map[s] || s
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Facturas</h1>
      <Button label="Nueva Factura" icon="pi pi-plus" @click="router.push('/facturas/nueva')" />
    </div>

    <DataTable
      :value="invoices"
      :loading="loading"
      :lazy="true"
      :totalRecords="total"
      :rows="perPage"
      paginator
      @page="onPage"
      stripedRows
      class="p-datatable-sm"
      @row-click="(e: any) => router.push(`/facturas/${e.data.id}`)"
      style="cursor: pointer"
    >
      <Column field="id" header="#" style="width: 60px" />
      <Column field="code" header="Código" />
      <Column header="Cliente">
        <template #body="{ data }">
          {{ data.client?.full_name || '—' }}
        </template>
      </Column>
      <Column header="Estado">
        <template #body="{ data }">
          <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
        </template>
      </Column>
      <Column header="Total">
        <template #body="{ data }">
          ${{ Number(data.total).toFixed(2) }}
        </template>
      </Column>
      <Column field="issue_date" header="Fecha Emisión" />
    </DataTable>
  </div>
</template>
