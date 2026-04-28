<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import {
  getContractTemplateVariables,
  createContractTemplateVariable,
  updateContractTemplateVariable,
  deleteContractTemplateVariable,
} from '@/api/contractTemplates'
import type { ContractTemplateVariable } from '@/api/types'

const router = useRouter()
const route = useRoute()
const confirm = useConfirm()
const toast = useToast()

const variables = ref<ContractTemplateVariable[]>([])
const loading = ref(false)
const saving = ref(false)

// Formulario de variable (diálogo)
const dialog = ref(false)
const editingVariable = ref<ContractTemplateVariable | null>(null)
const varForm = ref<Partial<ContractTemplateVariable>>({
  key: '',
  label: '',
  group: 'General',
  data_type: 'string',
  example_value: '',
  is_active: true,
  sort_order: 0,
})

function openNew() {
  editingVariable.value = null
  varForm.value = { key: '', label: '', group: 'General', data_type: 'string', example_value: '', is_active: true, sort_order: 0 }
  dialog.value = true
}

function openEdit(v: ContractTemplateVariable) {
  editingVariable.value = v
  varForm.value = { ...v }
  dialog.value = true
}

async function saveVariable() {
  saving.value = true
  try {
    if (editingVariable.value) {
      await updateContractTemplateVariable(editingVariable.value.id, varForm.value)
      toast.add({ severity: 'success', summary: 'Actualizada', detail: 'Variable actualizada', life: 3000 })
    } else {
      await createContractTemplateVariable(varForm.value)
      toast.add({ severity: 'success', summary: 'Creada', detail: 'Variable creada', life: 3000 })
    }
    dialog.value = false
    await load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  } finally {
    saving.value = false
  }
}

function confirmDelete(v: ContractTemplateVariable) {
  confirm.require({
    message: `¿Eliminar la variable "${v.label}" (${v.key})?`,
    header: 'Confirmar',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await deleteContractTemplateVariable(v.id)
        toast.add({ severity: 'success', summary: 'Eliminada', detail: 'Variable eliminada', life: 3000 })
        await load()
      } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
      }
    },
  })
}

async function load() {
  loading.value = true
  try {
    const r = await getContractTemplateVariables()
    variables.value = r.data ?? []
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/contracts/templates')
}

onMounted(load)
</script>

<template>
  <div class="p-6">
    <div class="flex items-center gap-4 mb-6">
      <Button icon="pi pi-arrow-left" severity="secondary" rounded @click="goBack" />
      <h1 class="text-2xl font-bold text-slate-100">Variables de Plantilla</h1>
      <div class="flex-1"></div>
      <Button icon="pi pi-plus" label="Nueva Variable" @click="openNew" />
    </div>

    <DataTable :value="variables" :loading="loading" stripedRows paginator :rows="20" sortField="group" :sortOrder="1">
      <Column field="key" header="Key" sortable style="min-width:200px">
        <template #body="{ data }">
          <code class="text-sm bg-slate-700 px-1 rounded">{{ data.token }}</code>
        </template>
      </Column>
      <Column field="label" header="Etiqueta" sortable />
      <Column field="group" header="Grupo" sortable style="width:120px">
        <template #body="{ data }">
          <Tag :value="data.group" severity="info" />
        </template>
      </Column>
      <Column field="data_type" header="Tipo" style="width:100px">
        <template #body="{ data }">
          <Tag :value="data.data_type" severity="warn" />
        </template>
      </Column>
      <Column field="example_value" header="Ejemplo" />
      <Column header="Activa" style="width:80px">
        <template #body="{ data }">
          <i :class="data.is_active ? 'pi pi-check text-green-400' : 'pi pi-times text-slate-500'" />
        </template>
      </Column>
      <Column header="Acciones" style="width:120px">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-pencil" severity="secondary" rounded @click="openEdit(data)" v-tooltip.left="'Editar'" />
            <Button icon="pi pi-trash" severity="danger" rounded @click="confirmDelete(data)" v-tooltip.left="'Eliminar'" />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Dialog para crear/editar variable -->
    <Dialog v-model:visible="dialog" :header="editingVariable ? 'Editar Variable' : 'Nueva Variable'" :modal="true" :style="{ width: '500px' }">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1 text-slate-300">Key (identificador)</label>
          <InputText v-model="varForm.key" class="w-full" placeholder="Ej: client.full_name" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-slate-300">Etiqueta</label>
          <InputText v-model="varForm.label" class="w-full" placeholder="Ej: Nombre completo del cliente" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1 text-slate-300">Grupo</label>
            <InputText v-model="varForm.group" class="w-full" placeholder="Ej: Cliente" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-slate-300">Tipo de dato</label>
            <Select v-model="varForm.data_type" :options="['string','number','date','boolean']" class="w-full" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-slate-300">Valor de ejemplo</label>
          <InputText v-model="varForm.example_value" class="w-full" placeholder="Ej: Juan Pérez" />
        </div>
        <div class="flex items-center gap-2">
          <ToggleSwitch v-model="varForm.is_active" inputId="var_active" />
          <label for="var_active" class="text-sm text-slate-300">Activa</label>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="dialog = false" />
        <Button label="Guardar" icon="pi pi-check" :loading="saving" @click="saveVariable" />
      </template>
    </Dialog>
  </div>
</template>
