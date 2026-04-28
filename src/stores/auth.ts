import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as apiLogin, logout as apiLogout, me, type User } from '@/api/auth'
import type { LoginPayload } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(JSON.parse(localStorage.getItem('auth_user') || 'null'))
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = () => !!token.value

  async function login(payload: LoginPayload) {
    loading.value = true
    error.value = null
    try {
      const res = await apiLogin(payload)
      token.value = res.token
      user.value = res.user
      localStorage.setItem('auth_token', res.token)
      localStorage.setItem('auth_user', JSON.stringify(res.user))
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
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  async function fetchMe() {
    try {
      const u = await me()
      user.value = u
      localStorage.setItem('auth_user', JSON.stringify(u))
    } catch {
      await logout()
    }
  }

  return { user, token, loading, error, isAuthenticated, login, logout, fetchMe }
})
