<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

defineProps<{ visible: boolean }>()

const router = useRouter()
const route = useRoute()

interface SubItem {
  label: string
  icon: string
  to: string
}

interface NavItem {
  label: string
  icon: string
  children?: SubItem[]
  to?: string
}

const openGroups = ref<Record<string, boolean>>({
  productos: true,
  contracts: true,
})

function toggleGroup(key: string) {
  openGroups.value[key] = !openGroups.value[key]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'pi pi-home', to: '/' },
  { label: 'Clientes', icon: 'pi pi-users', to: '/clientes' },
  {
    label: 'Productos',
    icon: 'pi pi-box',
    children: [
      { label: 'Gestionar Productos', icon: 'pi pi-list', to: '/productos' },
      { label: 'Crear Producto', icon: 'pi pi-plus', to: '/productos/nuevo' },
      { label: 'Categorías', icon: 'pi pi-sitemap', to: '/productos/categorias' },
    ],
  },
  { label: 'Facturas', icon: 'pi pi-file', to: '/facturas' },
  { label: 'Pagos', icon: 'pi pi-dollar', to: '/pagos' },
  { label: 'CxC', icon: 'pi pi-credit-card', to: '/cuentas-por-cobrar' },
  { label: 'Doc. Electrónicos', icon: 'pi pi-qrcode', to: '/documentos-electronicos' },
  {
    label: 'Planes y Contratos',
    icon: 'pi pi-file-contract',
    children: [
      { label: 'Planes de Internet', icon: 'pi pi-list', to: '/contracts/internet-plans' },
      { label: 'Nuevo Plan', icon: 'pi pi-plus', to: '/contracts/internet-plans/new' },
      { label: 'Contratos', icon: 'pi pi-address-book', to: '/contracts/contracts' },
      { label: 'Nuevo Contrato', icon: 'pi pi-plus', to: '/contracts/contracts/new' },
      { label: 'Plantillas de Contrato', icon: 'pi pi-copy', to: '/contracts/templates' },
    ],
  },
  {
    label: 'Contabilidad',
    icon: 'pi pi-book',
    children: [
      { label: 'Catálogo de Cuentas', icon: 'pi pi-table', to: '/contabilidad/cuentas' },
    ],
  },
  {
    label: 'Administración',
    icon: 'pi pi-shield',
    children: [
      { label: 'Usuarios', icon: 'pi pi-users', to: '/usuarios' },
      { label: 'Roles', icon: 'pi pi-shield', to: '/roles' },
    ],
  },
  { label: 'Configuración', icon: 'pi pi-cog', to: '/configuracion' },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <aside
    v-show="visible"
    class="w-64 bg-slate-900 text-white flex flex-col shrink-0"
  >
    <div class="p-5 border-b border-slate-700">
      <h1 class="text-lg font-bold">ERP ISP</h1>
      <p class="text-xs text-slate-400 mt-1">Sistema de Gestión</p>
    </div>
    <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
      <template v-for="item in navItems" :key="item.label">
        <!-- Item with children (collapsible) -->
        <div v-if="item.children">
          <button
            class="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            @click="toggleGroup(item.label)"
          >
            <i :class="item.icon" class="text-lg" />
            <span class="flex-1 text-left">{{ item.label }}</span>
            <i
              class="pi text-xs transition-transform"
              :class="openGroups[item.label] ? 'pi-chevron-down' : 'pi-chevron-right'"
            />
          </button>
          <div v-if="openGroups[item.label]" class="ml-6 mt-1 space-y-1">
            <router-link
              v-for="child in item.children"
              :key="child.to"
              :to="child.to"
              class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
              :class="isActive(child.to) ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'"
            >
              <i :class="child.icon" class="text-sm" />
              {{ child.label }}
            </router-link>
          </div>
        </div>
        <!-- Simple link -->
        <router-link
          v-else
          :to="item.to!"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
          :class="isActive(item.to!) ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'"
        >
          <i :class="item.icon" class="text-lg" />
          {{ item.label }}
        </router-link>
      </template>
    </nav>
    <div class="p-4 border-t border-slate-700 text-xs text-slate-500 text-center">
      v1.0.0
    </div>
  </aside>
</template>
