<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from '@/stores/users'
import { useRolesStore } from '@/stores/roles'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Toolbar from 'primevue/toolbar'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'

const usersStore = useUsersStore()
const rolesStore = useRolesStore()
const router = useRouter()
const confirm = useConfirm()
const search = ref('')

onMounted(async () => {
  await Promise.all([usersStore.fetchUsers(), rolesStore.fetchRoles()])
})

function onSearch() {
  usersStore.fetchUsers({ search: search.value, per_page: 20 })
}

function confirmDelete(userId: number, userName: string) {
  confirm.require({
    message: `¿Eliminar usuario "${userName}"?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => usersStore.removeUser(userId),
  })
}

function toggleActive(user: any) {
  usersStore.saveUser(user.id, { name: user.name, email: user.email, is_active: !user.is_active })
}

function getRoleTags(roles: any[] | undefined): string {
  if (!roles || roles.length === 0) return '—'
  return roles.map(r => r.name || r.code).join(', ')
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800">Usuarios del Sistema</h1>
      <Button label="Nuevo Usuario" icon="pi pi-plus" @click="router.push('/usuarios/nuevo')" />
    </div>

    <Toolbar class="!p-2">
      <template #start>
        <div class="flex gap-2">
          <InputText v-model="search" placeholder="Buscar por nombre o email..." @keyup.enter="onSearch" />
          <Button icon="pi pi-search" severity="secondary" @click="onSearch" />
        </div>
      </template>
    </Toolbar>

    <DataTable
      :value="usersStore.users"
      :loading="usersStore.loading"
      lazy
      paginator
      :rows="20"
      :totalRecords="usersStore.total"
      @page="(e: any) => usersStore.fetchUsers({ search: search.value, page: e.page + 1, per_page: e.rows })"
      stripedRows
      class="p-datatable-sm"
    >
      <Column field="name" header="Nombre" sortable />
      <Column field="email" header="Email" sortable />
      <Column header="Roles">
        <template #body="{ data }">
          {{ getRoleTags(data.roles) }}
        </template>
      </Column>
      <Column header="Activo">
        <template #body="{ data }">
          <Tag
            :value="data.is_active ? 'Sí' : 'No'"
            :severity="data.is_active ? 'success' : 'danger'"
            class="cursor-pointer"
            @click="toggleActive(data)"
          />
        </template>
      </Column>
      <Column header="Acciones" style="width: 120px">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button icon="pi pi-pencil" severity="warn" rounded size="small"
              @click="router.push(`/usuarios/${data.id}/editar`)" />
            <Button icon="pi pi-trash" severity="danger" rounded size="small"
              @click="confirmDelete(data.id, data.name)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <ConfirmDialog />
  </div>
</template>
