<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import type { ElectronicDocument } from '@/api/electronicDocuments'
import { getElectronicDocuments } from '@/api/electronicDocuments'

const docs = ref<ElectronicDocument[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const perPage = 15

async function load() {
  loading.value = true
  try {
    const res = await getElectronicDocuments(page.value)
    docs.value = res.data
    total.value = res.meta.total
  } finally {
    loading.value = false
  }
}

function onPage(e: { page: number }) {
  page.value = e.page + 1
  load()
}

function internalSeverity(s: string) {
  if (s === 'authorized') return 'success'
  if (s === 'rejected') return 'danger'
  if (s === 'pending_authorization') return 'warn'
  if (s === 'received') return 'info'
  return 'info'
}

function internalLabel(s: string) {
  const map: Record<string, string> = {
    draft: 'Borrador',
    pending_authorization: 'Pendiente',
    received: 'Recibido SRI',
    authorized: 'Autorizado',
    rejected: 'Rechazado',
  }
  return map[s] || s
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-gray-900">Documentos Electrónicos</h1>

    <DataTable
      :value="docs"
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
      <Column field="sequential" header="Sec." style="width: 80px" />
      <Column field="access_key" header="Clave de Acceso" class="font-mono text-xs" />
      <Column header="Estado SRI">
        <template #body="{ data }">
          <Tag :value="internalLabel(data.internal_status)" :severity="internalSeverity(data.internal_status)" />
        </template>
      </Column>
      <Column field="sri_status" header="SRI Status">
        <template #body="{ data }">
          {{ data.sri_status || '—' }}
        </template>
      </Column>
      <Column field="environment" header="Ambiente" style="width: 80px">
        <template #body="{ data }">
          <Tag :value="data.environment === '1' ? 'Pruebas' : 'Prod'" :severity="data.environment === '1' ? 'info' : 'success'" />
        </template>
      </Column>
      <Column field="last_error" header="Último Error">
        <template #body="{ data }">
          <span class="text-xs text-red-600 max-w-xs truncate block">{{ data.last_error || '—' }}</span>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
