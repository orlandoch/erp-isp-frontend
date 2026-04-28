<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import InputSwitch from 'primevue/inputswitch'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import ConfirmDialog from 'primevue/confirmdialog'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { createProduct, updateProduct, getProduct } from '@/api/products'
import { getIvas } from '@/api/ivas'
import { getProductCategories, type ProductCategory } from '@/api/categories'
import { useAccounts } from '@/composables/useAccounts'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const isEdit = !!route.params.id
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const { accounts, loadAccounts } = useAccounts()

const ivas = ref<any[]>([])
const categories = ref<ProductCategory[]>([])
const flatCategories = ref<{ label: string; value: number }[]>([])
// (no extra refs needed; confirm dialog uses useConfirm)

const form = ref({
  name: '',
  code: '',
  item_type: 'service',
  unit: 'unit',
  price: 0,
  cost: 0,
  is_sellable: true,
  is_purchasable: false,
  is_inventory_controlled: false,
  has_serial: false,
  category_id: null as number | null,
  iva_id: null as number | null,
  income_account_id: null as number | null,
  expense_account_id: null as number | null,
  inventory_account_id: null as number | null,
  cogs_account_id: null as number | null,
})

function buildFlatTree(cats: ProductCategory[], prefix = ''): { label: string; value: number }[] {
  let result: { label: string; value: number }[] = []
  for (const c of cats) {
    const label = prefix ? `${prefix} / ${c.name}` : c.name
    result.push({ label, value: c.id })
    if (c.children?.length) {
      result = result.concat(buildFlatTree(c.children, label))
    }
  }
  return result
}

onMounted(async () => {
  loading.value = true
  try {
    const [ivasRes, catsRes] = await Promise.all([
      getIvas(),
      getProductCategories(1),
      loadAccounts(),
    ])
    ivas.value = ivasRes.data.filter((i: any) => i.is_active)

    // Load all categories recursively
    let allCats: ProductCategory[] = [...(catsRes.data || [])]
    let currentPage = 1
    while (catsRes.meta && currentPage < catsRes.meta.last_page) {
      currentPage++
      const more = await getProductCategories(currentPage)
      allCats = allCats.concat(more.data || [])
    }
    categories.value = allCats
    flatCategories.value = buildFlatTree(allCats)

    if (isEdit) {
      const res = await getProduct(Number(route.params.id))
      const p = res.data!
      form.value = {
        name: p.name,
        code: p.code || '',
        item_type: p.item_type,
        unit: p.unit,
        price: p.price,
        cost: p.cost || 0,
        is_sellable: p.is_sellable,
        is_purchasable: p.is_purchasable,
        is_inventory_controlled: p.is_inventory_controlled,
        has_serial: p.has_serial,
        category_id: p.category_id,
        iva_id: p.iva_id,
        income_account_id: p.income_account_id,
        expense_account_id: p.expense_account_id,
        inventory_account_id: p.inventory_account_id,
        cogs_account_id: p.cogs_account_id,
      }
    } else {
      // Set default IVA
      const defaultIva = ivas.value.find((i: any) => i.is_default)
      if (defaultIva) form.value.iva_id = defaultIva.id
    }
  } finally {
    loading.value = false
  }
})

function hasAnyAccountValue(acc: any): boolean {
  return !!(acc.income_account_id || acc.expense_account_id || acc.inventory_account_id || acc.cogs_account_id)
}

function applyCategoryAccounts(cat: ProductCategory) {
  if (cat.income_account_id != null) form.value.income_account_id = cat.income_account_id
  if (cat.expense_account_id != null) form.value.expense_account_id = cat.expense_account_id
  if (cat.inventory_account_id != null) form.value.inventory_account_id = cat.inventory_account_id
  if (cat.cogs_account_id != null) form.value.cogs_account_id = cat.cogs_account_id
  if (cat.iva_id != null) form.value.iva_id = cat.iva_id
}

function accountsDiffer(current: typeof form.value, cat: ProductCategory): boolean {
  const fields = ['income_account_id', 'expense_account_id', 'inventory_account_id', 'cogs_account_id'] as const
  return fields.some(f => {
    const curVal = current[f] as number | null
    const catVal = (cat as any)[f] as number | null
    // Only consider differing if category has a value AND current has a value AND they differ
    return catVal != null && curVal != null && curVal !== catVal
  })
}

async function onCategoryChange() {
  const cat = categories.value.find(c => c.id === form.value.category_id)
  if (!cat) return

  const hasExisting = hasAnyAccountValue(form.value)
  const catHasAccounts = hasAnyAccountValue(cat)

  // No category accounts defined -> nothing to apply
  if (!catHasAccounts) return

  // Current accounts are empty -> apply silently
  if (!hasExisting) {
    applyCategoryAccounts(cat)
    return
  }

  // Current accounts exist and differ from category -> prompt
  if (!accountsDiffer(form.value, cat)) return

  confirm.require({
    group: 'accountChange',
    header: 'Cambiar cuentas contables',
    message: 'Las cuentas contables asociadas han cambiado. ¿Desea aplicar las nuevas cuentas de la categoría?',
    acceptLabel: 'Sí',
    rejectLabel: 'No',
    accept: () => {
      applyCategoryAccounts(cat)
    },
    reject: () => {
      // Keep current values, do nothing
    },
  })
}

async function handleSubmit() {
  if (!form.value.name) {
    error.value = 'El nombre es requerido'
    return
  }
  saving.value = true
  error.value = null
  try {
    if (isEdit) {
      await updateProduct(Number(route.params.id), form.value)
      toast.add({ severity: 'success', summary: 'Producto actualizado', life: 3000 })
    } else {
      await createProduct(form.value)
      toast.add({ severity: 'success', summary: 'Producto creado', life: 3000 })
    }
    router.push('/productos')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}

const itemTypes = [
  { label: 'Servicio', value: 'service' },
  { label: 'Producto', value: 'product' },
]

const units = [
  { label: 'Unidad', value: 'unit' },
  { label: 'Hora', value: 'hour' },
  { label: 'Metro', value: 'meter' },
  { label: 'Kilogramo', value: 'kg' },
  { label: 'Caja', value: 'box' },
]
</script>

<template>
  <div v-if="loading" class="text-center py-8 text-gray-500">Cargando...</div>
  <div v-else class="max-w-3xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? 'Editar Producto' : 'Nuevo Producto' }}</h1>

    <Message v-if="error" severity="error" closable @close="error = null">{{ error }}</Message>

    <ConfirmDialog group="accountChange">
      <template #message>
        <div class="flex items-center gap-3 text-amber-600">
          <i class="pi pi-exclamation-triangle text-xl"></i>
          <span>Las cuentas contables asociadas han cambiado. ¿Desea aplicar las nuevas cuentas de la categoría?</span>
        </div>
      </template>
    </ConfirmDialog>

    <Card>
      <template #title>Información General</template>
      <template #content>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-sm font-medium">Nombre *</label>
              <InputText v-model="form.name" class="w-full" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">Código</label>
              <InputText v-model="form.code" class="w-full" />
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-sm font-medium">Tipo</label>
              <Select v-model="form.item_type" :options="itemTypes" optionLabel="label" optionValue="value" class="w-full" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">Unidad</label>
              <Select v-model="form.unit" :options="units" optionLabel="label" optionValue="value" class="w-full" />
            </div>
          </div>
        </form>
      </template>
    </Card>

    <Card>
      <template #title>Categoría e IVA</template>
      <template #content>
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-sm font-medium">Categoría</label>
              <Select
                v-model="form.category_id"
                :options="flatCategories"
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar categoría"
                class="w-full"
                filter
                @change="onCategoryChange"
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">IVA</label>
              <Select
                v-model="form.iva_id"
                :options="ivas"
                optionLabel="name"
                optionValue="id"
                placeholder="Seleccionar IVA"
                class="w-full"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #title>Precios y Costos</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-sm font-medium">Precio de Venta</label>
            <InputNumber v-model="form.price" :min="0" :minFractionDigits="2" :maxFractionDigits="2" class="w-full" />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium">Costo</label>
            <InputNumber v-model="form.cost" :min="0" :minFractionDigits="2" :maxFractionDigits="2" class="w-full" />
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #title>Configuración</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Vendible</label>
            <InputSwitch v-model="form.is_sellable" />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Comprable</label>
            <InputSwitch v-model="form.is_purchasable" />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Control de Inventario</label>
            <InputSwitch v-model="form.is_inventory_controlled" />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Requiere Serie</label>
            <InputSwitch v-model="form.has_serial" />
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #title>Cuentas Contables (opcional)</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-sm font-medium">Cuenta Ingreso</label>
            <Select
              v-model="form.income_account_id"
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
            <label class="text-sm font-medium">Cuenta Gasto</label>
            <Select
              v-model="form.expense_account_id"
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
            <label class="text-sm font-medium">Cuenta Inventario</label>
            <Select
              v-model="form.inventory_account_id"
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
            <label class="text-sm font-medium">Cuenta Costo de Venta</label>
            <Select
              v-model="form.cogs_account_id"
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
      </template>
    </Card>

    <div class="flex justify-end gap-2">
      <Button label="Cancelar" severity="secondary" text @click="router.push('/productos')" />
      <Button type="submit" :loading="saving" :label="isEdit ? 'Actualizar' : 'Crear Producto'" @click="handleSubmit" />
    </div>
  </div>
</template>
