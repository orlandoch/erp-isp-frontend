<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import type { Client } from '@/api/clients'
import { getClients } from '@/api/clients'

const router = useRouter()
const clients = ref<Client[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const perPage = 15
const search = ref('')
const debounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// (no extra fields needed)

async function load() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value }
    if (search.value.trim()) {
      params.search = search.value.trim()
    }
    const res = await getClients(page.value, params)
    clients.value = res.data
    total.value = res.meta.total
  } finally {
    loading.value = false
  }
}

function onPage(e: { page: number }) {
  page.value = e.page + 1
  load()
}

function onSearchInput() {
  if (debounceTimer.value) clearTimeout(debounceTimer.value)
  debounceTimer.value = setTimeout(() => {
    page.value = 1
    load()
  }, 400)
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Clientes</h1>
      <Button label="Nuevo Cliente" icon="pi pi-plus" @click="router.push('/clientes/nuevo')" />
    </div>

    <div class="flex items-center gap-2">
      <label for="client-search" class="text-sm font-medium text-gray-700 flex items-center gap-1.5">
        <i class="pi pi-search"></i>
        <span>Buscar:</span>
      </label>
      <InputText
        id="client-search"
        v-model="search"
        placeholder="Nombre o cédula..."
        class="w-full max-w-sm"
        @input="onSearchInput"
      />
    </div>

    <DataTable
      :value="clients"
      :loading="loading"
      :lazy="true"
      :totalRecords="total"
      :rows="perPage"
      paginator
      @page="onPage"
      stripedRows
      class="p-datatable-sm"
      @row-click="(e: any) => router.push(`/clientes/${e.data.id}`)"
      style="cursor: pointer"
    >
      <Column field="id" header="ID" style="width: 80px" sortable />
      <Column field="full_name" header="Nombre/Razón Social" sortable />
      <Column field="document_type" header="Tipo Doc." style="width: 100px" />
      <Column field="document_number" header="Número" style="width: 150px" />
      <Column header="Estado" style="width: 100px">
        <template #body="{ data }">
          <Tag :value="data.is_active ? 'Activo' : 'Inactivo'" :severity="data.is_active ? 'success' : 'danger'" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
