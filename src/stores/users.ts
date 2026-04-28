import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUsers, createUser, updateUser, deleteUser, type User, type UserPayload } from '@/api/users'

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const currentPage = ref(1)

  async function fetchUsers(params?: { search?: string; per_page?: number; page?: number }) {
    loading.value = true
    error.value = null
    try {
      const res = await getUsers(params)
      users.value = res.data
      total.value = res.total
      currentPage.value = res.current_page
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Error al cargar usuarios'
    } finally {
      loading.value = false
    }
  }

  async function saveUser(id: number | null, payload: UserPayload): Promise<User> {
    const res = id ? await updateUser(id, payload) : await createUser(payload)
    await fetchUsers({ per_page: 20, page: currentPage.value })
    return res
  }

  async function removeUser(id: number): Promise<void> {
    await deleteUser(id)
    await fetchUsers({ per_page: 20, page: currentPage.value })
  }

  return { users, loading, error, total, currentPage, fetchUsers, saveUser, removeUser }
})
