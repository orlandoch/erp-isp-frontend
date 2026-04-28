<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRolesStore } from '@/stores/roles'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Message from 'primevue/message'
import Tag from 'primevue/tag'

const router = useRouter()
const route = useRoute()
const rolesStore = useRolesStore()

const saving = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

const roleId = computed(() => Number(route.params.id))
const role = computed(() => rolesStore.currentRole)
const modules = computed(() => Object.keys(rolesStore.permissionsCatalog).sort())

const selectedPermissionIds = ref<number[]>([])

onMounted(async () => {
  await Promise.all([
    rolesStore.fetchRole(roleId.value),
    rolesStore.fetchPermissionsCatalog(),
  ])
  // Pre-seleccionar permisos que ya tiene el rol
  if (role.value?.permissions) {
    selectedPermissionIds.value = role.value.permissions.map(p => p.id)
  }
})

function toggleModule(module: string, checked: boolean) {
  const modulePerms = rolesStore.permissionsCatalog[module] || []
  const moduleIds = modulePerms.map(p => p.id)
  if (checked) {
    // Agregar todos los del módulo que no estén ya
    const newIds = moduleIds.filter(id => !selectedPermissionIds.value.includes(id))
    selectedPermissionIds.value.push(...newIds)
  } else {
    // Quitar todos los del módulo
    selectedPermissionIds.value = selectedPermissionIds.value.filter(id => !moduleIds.includes(id))
  }
}

function isModuleFullySelected(module: string): boolean {
  const modulePerms = rolesStore.permissionsCatalog[module] || []
  if (modulePerms.length === 0) return false
  return modulePerms.every(p => selectedPermissionIds.value.includes(p.id))
}

function isModulePartiallySelected(module: string): boolean {
  const modulePerms = rolesStore.permissionsCatalog[module] || []
  if (modulePerms.length === 0) return false
  const selected = modulePerms.filter(p => selectedPermissionIds.value.includes(p.id))
  return selected.length > 0 && selected.length < modulePerms.length
}

function togglePermission(id: number) {
  const idx = selectedPermissionIds.value.indexOf(id)
  if (idx >= 0) {
    selectedPermissionIds.value.splice(idx, 1)
  } else {
    selectedPermissionIds.value.push(id)
  }
}

async function save() {
  saving.value = true
  error.value = null
  success.value = false
  try {
    await rolesStore.savePermissions(roleId.value, selectedPermissionIds.value)
    success.value = true
    setTimeout(() => (success.value = false), 3000)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al guardar permisos'
  } finally {
    saving.value = false
  }
}

function formatModuleName(module: string): string {
  const names: Record<string, string> = {
    clients: 'Clientes',
    products: 'Productos',
    categories: 'Categorías',
    iva: 'IVA',
    invoices: 'Facturación',
    payments: 'Pagos',
    receivables: 'CxC',
    electronic: 'Documentos Electrónicos',
    establishments: 'Establecimientos',
    'emission-points': 'Puntos de Emisión',
    'document-sequences': 'Secuenciales',
    settings: 'Configuración',
    accounts: 'Cuentas Contables',
    plans: 'Planes',
    contracts: 'Contratos',
    users: 'Usuarios',
    roles: 'Roles',
    permissions: 'Permisos',
  }
  return names[module] || module
}

function labelForCode(code: string): string {
  const labels: Record<string, string> = {
    list: 'Listar',
    create: 'Crear',
    view: 'Ver',
    edit: 'Editar',
    delete: 'Eliminar',
    issue: 'Emitir',
    activate: 'Activar',
    deactivate: 'Desactivar',
    suspend: 'Suspender',
    cancel: 'Cancelar',
    block: 'Bloquear',
    unblock: 'Desbloquear',
    'change-plan': 'Cambiar Plan',
    assign: 'Asignar',
  }
  const action = code.split('.').pop() || code
  return labels[action] || action
}

const totalPermisos = computed(() => {
  let count = 0
  for (const perms of Object.values(rolesStore.permissionsCatalog)) {
    count += perms.length
  }
  return count
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-4 pb-8">
    <div class="flex items-center gap-2">
      <Button icon="pi pi-arrow-left" severity="secondary" text @click="router.push('/roles')" />
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Permisos del Rol</h1>
        <p v-if="role" class="text-sm text-gray-500">{{ role.name }} ({{ role.code }})</p>
      </div>
    </div>

    <Message v-if="success" severity="success">Permisos actualizados correctamente</Message>
    <Message v-if="error" severity="error">{{ error }}</Message>

    <div class="flex items-center justify-end gap-3 mb-2">
      <span class="text-sm text-gray-500">
        {{ selectedPermissionIds.length }} de {{ totalPermisos }} permisos seleccionados
      </span>
      <Button :loading="saving" label="Guardar Permisos" icon="pi pi-save" @click="save" />
    </div>

    <div v-for="mod in modules" :key="mod" class="border rounded-lg overflow-hidden">
      <div class="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b cursor-pointer hover:bg-gray-100"
        @click="toggleModule(mod, !isModuleFullySelected(mod))">
        <i class="pi" :class="isModuleFullySelected(mod) ? 'pi-check-circle text-green-600' :
          isModulePartiallySelected(mod) ? 'pi-minus-circle text-yellow-600' : 'pi-circle text-gray-300'" />
        <span class="font-semibold text-gray-700 flex-1">{{ formatModuleName(mod) }}</span>
        <Tag :value="(rolesStore.permissionsCatalog[mod] || []).length" severity="info" />
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 p-3">
        <div v-for="perm in (rolesStore.permissionsCatalog[mod] || [])" :key="perm.id"
          class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
          @click="togglePermission(perm.id)">
          <Checkbox
            :inputId="`perm_${perm.id}`"
            :binary="true"
            :modelValue="selectedPermissionIds.includes(perm.id)"
            @click.stop
          />
          <label :for="`perm_${perm.id}`" class="text-sm cursor-pointer select-none">
            {{ labelForCode(perm.code) }}
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
