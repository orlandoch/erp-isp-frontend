<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import Sidebar from '@/components/layout/Sidebar.vue'
import TopBar from '@/components/layout/TopBar.vue'

const auth = useAuthStore()
const router = useRouter()
const sidebarVisible = ref(true)

function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar :visible="sidebarVisible" />
    <div class="flex flex-col flex-1 min-w-0">
      <TopBar :user-name="auth.user?.name || ''" @toggle-sidebar="toggleSidebar" @logout="handleLogout" />
      <main class="flex-1 overflow-auto p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
