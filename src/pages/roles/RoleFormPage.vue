<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRolesStore } from '@/stores/roles'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Card from 'primevue/card'

const router = useRouter()
const route = useRoute()
const rolesStore = useRolesStore()
const isEdit = !!route.params.id
const saving = ref(false)
const error = ref<string | null>(null)

const form = ref({
  code: '',
  name: '',
  description: '',
})

onMounted(async () => {
  if (isEdit) {
    const role = rolesStore.roles.find(r => r.id === Number(route.params.id))
    if (role) {
      form.value.code = role.code
      form.value.name = role.name
      form.value.description = role.description || ''
    }
  }
})

async function submit() {
  saving.value = true
  error.value = null
  try {
    await rolesStore.saveRole(isEdit ? Number(route.params.id) : null, form.value)
    router.push('/roles')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al guardar rol'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-4">
    <div class="flex items-center gap-2">
      <Button icon="pi pi-arrow-left" severity="secondary" text @click="router.push('/roles')" />
      <h1 class="text-2xl font-bold text-gray-800">{{ isEdit ? 'Editar Rol' : 'Nuevo Rol' }}</h1>
    </div>

    <Card>
      <template #content>
        <Message v-if="error" severity="error" class="mb-4">{{ error }}</Message>

        <form @submit.prevent="submit" class="space-y-4">
          <div class="space-y-1">
            <label class="text-sm font-medium text-gray-700">Código</label>
            <InputText v-model="form.code" class="w-full" required placeholder="ej: operator" :disabled="isEdit" />
            <p class="text-xs text-gray-400">Identificador único del rol (solo letras, números y guiones)</p>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium text-gray-700">Nombre</label>
            <InputText v-model="form.name" class="w-full" required placeholder="ej: Operador" />
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium text-gray-700">Descripción</label>
            <Textarea v-model="form.description" class="w-full" rows={3} placeholder="¿Qué puede hacer este rol?" />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <Button label="Cancelar" severity="secondary" @click="router.push('/roles')" />
            <Button type="submit" :loading="saving" :label="isEdit ? 'Guardar Cambios' : 'Crear Rol'" />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>
