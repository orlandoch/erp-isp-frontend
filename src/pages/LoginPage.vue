<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const debugInfo = ref('')

async function handleLogin() {
  loading.value = true
  error.value = null
  debugInfo.value = `Enviando: email=${email.value}, password len=${password.value.length}`
  try {
    await auth.login({ email: email.value, password: password.value })
    router.push('/')
  } catch (e: any) {
    debugInfo.value += ` | Error: ${JSON.stringify(e.response?.data || e.message)}`
    error.value = e.response?.data?.message || 'Credenciales inválidas'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
    <div class="w-full max-w-sm p-8 bg-white rounded-2xl shadow-2xl">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-900">ERP ISP</h1>
        <p class="text-sm text-gray-500 mt-1">Inicia sesión para continuar</p>
      </div>

      <Message v-if="error" severity="error" class="mb-4">{{ error }}</Message>
      <Message v-if="debugInfo" severity="info" class="mb-4 text-xs">{{ debugInfo }}</Message>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <div class="space-y-1">
          <label for="email" class="text-sm font-medium text-gray-700">Correo electrónico</label>
          <InputText id="email" v-model="email" type="email" class="w-full" placeholder="admin@erp-isp.test" />
        </div>
        <div class="space-y-1">
          <label for="password" class="text-sm font-medium text-gray-700">Contraseña</label>
          <InputText id="password" v-model="password" type="password" class="w-full" placeholder="password" />
        </div>
        <Button type="submit" :loading="loading" label="Ingresar" class="w-full" />
      </form>
    </div>
  </div>
</template>
