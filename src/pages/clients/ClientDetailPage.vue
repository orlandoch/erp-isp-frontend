<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { getClient, type Client } from '@/api/clients'

const route = useRoute()
const router = useRouter()
const client = ref<Client | null>(null)
const loading = ref(true)

onMounted(async () => {
  const id = Number(route.params.id)
  try {
    const res = await getClient(id)
    client.value = res.data
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="loading" class="text-center py-8 text-gray-500">Cargando...</div>
  <div v-else-if="client" class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ client.full_name }}</h1>
        <p class="text-sm text-gray-500">
          {{ client.document_type }} - {{ client.document_number }}
        </p>
      </div>
      <div class="flex gap-2">
        <Button label="Editar" icon="pi pi-pencil" severity="secondary" @click="router.push(`/clientes/${client.id}/editar`)" />
        <Button label="Volver" icon="pi pi-arrow-left" text @click="router.push('/clientes')" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Información General -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-info-circle text-primary" />
            <span>Información General</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-2 text-sm">
            <div><span class="font-medium">Nombres:</span> {{ client.first_name || '—' }}</div>
            <div><span class="font-medium">Apellidos:</span> {{ client.last_name || '—' }}</div>
            <div><span class="font-medium">Razón Social:</span> {{ client.business_name || '—' }}</div>
            <div><span class="font-medium">Tipo Doc.:</span> {{ client.document_type }}</div>
            <div><span class="font-medium">Número:</span> {{ client.document_number }}</div>
            <div>
              <span class="font-medium">Estado:</span>
              <Tag :value="client.is_active ? 'Activo' : 'Inactivo'" :severity="client.is_active ? 'success' : 'danger'" class="ml-2" />
            </div>
          </div>
        </template>
      </Card>

      <!-- Teléfonos -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-phone text-primary" />
            <span>Teléfonos ({{ client.phones?.length || 0 }})</span>
          </div>
        </template>
        <template #content>
          <div v-if="client.phones?.length" class="space-y-1 text-sm">
            <div v-for="(p, i) in client.phones" :key="i" class="flex items-center gap-2">
              <i class="pi pi-mobile text-gray-400" />
              <span>{{ p.number }} <span v-if="p.type" class="text-gray-400 text-xs">({{ p.type }})</span></span>
            </div>
          </div>
          <div v-else class="text-sm text-gray-400 italic">Sin teléfonos</div>
        </template>
      </Card>

      <!-- Emails -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-envelope text-primary" />
            <span>Correos ({{ client.emails?.length || 0 }})</span>
          </div>
        </template>
        <template #content>
          <div v-if="client.emails?.length" class="space-y-1 text-sm">
            <div v-for="(e, i) in client.emails" :key="i" class="flex items-center gap-2">
              <i class="pi pi-at text-gray-400" />
              <span>{{ e.email }} <span v-if="e.type" class="text-gray-400 text-xs">({{ e.type }})</span></span>
            </div>
          </div>
          <div v-else class="text-sm text-gray-400 italic">Sin correos</div>
        </template>
      </Card>
    </div>

    <!-- Direcciones -->
    <Card>
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-map-marker text-primary" />
          <span>Direcciones ({{ client.addresses?.length || 0 }})</span>
        </div>
      </template>
      <template #content>
        <div v-if="client.addresses?.length" class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div v-for="(a, i) in client.addresses" :key="i" class="border rounded p-3 bg-gray-50">
            <p class="text-sm">{{ a.address }}</p>
            <p v-if="a.reference" class="text-xs text-gray-500 mt-1">{{ a.reference }}</p>
          </div>
        </div>
        <div v-else class="text-sm text-gray-400 italic">Sin direcciones registradas</div>
      </template>
    </Card>
  </div>
</template>
