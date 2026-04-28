<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputSwitch from 'primevue/inputswitch'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'

interface Account {
  id: number
  code: string
  name: string
  type: string
  account_type: string
  parent_id: number | null
  level: number
  is_group: boolean
  is_active: boolean
  normal_balance: string
  source: string
  children?: Account[]
}

const toast = useToast()
const allAccounts = ref<Account[]>([])
const flatAccounts = ref<{ label: string; value: number }[]>([])
const loading = ref(false)

const dialogVisible = ref(false)
const editing = ref(false)
const saving = ref(false)
const selected = ref<any>({
  code: '',
  name: '',
  type: 'asset',
  account_type: 'ASSET',
  parent_id: null,
  level: 1,
  is_group: false,
  is_active: true,
  normal_balance: 'DEBIT',
  source: 'MANUAL',
})

const accountTypes = [
  { label: 'Activo', value: 'asset' },
  { label: 'Pasivo', value: 'liability' },
  { label: 'Patrimonio', value: 'equity' },
  { label: 'Ingreso', value: 'income' },
  { label: 'Gasto', value: 'expense' },
  { label: 'Costo de Venta', value: 'cogs' },
]

// Colour and styling per level
const levelColors = [
  { bg: '#1e3a5f', text: '#ffffff', badge: 'info' },      // L1 - dark blue
  { bg: '#2e6b8a', text: '#ffffff', badge: 'info' },       // L2 - medium blue
  { bg: '#c4d9e8', text: '#1e3a5f', badge: 'info' },       // L3 - light blue
  { bg: '#e8f0f8', text: '#1e3a5f', badge: null },          // L4 - very light blue
  { bg: '#f5f8fc', text: '#2e6b8a', badge: null },          // L5
]
const levelStyles = (level: number) => {
  const c = levelColors[Math.min(level - 1, levelColors.length - 1)]
  return `background:${c.bg};color:${c.text};font-weight:${level <= 2 ? 700 : level <= 3 ? 600 : 400};`
}
const levelPadding = (level: number) => `${12 + (level - 1) * 24}px`

// Tree builder
function buildTree(accounts: Account[]): Account[] {
  const map = new Map<number, Account>()
  accounts.forEach(a => map.set(a.id, { ...a, children: [] }))
  const roots: Account[] = []
  accounts.forEach(a => {
    const node = map.get(a.id)!
    if (a.parent_id && map.has(a.parent_id)) {
      map.get(a.parent_id)!.children!.push(node)
    } else {
      roots.push(node)
    }
  })
  // Sort by code within each level
  const sortTree = (nodes: Account[]) => {
    nodes.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
    nodes.forEach(n => { if (n.children!.length) sortTree(n.children!) })
  }
  sortTree(roots)
  return roots
}

const tree = computed(() => buildTree(allAccounts.value))

// Expanded state: track by account id
type ExpandedMap = Record<number, boolean>
const expanded = ref<ExpandedMap>({})

function hasChildren(id: number): boolean {
  const hasChild = allAccounts.value.some(a => a.parent_id === id)
  return hasChild
}

function toggleExpanded(id: number) {
  expanded.value[id] = !expanded.value[id]
}

function expandAll() {
  allAccounts.value.forEach(a => { if (a.is_group || allAccounts.value.some(c => c.parent_id === a.id)) expanded.value[a.id] = true })
}

function collapseAll() {
  expanded.value = {}
}

// Depth-first visible rows
const visibleRows = computed(() => {
  const result: { account: Account; depth: number }[] = []
  function walk(nodes: Account[], depth: number) {
    for (const node of nodes) {
      result.push({ account: node, depth })
      if (node.children?.length && expanded.value[node.id]) {
        walk(node.children, depth + 1)
      }
    }
  }
  walk(tree.value, 0)
  return result
})

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/settings/accounts', { params: { limit: 500 } })
    const items: Account[] = data.data || []
    allAccounts.value = items
    flatAccounts.value = items.map(a => ({
      label: `${a.code} — ${a.name}`,
      value: a.id,
    }))
    // Auto-expand first 2 levels
    items.forEach(a => {
      if (a.level <= 2) expanded.value[a.id] = true
    })
  } catch {
    allAccounts.value = []
    flatAccounts.value = []
  } finally {
    loading.value = false
  }
}

function openNew(parent?: Account) {
  editing.value = false
  selected.value = parent
    ? {
        code: parent.code ? parent.code + '.' : '',
        name: '', type: (parent.type || parent.account_type || 'asset').toLowerCase(),
        account_type: parent.account_type || 'ASSET',
        parent_id: parent.id,
        level: (parent.level || 1) + 1,
        is_group: false, is_active: true,
        normal_balance: parent.normal_balance || 'DEBIT',
        source: parent.source || 'MANUAL',
      }
    : { code: '', name: '', type: 'asset', account_type: 'ASSET', parent_id: null, level: 1, is_group: false, is_active: true, normal_balance: 'DEBIT', source: 'MANUAL' }
  dialogVisible.value = true
}

function openEdit(acc: Account) {
  editing.value = true
  selected.value = { ...acc, type: (acc.type || acc.account_type || '').toLowerCase() }
  dialogVisible.value = true
}

async function save() {
  if (!selected.value.name || !selected.value.code) return
  saving.value = true
  try {
    const payload = {
      code: selected.value.code,
      name: selected.value.name,
      type: selected.value.type,
      parent_id: selected.value.parent_id || null,
      is_active: selected.value.is_active,
    }
    if (editing.value) {
      await api.put(`/settings/accounts/${selected.value.id}`, payload)
      toast.add({ severity: 'success', summary: 'Cuenta actualizada', life: 3000 })
    } else {
      await api.post('/settings/accounts', payload)
      toast.add({ severity: 'success', summary: 'Cuenta creada', life: 3000 })
    }
    dialogVisible.value = false
    await load()
  } catch (e: any) {
    const msg = e.response?.data?.message || ''
    if (msg.includes('ya ha sido tomado') || msg.includes('already been taken') || msg.includes('duplicate key') || msg.includes('Unique violation')) {
      toast.add({ severity: 'warn', summary: 'Código duplicado', detail: 'El código de cuenta "' + selected.value.code + '" ya existe. Usá uno diferente.', life: 5000 })
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: msg || 'Error al guardar', life: 5000 })
    }
  } finally {
    saving.value = false
  }
}

async function toggleActive(acc: Account) {
  try {
    await api.put(`/settings/accounts/${acc.id}`, { is_active: !acc.is_active })
    await load()
  } catch {
    toast.add({ severity: 'error', summary: 'Error al cambiar estado', life: 3000 })
  }
}

const typeLabel = (t: string) => {
  const labels: Record<string, string> = { asset: 'Activo', liability: 'Pasivo', equity: 'Patrimonio', income: 'Ingreso', expense: 'Gasto', cogs: 'Costo Venta' }
  return labels[t.toLowerCase()] || t
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between flex-wrap gap-2">
      <h1 class="text-2xl font-bold text-gray-900">Catálogo de Cuentas</h1>
      <div class="flex gap-2">
        <Button label="Expandir todo" icon="pi pi-angle-double-down" text severity="secondary" @click="expandAll" />
        <Button label="Colapsar todo" icon="pi pi-angle-double-up" text severity="secondary" @click="collapseAll" />
        <Button label="Nueva Cuenta" icon="pi pi-plus" @click="openNew" />
      </div>
    </div>

    <!-- Tree table -->
    <div class="border rounded-lg overflow-hidden">
      <!-- Header -->
      <div class="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
        <div class="col-span-5">Cuenta</div>
        <div class="col-span-2">Tipo</div>
        <div class="col-span-2">Saldo</div>
        <div class="col-span-1 text-center">Estado</div>
        <div class="col-span-2 text-right">Acciones</div>
      </div>

      <!-- Body -->
      <div v-if="loading" class="p-6 text-center text-gray-400">Cargando...</div>
      <div v-else-if="visibleRows.length === 0" class="p-6 text-center text-gray-400">No hay cuentas registradas</div>
      <div v-else>
        <div
          v-for="{ account: a, depth } in visibleRows"
          :key="a.id"
          class="grid grid-cols-12 gap-2 px-4 py-2 border-t items-center transition-colors hover:brightness-95"
          :style="levelStyles(a.level)"
          @click="hasChildren(a.id) ? toggleExpanded(a.id) : null"
        >
          <!-- Name + expand icon -->
          <div class="col-span-5 flex items-center gap-1 truncate" :style="{ paddingLeft: levelPadding(depth) }">
            <!-- Expand/collapse for groups -->
            <Button
              v-if="hasChildren(a.id)"
              :icon="expanded[a.id] ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
              text
              rounded
              class="!w-5 !h-5 !p-0 flex-shrink-0"
              :style="{ color: levelColors[Math.min(a.level - 1, levelColors.length - 1)].text }"
              @click.stop="toggleExpanded(a.id)"
            />
            <span v-else class="w-5 flex-shrink-0" />
            <span class="font-mono text-xs opacity-70 mr-1 flex-shrink-0">{{ a.code }}</span>
            <span class="truncate" :class="{ 'font-bold': depth === 0 || a.level <= 2 }">{{ a.name }}</span>
          </div>

          <!-- Type -->
          <div class="col-span-2 text-xs truncate" :style="{ opacity: 0.8 }">
            <Tag
              v-if="a.level <= 3"
              :value="typeLabel(a.type || a.account_type || '')"
              :severity="levelColors[Math.min(a.level - 1, levelColors.length - 1)].badge || 'info'"
              rounded
              class="text-[10px]"
            />
            <span v-else class="text-xs">{{ typeLabel(a.type || a.account_type || '') }}</span>
          </div>

          <!-- Normal balance -->
          <div class="col-span-2 text-xs" :style="{ opacity: 0.7 }">
            {{ a.normal_balance === 'DEBIT' ? 'Deudor' : 'Acreedor' }}
          </div>

          <!-- Status -->
          <div class="col-span-1 flex justify-center">
            <span
              class="w-2 h-2 rounded-full inline-block"
              :class="a.is_active ? 'bg-green-500' : 'bg-red-400'"
              :title="a.is_active ? 'Activa' : 'Inactiva'"
            />
          </div>

          <!-- Actions -->
          <div class="col-span-2 flex justify-end gap-1">
            <Button
              icon="pi pi-plus"
              text
              rounded
              class="!w-7 !h-7"
              :style="{ color: a.level <= 2 ? '#ffffffcc' : undefined }"
              :title="'Agregar subcuenta de ' + a.code"
              @click.stop="openNew(a)"
            />
            <Button
              icon="pi pi-pencil"
              text
              rounded
              class="!w-7 !h-7"
              :style="{ color: a.level <= 2 ? '#ffffffcc' : undefined }"
              @click.stop="openEdit(a)"
            />
            <Button
              :icon="a.is_active ? 'pi pi-ban' : 'pi pi-check-circle'"
              text
              rounded
              class="!w-7 !h-7"
              :style="{ color: a.level <= 2 ? '#ffffffcc' : undefined }"
              @click.stop="toggleActive(a)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editing ? 'Editar Cuenta' : 'Nueva Cuenta'"
      :style="{ width: '520px' }"
      :modal="true"
    >
      <div class="space-y-4 pt-2">
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-sm font-medium">Código *</label>
            <InputText v-model="selected.code" class="w-full" />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium">Tipo</label>
            <Select v-model="selected.type" :options="accountTypes" optionLabel="label" optionValue="value" class="w-full" />
          </div>
        </div>
        <div class="space-y-1">
          <label class="text-sm font-medium">Nombre *</label>
          <InputText v-model="selected.name" class="w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-medium">Cuenta Padre</label>
          <Select
            v-model="selected.parent_id"
            :options="flatAccounts"
            optionLabel="label"
            optionValue="value"
            placeholder="Ninguna (raíz)"
            class="w-full"
            filter
          />
        </div>
        <div class="flex items-center gap-2">
          <InputSwitch v-model="selected.is_active" />
          <label class="text-sm">Activa</label>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="dialogVisible = false" />
        <Button label="Guardar" :loading="saving" @click="save" />
      </template>
    </Dialog>
  </div>
</template>
