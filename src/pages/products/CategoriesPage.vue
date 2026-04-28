<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import InputSwitch from 'primevue/inputswitch'
import { useToast } from 'primevue/usetoast'
import { getProductCategories, type ProductCategory } from '@/api/categories'
import { getIvas } from '@/api/ivas'
import api from '@/api/client'
import { useAccounts } from '@/composables/useAccounts'

const { accounts, loadAccounts } = useAccounts()

const toast = useToast()
const categories = ref<ProductCategory[]>([])
const loading = ref(false)
const flatList = ref<{ label: string; value: number }[]>([])
const ivas = ref<any[]>([])

const dialogVisible = ref(false)
const editing = ref(false)
const saving = ref(false)
const selectedCat = ref<any>({
  name: '',
  parent_id: null,
  iva_id: null,
  description: '',
  is_active: true,
  income_account_id: null,
  expense_account_id: null,
  inventory_account_id: null,
  cogs_account_id: null,
})

function buildTree(cats: ProductCategory[]): ProductCategory[] {
  const map = new Map<number, ProductCategory>()
  const roots: ProductCategory[] = []
  cats.forEach(c => map.set(c.id, { ...c, children: [] }))
  cats.forEach(c => {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children!.push(map.get(c.id)!)
    } else {
      roots.push(map.get(c.id)!)
    }
  })
  return roots
}

function buildFlat(cats: ProductCategory[], prefix = ''): { label: string; value: number }[] {
  let result: { label: string; value: number }[] = []
  for (const c of cats) {
    const label = prefix ? `${prefix} / ${c.name}` : c.name
    result.push({ label, value: c.id })
    if ((c.children as ProductCategory[])?.length) {
      result = result.concat(buildFlat(c.children as ProductCategory[], label))
    }
  }
  return result
}

async function load() {
  loading.value = true
  try {
    const [catsRes, ivasRes] = await Promise.all([
      getProductCategories(1),
      getIvas(),
      loadAccounts(),
    ])
    ivas.value = ivasRes.data.filter((i: any) => i.is_active)
    let allCats: ProductCategory[] = [...(catsRes.data || [])]
    let page = 1
    while (catsRes.meta && page < catsRes.meta.last_page) {
      page++
      const more = await getProductCategories(page)
      allCats = allCats.concat(more.data || [])
    }
    const tree = buildTree(allCats)
    categories.value = tree
    flatList.value = buildFlat(tree)
  } finally {
    loading.value = false
  }
}

function openNew() {
  editing.value = false
  selectedCat.value = {
    name: '',
    parent_id: null,
    iva_id: null,
    description: '',
    is_active: true,
    income_account_id: null,
    expense_account_id: null,
    inventory_account_id: null,
    cogs_account_id: null,
  }
  dialogVisible.value = true
}

function openEdit(cat: ProductCategory) {
  editing.value = true
  selectedCat.value = { ...cat }
  dialogVisible.value = true
}

async function save() {
  if (!selectedCat.value.name) return
  saving.value = true
  try {
    if (editing.value) {
      await api.put(`/product-categories/${selectedCat.value.id}`, selectedCat.value)
      toast.add({ severity: 'success', summary: 'Categoría actualizada', life: 3000 })
    } else {
      await api.post('/product-categories', selectedCat.value)
      toast.add({ severity: 'success', summary: 'Categoría creada', life: 3000 })
    }
    dialogVisible.value = false
    await load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al guardar', life: 5000 })
  } finally {
    saving.value = false
  }
}

async function toggleActive(cat: ProductCategory) {
  try {
    await api.put(`/product-categories/${cat.id}`, { is_active: !cat.is_active })
    await load()
  } catch {
    toast.add({ severity: 'error', summary: 'Error al cambiar estado', life: 3000 })
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Categorías de Productos</h1>
      <Button label="Nueva Categoría" icon="pi pi-plus" @click="openNew" />
    </div>

    <DataTable
      :value="categories"
      :loading="loading"
      stripedRows
      class="p-datatable-sm"
      paginator
      :rows="50"
      :rowsPerPageOptions="[20, 50, 100]"
    >
      <Column field="id" header="ID" style="width: 80px" />
      <Column field="name" header="Nombre" />
      <Column header="Categoría Padre">
        <template #body="{ data }">
          {{ flatList.find(f => f.value === data.parent_id)?.label || '—' }}
        </template>
      </Column>
      <Column header="Subcategorías">
        <template #body="{ data }">
          {{ data.children?.length || 0 }}
        </template>
      </Column>
      <Column header="Estado">
        <template #body="{ data }">
          <Tag :value="data.is_active ? 'Activa' : 'Inactiva'" :severity="data.is_active ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column header="Acciones" style="width: 140px">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" text severity="secondary" @click="openEdit(data)" />
          <Button
            :icon="data.is_active ? 'pi pi-ban' : 'pi pi-check-circle'"
            text
            :severity="data.is_active ? 'danger' : 'success'"
            @click="toggleActive(data)"
          />
        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="dialogVisible"
      :header="editing ? 'Editar Categoría' : 'Nueva Categoría'"
      :style="{ width: '500px' }"
      :modal="true"
    >
      <div class="space-y-4 pt-2">
        <div class="space-y-1">
          <label class="text-sm font-medium">Nombre *</label>
          <InputText v-model="selectedCat.name" class="w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-medium">Categoría Padre</label>
          <Select
            v-model="selectedCat.parent_id"
            :options="flatList"
            optionLabel="label"
            optionValue="value"
            placeholder="Ninguna (raíz)"
            class="w-full"
            filter
          />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-medium">IVA por defecto</label>
          <Select
            v-model="selectedCat.iva_id"
            :options="ivas"
            optionLabel="name"
            optionValue="id"
            placeholder="Sin IVA por defecto"
            class="w-full"
          />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-medium">Descripción</label>
          <Textarea v-model="selectedCat.description" class="w-full" rows="3" />
        </div>
        <div class="flex items-center gap-2">
          <InputSwitch v-model="selectedCat.is_active" />
          <label class="text-sm">Activa</label>
        </div>
        <div class="border-t pt-4">
          <p class="text-sm font-medium mb-2">Cuentas Contables (por defecto)</p>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs">Ingreso</label>
              <Select
                v-model="selectedCat.income_account_id"
                :options="accounts"
                optionLabel="label"
                optionValue="value"
                placeholder="Buscar cuenta..."
                class="w-full"
                filter
                showClear
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs">Gasto</label>
              <Select
                v-model="selectedCat.expense_account_id"
                :options="accounts"
                optionLabel="label"
                optionValue="value"
                placeholder="Buscar cuenta..."
                class="w-full"
                filter
                showClear
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs">Inventario</label>
              <Select
                v-model="selectedCat.inventory_account_id"
                :options="accounts"
                optionLabel="label"
                optionValue="value"
                placeholder="Buscar cuenta..."
                class="w-full"
                filter
                showClear
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs">Costo de Venta</label>
              <Select
                v-model="selectedCat.cogs_account_id"
                :options="accounts"
                optionLabel="label"
                optionValue="value"
                placeholder="Buscar cuenta..."
                class="w-full"
                filter
                showClear
              />
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="dialogVisible = false" />
        <Button label="Guardar" :loading="saving" @click="save" />
      </template>
    </Dialog>
  </div>
</template>
