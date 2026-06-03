<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/client'

const route = useRoute()
const contractId = Number(route.params.id)
const versionId = route.params.versionId ? Number(route.params.versionId) : null
const renderedText = ref<string>('')
const loading = ref(true)
const error = ref('')
const contractCode = ref('')

onMounted(async () => {
  try {
    if (versionId) {
      // Load specific version
      const res = await api.get(`/contracts/${contractId}/versions/${versionId}`)
      const text = res.data.data?.rendered_contract_text || ''
      if (!text) {
        error.value = 'Esta versión no tiene texto renderizado disponible.'
        return
      }
      renderedText.value = text
    } else {
      // Load latest version from contract
      const res = await api.get(`/contracts/${contractId}`)
      contractCode.value = res.data.data?.code || ''
      const version = res.data.data?.current_version
      const text = version?.rendered_contract_text || ''
      if (!text) {
        error.value = 'Este contrato no tiene texto renderizado disponible.'
        return
      }
      renderedText.value = text
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error al cargar el contrato.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-white p-8">
    <div v-if="loading" class="flex justify-center items-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-primary" />
      <span class="ml-3 text-lg text-gray-500">Cargando contrato...</span>
    </div>
    <div v-else-if="error" class="flex flex-col items-center justify-center py-20 gap-4">
      <i class="pi pi-exclamation-triangle text-5xl text-yellow-500" />
      <p class="text-lg text-gray-600">{{ error }}</p>
      <Button label="Volver" icon="pi pi-arrow-left" severity="secondary" @click="$router.back()" />
    </div>
    <div v-else class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-4">
        <Button
          label="Volver"
          icon="pi pi-arrow-left"
          severity="secondary"
          text
          @click="$router.back()"
        />
        <Button
          label="Descargar PDF"
          icon="pi pi-download"
          severity="info"
          @click="window.open(versionId ? `/api/v1/contracts/${contractId}/versions/${versionId}/pdf` : `/api/v1/contracts/${contractId}/pdf`, '_blank')"
        />
      </div>
      <div class="contract-document border rounded-lg p-8 shadow-sm bg-white leading-relaxed whitespace-pre-wrap font-sans text-gray-900 text-base">
        {{ renderedText }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.contract-document {
  font-family: 'Times New Roman', Times, serif;
  line-height: 1.6;
}
</style>
