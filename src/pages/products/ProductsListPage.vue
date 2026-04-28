<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import type { Product } from '@/api/products'
import { getProducts } from '@/api/products'

const router = useRouter()
const products = ref<Product[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const perPage = 15

async function load() {
  loading.value = true
  try {
    const res = await getProducts(page.value)
    products.value = res.data
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
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Productos</h1>
      <Button label="Nuevo Producto" icon="pi pi-plus" @click="router.push('/productos/nuevo')" />
    </div>

    <DataTable
      :value="products"
      :loading="loading"
      :lazy="true"
      :totalRecords="total"
      :rows="perPage"
      paginator
      @page="onPage"
      stripedRows
      class="p-datatable-sm"
    >
      <Column field="id" header="ID" style="width: 80px" />
      <Column field="code" header="Código" />
      <Column field="name" header="Nombre" />
      <Column field="item_type" header="Tipo" />
      <Column header="Categoría">
        <template #body="{ data }">
          {{ data.category?.name || '—' }}
        </template>
      </Column>
      <Column header="IVA">
        <template #body="{ data }">
          {{ data.iva?.name || '—' }}
        </template>
      </Column>
      <Column field="price" header="Precio">
        <template #body="{ data }">
          ${{ Number(data.price).toFixed(2) }}
        </template>
      </Column>
      <Column header="Estado">
        <template #body="{ data }">
          <Tag :value="data.is_active ? 'Activo' : 'Inactivo'" :severity="data.is_active ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column header="Acciones" style="width: 120px">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" text severity="secondary" @click="router.push(`/productos/${data.id}/editar`)" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
