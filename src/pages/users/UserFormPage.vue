<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUsersStore } from '@/stores/users'
import { useRolesStore } from '@/stores/roles'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Card from 'primevue/card'
import ToggleSwitch from 'primevue/toggleswitch'

const router = useRouter()
const route = useRoute()
const usersStore = useUsersStore()
const rolesStore = useRolesStore()

const isEdit = !!route.params.id
const saving = ref(false)
const error = ref<string | null>(null)

const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  is_active: true,
  roles: [] as number[],
})

onMounted(async () => {
  await rolesStore.fetchRoles()
  if (isEdit) {
    const user = usersStore.users.find(u => u.id === Number(route.params.id))
    if (user) {
      form.value.name = user.name
      form.value.email = user.email
      form.value.is_active = user.is_active
      form.value.roles = (user.roles || []).map(r => r.id)
    }
  }
})

async function submit() {
  saving.value = true
  error.value = null
  try {
    const payload: any = {
      name: form.value.name,
      email: form.value.email,
      is_active: form.value.is_active,
      roles: Array.isArray(form.value.roles) ? form.value.roles : [],
    }
    if (form.value.password) {
      payload.password = form.value.password
    }
    await usersStore.saveUser(isEdit ? Number(route.params.id) : null, payload)
    router.push('/usuarios')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al guardar usuario'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-4">
    <div class="flex items-center gap-2">
      <Button icon="pi pi-arrow-left" severity="secondary" text @click="router.push('/usuarios')" />
      <h1 class="text-2xl font-bold text-gray-800">{{ isEdit ? 'Editar Usuario' : 'Nuevo Usuario' }}</h1>
    </div>

    <Card>
      <template #content>
        <Message v-if="error" severity="error" class="mb-4">{{ error }}</Message>

        <form @submit.prevent="submit" class="space-y-4">
          <div class="space-y-1">
            <label class="text-sm font-medium text-gray-700">Nombre</label>
            <InputText v-model="form.name" class="w-full" required />
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium text-gray-700">Email</label>
            <InputText v-model="form.email" type="email" class="w-full" required />
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium text-gray-700">
              {{ isEdit ? 'Contraseña (dejar vacío para mantener)' : 'Contraseña' }}
            </label>
            <Password v-model="form.password" :feedback="true" class="w-full"
              :inputProps="{ class: 'w-full' }" :toggleMask="true" />
          </div>

          <div class="flex items-center gap-3">
            <ToggleSwitch v-model="form.is_active" inputId="is_active" />
            <label for="is_active" class="text-sm font-medium text-gray-700">Usuario activo</label>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium text-gray-700">Roles</label>
            <Select
              v-model="form.roles"
              :options="rolesStore.roles"
              optionLabel="name"
              optionValue="id"
              multiple
              class="w-full"
              placeholder="Seleccionar roles..."
            />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <Button label="Cancelar" severity="secondary" @click="router.push('/usuarios')" />
            <Button type="submit" :loading="saving" :label="isEdit ? 'Guardar Cambios' : 'Crear Usuario'" />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>
