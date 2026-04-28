<script setup lang="ts">
import Card from 'primevue/card'
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <template #title>
          <div class="flex items-center gap-2 text-blue-600">
            <i class="pi pi-users text-xl" />
            <span class="text-sm font-medium">Clientes</span>
          </div>
        </template>
        <template #content>
          <p class="text-3xl font-bold">--</p>
        </template>
      </Card>
      <Card>
        <template #title>
          <div class="flex items-center gap-2 text-green-600">
            <i class="pi pi-file text-xl" />
            <span class="text-sm font-medium">Facturas</span>
          </div>
        </template>
        <template #content>
          <p class="text-3xl font-bold">--</p>
        </template>
      </Card>
      <Card>
        <template #title>
          <div class="flex items-center gap-2 text-orange-600">
            <i class="pi pi-credit-card text-xl" />
            <span class="text-sm font-medium">CxC Pendientes</span>
          </div>
        </template>
        <template #content>
          <p class="text-3xl font-bold">--</p>
        </template>
      </Card>
      <Card>
        <template #title>
          <div class="flex items-center gap-2 text-purple-600">
            <i class="pi pi-dollar text-xl" />
            <span class="text-sm font-medium">Pagos Hoy</span>
          </div>
        </template>
        <template #content>
          <p class="text-3xl font-bold">--</p>
        </template>
      </Card>
    </div>
  </div>
</template>
