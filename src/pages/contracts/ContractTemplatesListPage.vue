<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import {
  getContractTemplates,
  deleteContractTemplate,
  setDefaultContractTemplate,
} from '@/api/contractTemplates'
import type { ContractTemplate } from '@/api/types'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

const templates = ref<ContractTemplate[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const r = await getContractTemplates()
    templates.value = r.data ?? []
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  } finally {
    loading.value = false
  }
}

function goNew() {
  router.push('/contracts/templates/new')
}

function goEdit(id: number) {
  router.push(`/contracts/templates/${id}/edit`)
}

function goVariables(id: number) {
  router.push(`/contracts/templates/${id}/variables`)
}

function confirmDelete(tpl: ContractTemplate) {
  confirm.require({
    message: `¿Eliminar la plantilla "${tpl.name}"?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await deleteContractTemplate(tpl.id)
        toast.add({ severity: 'success', summary: 'Eliminada', detail: 'Plantilla eliminada', life: 3000 })
        await load()
      } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
      }
    },
  })
}

function confirmSetDefault(tpl: ContractTemplate) {
  confirm.require({
    message: `¿Establecer "${tpl.name}" como plantilla por defecto?`,
    header: 'Confirmar',
    icon: 'pi pi-check-circle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Sí, establecer',
    accept: async () => {
      try {
        await setDefaultContractTemplate(tpl.id)
        toast.add({ severity: 'success', summary: 'Actualizada', detail: 'Plantilla por defecto actualizada', life: 3000 })
        await load()
      } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
      }
    },
  })
}

onMounted(load)
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-slate-100">Plantillas de Contrato</h1>
      <Button label="Nueva Plantilla" icon="pi pi-plus" @click="goNew" />
    </div>

    <DataTable :value="templates" :loading="loading" stripedRows paginator :rows="20" sortField="name" :sortOrder="1">
      <Column field="name" header="Nombre" sortable />
      <Column field="code" header="Código" sortable />
      <Column header="Por defecto" style="width:100px">
        <template #body="{ data }">
          <Tag v-if="data.is_default" severity="success" value="Sí" />
          <Tag v-else severity="secondary" value="No" />
        </template>
      </Column>
      <Column header="Activa" style="width:100px">
        <template #body="{ data }">
          <Tag v-if="data.is_active" severity="info" value="Activa" />
          <Tag v-else severity="warn" value="Inactiva" />
        </template>
      </Column>
      <Column header="Acciones" style="width:250px">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-pencil" severity="secondary" rounded @click="goEdit(data.id)" v-tooltip.left="'Editar'"
              v-if="!data.is_default" />
            <Button icon="pi pi-star" severity="contrast" rounded @click="confirmSetDefault(data)"
              v-tooltip.left="'Marcar como por defecto'" v-if="!data.is_default" />
            <Button icon="pi pi-tag" severity="info" rounded @click="goVariables(data.id)" v-tooltip.left="'Variables'" />
            <Button icon="pi pi-trash" severity="danger" rounded @click="confirmDelete(data)" v-tooltip.left="'Eliminar'" />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
