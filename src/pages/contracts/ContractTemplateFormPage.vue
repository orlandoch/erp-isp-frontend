<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import {
  getContractTemplate,
  createContractTemplate,
  updateContractTemplate,
  getContractTemplateVariables,
} from '@/api/contractTemplates'
import type { ContractTemplate, ContractTemplateVariable } from '@/api/types'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const isEdit = computed(() => route.params.id && route.params.id !== 'new')
const templateId = computed(() => Number(route.params.id))

const saving = ref(false)
const loading = ref(false)
const form = ref<Partial<ContractTemplate>>({
  name: '',
  code: '',
  content: '',
  is_active: true,
  is_default: false,
})

const variables = ref<ContractTemplateVariable[]>([])
const selectedVariable = ref('')
const previewDialog = ref(false)
const previewContent = ref('')
const previewResult = ref('')

// Insertar variable en el cursor
function insertVariable(varKey: string) {
  form.value.content = (form.value.content || '') + `{{ ${varKey} }}`
  selectedVariable.value = ''
}

async function load() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const r = await getContractTemplate(templateId.value)
    form.value = { ...r.data }
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  } finally {
    loading.value = false
  }
}

async function loadVariables() {
  try {
    const r = await getContractTemplateVariables()
    variables.value = (r.data ?? []).filter(v => v.is_active)
  } catch { /* silent */ }
}

async function save() {
  saving.value = true
  try {
    if (isEdit.value) {
      await updateContractTemplate(templateId.value, form.value)
      toast.add({ severity: 'success', summary: 'Guardada', detail: 'Plantilla actualizada', life: 3000 })
    } else {
      await createContractTemplate(form.value)
      toast.add({ severity: 'success', summary: 'Creada', detail: 'Plantilla creada', life: 3000 })
    }
    router.push('/contracts/templates')
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push('/contracts/templates')
}

onMounted(() => {
  load()
  loadVariables()
})
</script>

<template>
  <div class="p-6">
    <div class="flex items-center gap-4 mb-6">
      <Button icon="pi pi-arrow-left" severity="secondary" rounded @click="goBack" />
      <h1 class="text-2xl font-bold text-slate-100">{{ isEdit ? 'Editar Plantilla' : 'Nueva Plantilla' }}</h1>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <i class="pi pi-spin pi-spinner text-4xl text-slate-400"></i>
    </div>

    <div v-else class="max-w-4xl space-y-6">
      <Card>
        <template #content>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1 text-slate-300">Nombre</label>
              <InputText v-model="form.name" class="w-full" placeholder="Ej: Plantilla Base" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-slate-300">Código</label>
              <InputText v-model="form.code" class="w-full" placeholder="Ej: default" />
            </div>
          </div>

          <div class="mt-4">
            <label class="block text-sm font-medium mb-1 text-slate-300">Variables disponibles</label>
            <div class="flex gap-2 flex-wrap mb-3">
              <Tag
                v-for="v in variables"
                :key="v.key"
                :value="v.key"
                severity="info"
                class="cursor-pointer hover:opacity-80"
                @click="insertVariable(v.key)"
                v-tooltip.top="v.label"
              />
              <span v-if="!variables.length" class="text-sm text-slate-500">No hay variables activas</span>
            </div>
          </div>

          <div class="mt-4">
            <label class="block text-sm font-medium mb-1 text-slate-300">Contenido de la plantilla</label>
            <small class="block text-slate-500 mb-2">
              Usa <code v-pre>{‌{ variable.key }}</code> para insertar datos dinámicos. Haz clic en una variable arriba para insertarla.
            </small>
            <Textarea v-model="form.content" class="w-full font-mono" rows="20" placeholder="Escribe el contenido de la plantilla aquí..." />
          </div>

          <div class="flex items-center gap-4 mt-4">
            <div class="flex items-center gap-2">
              <ToggleSwitch v-model="form.is_active" inputId="is_active" />
              <label for="is_active" class="text-sm text-slate-300">Activa</label>
            </div>
            <div class="flex items-center gap-2">
              <ToggleSwitch v-model="form.is_default" inputId="is_default" />
              <label for="is_default" class="text-sm text-slate-300">Por defecto</label>
            </div>
          </div>
        </template>
      </Card>

      <div class="flex justify-end gap-3">
        <Button label="Cancelar" severity="secondary" @click="goBack" />
        <Button label="Guardar" icon="pi pi-check" :loading="saving" @click="save" />
      </div>
    </div>
  </div>
</template>
