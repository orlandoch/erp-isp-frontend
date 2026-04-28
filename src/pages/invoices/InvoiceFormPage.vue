<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'
import type { Product } from '@/api/products'
import { createInvoice } from '@/api/invoices'

const router = useRouter()
const toast = useToast()

/* ── Client search ── */
interface ClientResult {
  id: number
  full_name: string
  first_name: string | null
  last_name: string | null
  document_number: string
  document_type: string
  business_name?: string | null
  phones?: { number: string }[]
  emails?: { email: string }[]
  addresses?: { address: string }[]
}

const clientSearch = ref('')
const clientResults = ref<ClientResult[]>([])
const searchingClient = ref(false)
const showClientResults = ref(false)
const selectedClient = ref<ClientResult | null>(null)
let clientDebounce: ReturnType<typeof setTimeout> | null = null

const form = ref({
  client_id: null as number | null,
  subtotal: 0,
  discount_total: 0,
  tax_total: 0,
  total: 0,
})

async function searchClient() {
  const q = clientSearch.value.trim()
  if (!q || q.length < 2) {
    clientResults.value = []
    showClientResults.value = false
    return
  }
  searchingClient.value = true
  try {
    const { data } = await api.get('/clients', { params: { search: q, perPage: 10 } })
    const list: ClientResult[] = data?.data || []
    clientResults.value = list
    showClientResults.value = list.length > 0
  } catch {
    clientResults.value = []
  } finally {
    searchingClient.value = false
  }
}

function onClientInput() {
  if (clientDebounce) clearTimeout(clientDebounce)
  clientDebounce = setTimeout(searchClient, 350)
}

function selectClient(c: ClientResult) {
  selectedClient.value = c
  clientSearch.value = c.full_name
  showClientResults.value = false
  clientResults.value = []
  form.value.client_id = c.id
}

function clearClient() {
  selectedClient.value = null
  clientSearch.value = ''
  form.value.client_id = null
  showClientResults.value = false
  clientResults.value = []
}

function onClientBlur() {
  setTimeout(() => { showClientResults.value = false }, 200)
}
function onClientFocus() {
  if (clientResults.value.length > 0) showClientResults.value = true
}

const documentTypeLabel = (t: string) => {
  const labels: Record<string, string> = { RUC: 'RUC', CEDULA: 'Cédula', PASSPORT: 'Pasaporte' }
  return labels[t] || t
}

/* ── Product search ── */
const productSearch = ref('')
const productResults = ref<Product[]>([])
const searchingProduct = ref(false)
const showProductResults = ref(false)
let productDebounce: ReturnType<typeof setTimeout> | null = null

async function searchProduct() {
  const q = productSearch.value.trim()
  if (!q || q.length < 2) {
    productResults.value = []
    showProductResults.value = false
    return
  }
  searchingProduct.value = true
  try {
    const { data } = await api.get('/products', { params: { search: q, limit: 10, is_sellable: true } })
    const list: Product[] = data?.data || []
    productResults.value = list
    showProductResults.value = list.length > 0
  } catch {
    productResults.value = []
  } finally {
    searchingProduct.value = false
  }
}

function onProductInput() {
  if (productDebounce) clearTimeout(productDebounce)
  productDebounce = setTimeout(searchProduct, 350)
}

function selectProduct(p: Product) {
  const existing = items.value.find(i => i.product_id === p.id)
  if (existing) {
    existing.quantity++
    recalcLine(items.value.indexOf(existing))
  } else {
    const price = Number(p.price) || 0
    const taxRate = p.iva?.percentage ? Number(p.iva.percentage) : 0
    const item: LineItem = {
      item_type: 'product',
      product_id: p.id,
      description: p.name,
      quantity: 1,
      unit_price: price,
      subtotal: 0,
      tax_rate: taxRate,
      tax_amount: 0,
      total: 0,
    }
    recalcItem(item)
    items.value.push(item)
    recalcTotals()
  }
  productSearch.value = ''
  productResults.value = []
  showProductResults.value = false
}

function onProductBlur() {
  setTimeout(() => { showProductResults.value = false }, 200)
}
function onProductFocus() {
  if (productResults.value.length > 0) showProductResults.value = true
}

/* ── Items (table) ── */
interface LineItem {
  item_type: string
  product_id: number | null
  description: string
  quantity: number
  unit_price: number
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
}

const items = ref<LineItem[]>([])

function removeItem(index: number) {
  items.value.splice(index, 1)
  recalcTotals()
}

function recalcItem(item: LineItem) {
  const qty = Number(item.quantity) || 0
  const price = Number(item.unit_price) || 0
  item.subtotal = +(qty * price).toFixed(6)
  item.tax_amount = +(item.subtotal * (item.tax_rate / 100)).toFixed(6)
  item.total = +(item.subtotal + item.tax_amount).toFixed(6)
}

function recalcLine(index: number, newQty?: number, newPrice?: number) {
  const item = items.value[index]
  if (newQty !== undefined) item.quantity = newQty
  if (newPrice !== undefined) item.unit_price = newPrice
  recalcItem(item)
  recalcTotals()
}

function recalcTotals() {
  const subtotal = items.value.reduce((s, i) => s + i.subtotal, 0)
  const taxTotal = items.value.reduce((s, i) => s + i.tax_amount, 0)
  form.value.subtotal = +subtotal.toFixed(6)
  form.value.discount_total = 0
  form.value.tax_total = +taxTotal.toFixed(6)
  form.value.total = +(subtotal + taxTotal).toFixed(6)
}

/* ── Submit ── */
const saving = ref(false)
const error = ref<string | null>(null)

async function handleSubmit() {
  if (!form.value.client_id) {
    error.value = 'Seleccione un cliente'
    return
  }
  if (items.value.length === 0) {
    error.value = 'Agregue al menos un producto'
    return
  }

  saving.value = true
  error.value = null
  try {
    await createInvoice({
      client_id: form.value.client_id,
      subtotal: form.value.subtotal,
      discount_total: form.value.discount_total,
      tax_total: form.value.tax_total,
      total: form.value.total,
      items: items.value.map(i => ({
        item_type: i.item_type,
        product_id: i.product_id,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        subtotal: i.subtotal,
        tax_rate: i.tax_rate,
        tax_amount: i.tax_amount,
        total: i.total,
      })),
    })
    toast.add({ severity: 'success', summary: 'Factura creada', life: 3000 })
    router.push('/facturas')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al crear factura'
  } finally {
    saving.value = false
  }
}

/* ── Helpers ── */
function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
}
</script>

<template>
  <div class="w-full space-y-4">
    <h1 class="text-2xl font-bold text-gray-900">Nueva Factura</h1>

    <Message v-if="error" severity="error" closable @close="error = null">{{ error }}</Message>

    <!-- Client info row - always visible -->
    <div class="grid grid-cols-5 gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
      <div class="space-y-0.5">
        <span class="text-xs text-blue-500 font-medium">Cliente</span>
        <div class="text-blue-800 font-medium">{{ selectedClient?.full_name || '—' }}</div>
      </div>
      <div class="space-y-0.5">
        <span class="text-xs text-blue-500 font-medium">Documento</span>
        <div class="text-blue-800">{{ selectedClient ? documentTypeLabel(selectedClient.document_type) + ': ' + selectedClient.document_number : '—' }}</div>
      </div>
      <div class="space-y-0.5">
        <span class="text-xs text-blue-500 font-medium">Teléfono</span>
        <div class="text-blue-800">{{ selectedClient?.phones?.[0]?.number || '—' }}</div>
      </div>
      <div class="space-y-0.5">
        <span class="text-xs text-blue-500 font-medium">Email</span>
        <div class="text-blue-800 truncate">{{ selectedClient?.emails?.[0]?.email || '—' }}</div>
      </div>
      <div class="space-y-0.5">
        <span class="text-xs text-blue-500 font-medium">Dirección</span>
        <div class="text-blue-800 truncate">{{ selectedClient?.addresses?.[0]?.address || '—' }}</div>
      </div>
    </div>

    <!-- Two-column search section -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Left: Client search -->
      <Card pt:content:class="!p-0">
        <template #title>
          <div class="flex items-center gap-2 text-sm">
            <i class="pi pi-users text-blue-500" />
            <span>Buscar Cliente</span>
          </div>
        </template>
        <template #content>
          <div class="relative p-3">
            <div class="relative">
              <InputText
                v-model="clientSearch"
                placeholder="Nombre o documento..."
                class="w-full"
                @input="onClientInput"
                @focus="onClientFocus"
                @blur="onClientBlur"
              />
              <i v-if="searchingClient" class="pi pi-spin pi-spinner absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Button
                v-if="selectedClient && !searchingClient"
                icon="pi pi-times"
                text
                rounded
                class="absolute right-1 top-1/2 -translate-y-1/2 !w-6 !h-6"
                @click="clearClient"
              />
            </div>
            <div
              v-if="showClientResults && clientResults.length > 0"
              class="absolute z-50 left-3 right-3 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              <div
                v-for="c in clientResults"
                :key="c.id"
                class="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                @mousedown.prevent="selectClient(c)"
              >
                <div class="font-medium">{{ c.full_name }}</div>
                <div class="text-xs text-gray-500">{{ documentTypeLabel(c.document_type) }}: {{ c.document_number }}</div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Right: Product search -->
      <Card pt:content:class="!p-0">
        <template #title>
          <div class="flex items-center gap-2 text-sm">
            <i class="pi pi-box text-green-500" />
            <span>Buscar Producto / Servicio</span>
          </div>
        </template>
        <template #content>
          <div class="relative p-3">
            <div class="relative">
              <InputText
                v-model="productSearch"
                placeholder="Nombre o código..."
                class="w-full"
                @input="onProductInput"
                @focus="onProductFocus"
                @blur="onProductBlur"
              />
              <i v-if="searchingProduct" class="pi pi-spin pi-spinner absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <div
              v-if="showProductResults && productResults.length > 0"
              class="absolute z-50 left-3 right-3 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              <div
                v-for="p in productResults"
                :key="p.id"
                class="px-3 py-2 hover:bg-green-50 cursor-pointer border-b last:border-b-0 flex items-center justify-between"
                @mousedown.prevent="selectProduct(p)"
              >
                <div>
                  <div class="font-medium">{{ p.name }}</div>
                  <div v-if="p.code" class="text-xs text-gray-400">Código: {{ p.code }}</div>
                </div>
                <div class="text-right">
                  <div class="font-medium">${{ Number(p.price || 0).toFixed(6) }}</div>
                  <div v-if="p.iva" class="text-xs text-gray-400">IVA {{ p.iva.percentage }}%</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Items table -->
    <Card>
      <template #content>
        <DataTable :value="items" stripedRows class="w-full" size="small">
          <Column field="description" header="Descripción">
            <template #body="{ data, index }">
              <InputText :modelValue="data.description" class="w-full text-sm" @update:modelValue="data.description = $event; recalcLine(index)" />
            </template>
          </Column>
          <Column field="quantity" header="Cant." style="width: 90px">
            <template #body="{ data, index }">
              <InputNumber :modelValue="data.quantity" :min="1" class="w-full" @update:modelValue="recalcLine(index, $event)" />
            </template>
          </Column>
          <Column field="unit_price" header="Precio Unit." style="width: 150px">
            <template #body="{ data, index }">
              <InputNumber
                :modelValue="data.unit_price"
                :min="0"
                :minFractionDigits="2"
                :maxFractionDigits="6"
                class="w-full"
                @update:modelValue="recalcLine(index, undefined, $event)"
              />
            </template>
          </Column>
          <Column field="subtotal" header="Subtotal" style="width: 130px">
            <template #body="{ data }">
              <span class="font-medium">{{ fmt(data.subtotal) }}</span>
            </template>
          </Column>
          <Column field="tax_rate" header="IVA %" style="width: 70px">
            <template #body="{ data }">
              <span>{{ data.tax_rate }}%</span>
            </template>
          </Column>
          <Column field="tax_amount" header="IVA $" style="width: 110px">
            <template #body="{ data }">
              <span>{{ fmt(data.tax_amount) }}</span>
            </template>
          </Column>
          <Column field="total" header="Total" style="width: 130px">
            <template #body="{ data }">
              <span class="font-bold">{{ fmt(data.total) }}</span>
            </template>
          </Column>
          <Column style="width: 50px">
            <template #body="{ index }">
              <Button icon="pi pi-trash" text severity="danger" size="small" @click="removeItem(index)" />
            </template>
          </Column>
        </DataTable>
        <div v-if="items.length === 0" class="text-center py-6 text-gray-400 text-sm">
          Busque un producto en el panel de la derecha para agregarlo.
        </div>
      </template>
    </Card>

    <!-- Totales -->
    <div class="flex justify-end">
      <div class="space-y-1 text-right min-w-[280px]">
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Subtotal:</span>
          <span class="font-medium">{{ fmt(form.subtotal) }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Descuento:</span>
          <span class="font-medium">$0.00</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">IVA:</span>
          <span class="font-medium">{{ fmt(form.tax_total) }}</span>
        </div>
        <div class="flex justify-between text-lg font-bold border-t pt-1">
          <span>Total:</span>
          <span>{{ fmt(form.total) }}</span>
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-2">
      <Button label="Cancelar" severity="secondary" text @click="router.push('/facturas')" />
      <Button :loading="saving" label="Crear Factura" icon="pi pi-save" @click="handleSubmit" />
    </div>
  </div>
</template>
