<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import InputSwitch from 'primevue/inputswitch'
import { useToast } from 'primevue/usetoast'
import { createClient, updateClient, getClient, type Client, type ClientPayload, type Phone, type Email, type Address } from '@/api/clients'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEdit = !!route.params.id
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const documentTypes = [
  { label: 'Cédula', value: '04' },
  { label: 'RUC', value: '05' },
  { label: 'Pasaporte', value: '06' },
  { label: 'Consumidor Final', value: '07' },
  { label: 'Ident. Exterior', value: '08' },
]

const phoneTypes = [
  { label: 'Móvil', value: 'mobile' },
  { label: 'Convencional', value: 'landline' },
  { label: 'Fax', value: 'fax' },
]

const emailTypes = [
  { label: 'Personal', value: 'personal' },
  { label: 'Trabajo', value: 'work' },
  { label: 'Facturación', value: 'billing' },
]

const form = ref({
  first_name: '',
  last_name: '',
  business_name: '',
  document_type: '05',
  document_number: '',
})

const phones = ref<Omit<Phone, 'id'>[]>([{ number: '', type: 'mobile', is_primary: false }])
const emails = ref<Omit<Email, 'id'>[]>([{ email: '', type: 'personal', is_primary: false }])
const addresses = ref<Omit<Address, 'id'>[]>([{ address: '', reference: '', is_primary: false }])

function addPhone() {
  phones.value.push({ number: '', type: 'mobile', is_primary: false })
}

function removePhone(index: number) {
  phones.value.splice(index, 1)
}

function addEmail() {
  emails.value.push({ email: '', type: 'personal', is_primary: false })
}

function removeEmail(index: number) {
  emails.value.splice(index, 1)
}

function addAddress() {
  addresses.value.push({ address: '', reference: '', is_primary: false })
}

function removeAddress(index: number) {
  addresses.value.splice(index, 1)
}

async function load() {
  if (!isEdit) return
  loading.value = true
  try {
    const res = await getClient(Number(route.params.id))
    const c = res.data
    form.value = {
      first_name: c.first_name || '',
      last_name: c.last_name || '',
      business_name: c.business_name || '',
      document_type: c.document_type || '05',
      document_number: c.document_number || '',
    }
    phones.value = c.phones?.length ? c.phones.map(p => ({ number: p.number, type: p.type || 'mobile', is_primary: p.is_primary || false })) : [{ number: '', type: 'mobile', is_primary: false }]
    emails.value = c.emails?.length ? c.emails.map(e => ({ email: e.email, type: e.type || 'personal', is_primary: e.is_primary || false })) : [{ email: '', type: 'personal', is_primary: false }]
    addresses.value = c.addresses?.length ? c.addresses.map(a => ({ address: a.address, reference: a.reference || '', latitude: a.latitude ?? null, longitude: a.longitude ?? null, is_primary: a.is_primary || false })) : [{ address: '', reference: '', is_primary: false }]
  } catch (e: any) {
    error.value = 'Error al cargar cliente'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  saving.value = true
  error.value = null
  const payload: ClientPayload = {
    ...form.value,
    phones: phones.value.filter(p => p.number.trim()),
    emails: emails.value.filter(e => e.email.trim()),
    addresses: addresses.value.filter(a => a.address.trim()),
  }
  try {
    if (isEdit) {
      await updateClient(Number(route.params.id), payload)
      toast.add({ severity: 'success', summary: 'Cliente actualizado', life: 3000 })
    } else {
      await createClient(payload)
      toast.add({ severity: 'success', summary: 'Cliente creado', life: 3000 })
    }
    router.push('/clientes')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al guardar cliente'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div v-if="loading" class="text-center py-8 text-gray-500">Cargando...</div>
  <div v-else class="max-w-3xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? 'Editar Cliente' : 'Nuevo Cliente' }}</h1>

    <Message v-if="error" severity="error" closable @close="error = null">{{ error }}</Message>

    <!-- Información General -->
    <Card>
      <template #title>Información General</template>
      <template #content>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-sm font-medium">Tipo de Documento *</label>
              <Select
                v-model="form.document_type"
                :options="documentTypes"
                optionLabel="label"
                optionValue="value"
                class="w-full"
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">Número de Documento *</label>
              <InputText v-model="form.document_number" class="w-full" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-sm font-medium">Nombres</label>
              <InputText v-model="form.first_name" class="w-full" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">Apellidos</label>
              <InputText v-model="form.last_name" class="w-full" />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium">Razón Social</label>
            <InputText v-model="form.business_name" class="w-full" />
          </div>

          <div class="flex justify-end pt-2">
            <Button type="submit" :loading="saving" :label="isEdit ? 'Actualizar Cliente' : 'Crear Cliente'" />
          </div>
        </form>
      </template>
    </Card>

    <!-- Teléfonos -->
    <Card>
      <template #title>
        <div class="flex items-center justify-between">
          <span>Teléfonos</span>
          <Button icon="pi pi-plus" severity="secondary" rounded size="small" @click="addPhone" />
        </div>
      </template>
      <template #content>
        <div v-if="!phones.length" class="text-sm text-gray-500 py-2">Sin teléfonos registrados</div>
        <div v-for="(phone, i) in phones" :key="i" class="flex items-center gap-2 mb-2">
          <InputText v-model="phone.number" placeholder="Número" class="flex-1" />
          <Select v-model="phone.type" :options="phoneTypes" optionLabel="label" optionValue="value" class="w-40" />
          <Button icon="pi pi-trash" severity="danger" rounded text @click="removePhone(i)" />
        </div>
      </template>
    </Card>

    <!-- Emails -->
    <Card>
      <template #title>
        <div class="flex items-center justify-between">
          <span>Correos Electrónicos</span>
          <Button icon="pi pi-plus" severity="secondary" rounded size="small" @click="addEmail" />
        </div>
      </template>
      <template #content>
        <div v-if="!emails.length" class="text-sm text-gray-500 py-2">Sin correos registrados</div>
        <div v-for="(email, i) in emails" :key="i" class="flex items-center gap-2 mb-2">
          <InputText v-model="email.email" placeholder="correo@ejemplo.com" class="flex-1" />
          <Select v-model="email.type" :options="emailTypes" optionLabel="label" optionValue="value" class="w-40" />
          <Button icon="pi pi-trash" severity="danger" rounded text @click="removeEmail(i)" />
        </div>
      </template>
    </Card>

    <!-- Direcciones -->
    <Card>
      <template #title>
        <div class="flex items-center justify-between">
          <span>Direcciones</span>
          <Button icon="pi pi-plus" severity="secondary" rounded size="small" @click="addAddress" />
        </div>
      </template>
      <template #content>
        <div v-if="!addresses.length" class="text-sm text-gray-500 py-2">Sin direcciones registradas</div>
        <div v-for="(addr, i) in addresses" :key="i" class="border rounded p-3 mb-2 space-y-2">
          <div class="flex items-center gap-2">
            <InputText v-model="addr.address" placeholder="Dirección" class="flex-1" />
            <Button icon="pi pi-trash" severity="danger" rounded text @click="removeAddress(i)" />
          </div>
          <InputText v-model="addr.reference" placeholder="Referencia (opcional)" class="w-full" />
        </div>
      </template>
    </Card>
  </div>
</template>
