<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRolesStore } from '@/stores/roles'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'

const rolesStore = useRolesStore()
const router = useRouter()
const confirm = useConfirm()

onMounted(() => rolesStore.fetchRoles())

function confirmDelete(roleId: number, roleName: string) {
  confirm.require({
    message: `¿Eliminar rol "${roleName}"? Los usuarios con este rol perderán sus permisos.`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => rolesStore.removeRole(roleId),
  })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800">Roles del Sistema</h1>
      <Button label="Nuevo Rol" icon="pi pi-plus" @click="router.push('/roles/nuevo')" />
    </div>

    <DataTable
      :value="rolesStore.roles"
      :loading="rolesStore.loading"
      stripedRows
      class="p-datatable-sm"
    >
      <Column field="name" header="Nombre" sortable />
      <Column field="code" header="Código" sortable />
      <Column field="description" header="Descripción" />
      <Column header="Usuarios">
        <template #body="{ data }">
          <Tag :value="data.users_count ?? 0" :severity="(data.users_count ?? 0) > 0 ? 'info' : 'secondary'" />
        </template>
      </Column>
      <Column header="Permisos">
        <template #body="{ data }">
          <Tag :value="data.permissions_count ?? 0" severity="warn" />
        </template>
      </Column>
      <Column header="Acciones" style="width: 160px">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button icon="pi pi-shield" rounded size="small" severity="info"
              @click="router.push(`/roles/${data.id}/permisos`)"
              v-tooltip.left="'Gestionar permisos'" />
            <Button icon="pi pi-pencil" severity="warn" rounded size="small"
              @click="router.push(`/roles/${data.id}/editar`)" />
            <Button icon="pi pi-trash" severity="danger" rounded size="small"
              :disabled="data.code === 'superadmin'"
              @click="confirmDelete(data.id, data.name)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <ConfirmDialog />
  </div>
</template>
