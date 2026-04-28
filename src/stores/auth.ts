import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as apiLogin, logout as apiLogout, me } from '@/api/auth'
import type { LoginPayload, User } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(JSON.parse(localStorage.getItem('auth_user') || 'null'))
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const permissions = ref<string[]>(JSON.parse(localStorage.getItem('auth_permissions') || '[]'))
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = () => !!token.value

  function hasPermission(code: string): boolean {
    return permissions.value.includes(code)
  }

  function hasAnyPermission(codes: string[]): boolean {
    return codes.some(code => permissions.value.includes(code))
  }

  async function login(payload: LoginPayload) {
    loading.value = true
    error.value = null
    try {
      const res = await apiLogin(payload)
      token.value = res.token
      user.value = res.user
      permissions.value = res.permissions || []
      localStorage.setItem('auth_token', res.token)
      localStorage.setItem('auth_user', JSON.stringify(res.user))
      localStorage.setItem('auth_permissions', JSON.stringify(res.permissions || []))
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Error al iniciar sesión'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await apiLogout()
    } catch { /* ignore */ }
    clearSession()
  }

  function clearSession() {
    token.value = null
    user.value = null
    permissions.value = []
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_permissions')
  }

  async function fetchMe() {
    try {
      const u = await me()
      user.value = u
      permissions.value = u.permissions || []
      localStorage.setItem('auth_user', JSON.stringify(u))
      localStorage.setItem('auth_permissions', JSON.stringify(u.permissions || []))
    } catch {
      clearSession()
    }
  }

  return {
    user, token, permissions, loading, error,
    isAuthenticated, hasPermission, hasAnyPermission,
    login, logout, fetchMe, clearSession,
  }
})
