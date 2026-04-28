<script setup lang="ts">
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import Menu from 'primevue/menu'
import { ref } from 'vue'

defineProps<{ userName: string }>()
const emit = defineEmits<{ toggleSidebar: []; logout: [] }>()

const menu = ref()
const menuItems = ref([
  { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => emit('logout') },
])
</script>

<template>
  <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
    <div class="flex items-center gap-4">
      <Button icon="pi pi-bars" text severity="secondary" @click="emit('toggleSidebar')" />
      <span class="text-sm text-gray-500 hidden sm:inline">ERP ISP</span>
    </div>
    <div class="flex items-center gap-3">
      <Button icon="pi pi-bell" text severity="secondary" class="p-button-rounded" />
      <div class="flex items-center gap-2 cursor-pointer" @click="menu?.toggle()">
        <Avatar :label="userName.charAt(0).toUpperCase()" shape="circle" class="bg-primary text-white" size="small" />
        <span class="text-sm font-medium hidden sm:inline">{{ userName }}</span>
      </div>
      <Menu ref="menu" :model="menuItems" :popup="true" />
    </div>
  </header>
</template>
