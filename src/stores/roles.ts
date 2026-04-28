import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getRoles, getRole, createRole, updateRole, deleteRole,
  syncRolePermissions, getPermissionsCatalog,
  type Role, type RolePayload, type Permission, type PermissionsCatalog,
} from '@/api/roles'

export const useRolesStore = defineStore('roles', () => {
  const roles = ref<Role[]>([])
  const currentRole = ref<Role | null>(null)
  const permissionsCatalog = ref<PermissionsCatalog>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRoles() {
    loading.value = true
    error.value = null
    try {
      roles.value = await getRoles()
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Error al cargar roles'
    } finally {
      loading.value = false
    }
  }

  async function fetchRole(id: number) {
    loading.value = true
    error.value = null
    try {
      currentRole.value = await getRole(id)
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Error al cargar rol'
    } finally {
      loading.value = false
    }
  }

  async function fetchPermissionsCatalog() {
    try {
      permissionsCatalog.value = await getPermissionsCatalog()
    } catch { /* ignore */ }
  }

  async function saveRole(id: number | null, payload: RolePayload): Promise<Role> {
    const res = id ? await updateRole(id, payload) : await createRole(payload)
    await fetchRoles()
    return res
  }

  async function removeRole(id: number): Promise<void> {
    await deleteRole(id)
    await fetchRoles()
  }

  async function savePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    await syncRolePermissions(roleId, permissionIds)
    await fetchRole(roleId)
  }

  return {
    roles, currentRole, permissionsCatalog, loading, error,
    fetchRoles, fetchRole, fetchPermissionsCatalog,
    saveRole, removeRole, savePermissions,
  }
})
