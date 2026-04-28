<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'
import type { Iva } from '@/api/ivas'
import type { SystemSetting } from '@/api/settings'
import { getSettings } from '@/api/settings'
import {
  getEstablishments,
  createEstablishment,
  updateEstablishment,
  deleteEstablishment,
  createEmissionPoint,
  updateEmissionPoint,
  deleteEmissionPoint,
  type Establishment,
  type EmissionPoint,
} from '@/api/establishments'

const toast = useToast()
const activeSection = ref('general')
const globalError = ref<string | null>(null)

const sections = [
  { key: 'general', label: 'Generales', icon: 'pi pi-cog' },
  { key: 'invoicing', label: 'Facturación', icon: 'pi pi-file' },
  { key: 'sri', label: 'SRI', icon: 'pi pi-qrcode' },
  { key: 'branches', label: 'Sucursales', icon: 'pi pi-building' },
  { key: 'sri-urls', label: 'URLs SRI', icon: 'pi pi-globe' },
]

/* === Load state === */
const loading = ref(true)

/* ── General (ElectronicIssuer via settings + establishments) ── */
const general = ref({
  business_name: '',
  tradename: '',
  ruc: '',
  address: '',
  phone: '',
  email: '',
  special_contributor: '',
})

/* ── IVAs ── */
const ivas = ref<Iva[]>([])
const selectedIvaId = ref<number | null>(null)

async function loadIvas() {
  try {
    const res = await api.get('/ivas')
    const raw = res?.data
    const list = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : [])
    ivas.value = list
    // Only use default IVA if no saved setting
    if (!selectedIvaId.value) {
      const def = ivas.value.find(i => i.is_default)
      if (def) selectedIvaId.value = def.id
    }
  } catch { ivas.value = [] }
}

/* ── System settings ── */
const systemSettings = ref<SystemSetting[]>([])
const creditDays = ref(30)
const sriEnvironment = ref('1')
const sriEmissionType = ref('1')

async function loadSystemSettings() {
  try {
    const res = await getSettings()
    const raw = res?.data
    systemSettings.value = Array.isArray(raw) ? raw : []
    const kv = (k: string, fallback = '') => {
      const s = systemSettings.value.find(s => s.key === k)
      return s ? s.value : fallback
    }
    general.value.business_name = kv('business_name', '')
    general.value.tradename = kv('tradename', '')
    general.value.ruc = kv('ruc', '')
    general.value.address = kv('address', '')
    general.value.phone = kv('phone', '')
    general.value.email = kv('email', '')
    general.value.special_contributor = kv('special_contributor', '')
    creditDays.value = parseInt(kv('credit_days', '30'), 10) || 30
    sriEnvironment.value = kv('sri_environment', '1')
    sriEmissionType.value = kv('sri_emission_type', '1')
    const ivaId = kv('default_iva_id', '')
    if (ivaId) selectedIvaId.value = parseInt(ivaId, 10)
  } catch (e) {
    console.error('loadSystemSettings error', e)
    globalError.value = 'Error al cargar configuración del sistema: ' + (e as Error).message
  }
}

async function saveSystemSetting(key: string, value: string) {
  try {
    await api.post('/settings', { key, value, group: 'system' })
  } catch (e: any) {
    throw new Error(`Error guardando ${key}: ${e?.response?.data?.message || e.message}`)
  }
}

async function saveGeneral() {
  try {
    for (const [k, v] of Object.entries(general.value)) {
      await saveSystemSetting(k, v)
    }
    await loadSystemSettings()
    toast.add({ severity: 'success', summary: 'Datos generales guardados', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.message || 'Error al guardar datos generales', life: 5000 })
  }
}

async function saveInvoicing() {
  try {
    await saveSystemSetting('default_iva_id', String(selectedIvaId.value ?? ''))
    await saveSystemSetting('credit_days', String(creditDays.value))
    await loadSystemSettings()
    toast.add({ severity: 'success', summary: 'Configuración de facturación guardada', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.message || 'Error al guardar facturación', life: 5000 })
  }
}

async function saveSri() {
  try {
    await saveSystemSetting('sri_environment', sriEnvironment.value)
    await saveSystemSetting('sri_emission_type', sriEmissionType.value)
    await loadSystemSettings()
    toast.add({ severity: 'success', summary: 'Configuración SRI guardada', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.message || 'Error al guardar SRI', life: 5000 })
  }
}

/* ── Branches ── */
const establishments = ref<Establishment[]>([])
const expandedEst = ref<Record<number, boolean>>({})

async function loadEstablishments() {
  try {
    const res = await getEstablishments()
    // getEstablishments returns { success, data: Establishment[] }
    let list = Array.isArray(res?.data) ? res.data : []
    // Sort establishments by ascending code
    list.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
    // Sort emission points within each establishment by ascending code
    for (const est of list) {
      if (est.emission_points) {
        est.emission_points.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
      }
    }
    establishments.value = list
  } catch (e) {
    console.error('loadEstablishments error', e)
    globalError.value = 'Error al cargar sucursales: ' + (e as Error).message
  }
}

async function addEstablishment() {
  try {
    const res = await createEstablishment({
      issuer_id: 1,
      code: '001',
      name: 'Nueva sucursal',
      address: '',
    })
    // res is { success, data: Establishment }
    if (res?.data) {
      establishments.value.push(res.data)
      establishments.value.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
    }
    toast.add({ severity: 'success', summary: 'Sucursal creada', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e?.response?.data?.message || 'Error al crear sucursal', life: 5000 })
  }
}

async function removeEstablishment(est: Establishment) {
  if (!est.id) return
  await deleteEstablishment(est.id)
  establishments.value = establishments.value.filter(e => e.id !== est.id)
  toast.add({ severity: 'success', summary: 'Sucursal eliminada', life: 3000 })
}

async function addEmissionPoint(est: Establishment) {
  if (!est.id) return
  try {
    const res = await createEmissionPoint({ establishment_id: est.id, code: '001', name: 'Nuevo punto' })
    if (res?.data) {
      if (!est.emission_points) est.emission_points = []
      est.emission_points.push(res.data)
      est.emission_points.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
    }
    toast.add({ severity: 'success', summary: 'Punto de emisión creado', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e?.response?.data?.message || 'Error al crear punto de emisión', life: 5000 })
  }
}

async function removeEmissionPoint(est: Establishment, ep: EmissionPoint) {
  if (!ep.id) return
  await deleteEmissionPoint(ep.id)
  if (est.emission_points) {
    est.emission_points = est.emission_points.filter(e => e.id !== ep.id)
  }
  toast.add({ severity: 'success', summary: 'Punto de emisión eliminado', life: 3000 })
}

/* ── URLs SRI ── */
const sriUrls = ref({
  pruebas: {
    recepcion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantes?wsdl',
    autorizacion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantes?wsdl',
  },
  produccion: {
    recepcion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantes?wsdl',
    autorizacion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantes?wsdl',
  },
})

const showConfirmDialog = ref(false)
const confirmCode = ref('')
const userCode = ref('')
const sriEditSnapshot = ref<{ env: 'pruebas' | 'produccion'; field: 'recepcion' | 'autorizacion' } | null>(null)

/* ── Confirm dialogs for branch / emission point / sequences ── */
const showEdConfirmDialog = ref<'est' | 'ep' | 'seq' | 'general' | 'invoicing' | 'sri' | null>(null)
const showEdDialogVisible = computed({
  get: () => showEdConfirmDialog.value !== null,
  set: (v: boolean) => { if (!v) showEdConfirmDialog.value = null },
})
const edConfirmCode = ref('')
const edUserCode = ref('')
const edTargetEst = ref<Establishment | null>(null)
const edTargetEp = ref<EmissionPoint | null>(null)
const edBackupEst = ref<Establishment | null>(null)
const edBackupEp = ref<EmissionPoint | null>(null)

function openEstEditConfirm(est: Establishment) {
  edTargetEst.value = { ...est }
  edBackupEst.value = JSON.parse(JSON.stringify(est))
  edConfirmCode.value = String(Math.floor(100000 + Math.random() * 900000))
  edUserCode.value = ''
  showEdConfirmDialog.value = 'est'
}

function openEpEditConfirm(ep: EmissionPoint) {
  edTargetEp.value = { ...ep }
  edBackupEp.value = JSON.parse(JSON.stringify(ep))
  edConfirmCode.value = String(Math.floor(100000 + Math.random() * 900000))
  edUserCode.value = ''
  showEdConfirmDialog.value = 'ep'
}

function openSeqEditConfirm(ep: EmissionPoint) {
  edTargetEp.value = { ...ep }
  edBackupEp.value = JSON.parse(JSON.stringify(ep))
  edConfirmCode.value = String(Math.floor(100000 + Math.random() * 900000))
  edUserCode.value = ''
  showEdConfirmDialog.value = 'seq'
}

function cancelEdEdit() {
  if (showEdConfirmDialog.value === 'est' && edBackupEst.value && edTargetEst.value?.id) {
    for (const est of establishments.value) {
      if (est.id === edTargetEst.value.id) {
        est.code = edBackupEst.value.code
        est.name = edBackupEst.value.name
        est.address = edBackupEst.value.address
        break
      }
    }
  } else if (edTargetEp.value?.id && edBackupEp.value) {
    for (const est of establishments.value) {
      const idx = (est.emission_points || []).findIndex(e => e.id === edTargetEp.value.id)
      if (idx !== -1) {
        est.emission_points[idx].code = edBackupEp.value.code
        est.emission_points[idx].name = edBackupEp.value.name
        est.emission_points[idx].invoice_sequence = edBackupEp.value.invoice_sequence
        est.emission_points[idx].liquidation_sequence = edBackupEp.value.liquidation_sequence
        est.emission_points[idx].credit_note_sequence = edBackupEp.value.credit_note_sequence
        est.emission_points[idx].debit_note_sequence = edBackupEp.value.debit_note_sequence
        est.emission_points[idx].guide_sequence = edBackupEp.value.guide_sequence
        est.emission_points[idx].retention_sequence = edBackupEp.value.retention_sequence
        break
      }
    }
  }
  showEdConfirmDialog.value = null
  edTargetEst.value = null
  edTargetEp.value = null
  edBackupEst.value = null
  edBackupEp.value = null
}

async function confirmEdSave() {
  if (edUserCode.value !== edConfirmCode.value) {
    toast.add({ severity: 'error', summary: 'Código incorrecto', life: 3000 })
    return
  }

  try {
    if (showEdConfirmDialog.value === 'est' && edTargetEst.value?.id) {
      await updateEstablishment(edTargetEst.value.id, {
        code: edTargetEst.value.code,
        name: edTargetEst.value.name,
        address: edTargetEst.value.address,
      })
      toast.add({ severity: 'success', summary: 'Sucursal actualizada', life: 3000 })
    } else if (showEdConfirmDialog.value === 'ep' && edTargetEp.value?.id) {
      await updateEmissionPoint(edTargetEp.value.id, {
        code: edTargetEp.value.code,
        name: edTargetEp.value.name,
      })
      toast.add({ severity: 'success', summary: 'Punto de emisión actualizado', life: 3000 })
    } else if (showEdConfirmDialog.value === 'seq' && edTargetEp.value?.id) {
      await updateEmissionPoint(edTargetEp.value.id, {
        invoice_sequence: edTargetEp.value.invoice_sequence,
        liquidation_sequence: edTargetEp.value.liquidation_sequence,
        credit_note_sequence: edTargetEp.value.credit_note_sequence,
        debit_note_sequence: edTargetEp.value.debit_note_sequence,
        guide_sequence: edTargetEp.value.guide_sequence,
        retention_sequence: edTargetEp.value.retention_sequence,
      })
      toast.add({ severity: 'success', summary: 'Secuenciales guardados', life: 3000 })
    } else if (showEdConfirmDialog.value === 'general') {
      // Save all general fields in parallel
      await Promise.all(Object.entries(general.value).map(([k, v]) => saveSystemSetting(k, v)))
      await loadSystemSettings()
      toast.add({ severity: 'success', summary: 'Datos generales guardados', life: 3000 })
    } else if (showEdConfirmDialog.value === 'invoicing') {
      await Promise.all([
        saveSystemSetting('default_iva_id', String(selectedIvaId.value ?? '')),
        saveSystemSetting('credit_days', String(creditDays.value)),
      ])
      await loadSystemSettings()
      toast.add({ severity: 'success', summary: 'Configuración de facturación guardada', life: 3000 })
    } else if (showEdConfirmDialog.value === 'sri') {
      await Promise.all([
        saveSystemSetting('sri_environment', sriEnvironment.value),
        saveSystemSetting('sri_emission_type', sriEmissionType.value),
      ])
      await loadSystemSettings()
      toast.add({ severity: 'success', summary: 'Configuración SRI guardada', life: 3000 })
    }
    showEdConfirmDialog.value = null
    edTargetEst.value = null
    edTargetEp.value = null
    edBackupEst.value = null
    edBackupEp.value = null
  } catch {
    const label = showEdConfirmDialog.value === 'seq' ? 'secuenciales' : showEdConfirmDialog.value === 'ep' ? 'punto de emisión' : showEdConfirmDialog.value === 'est' ? 'sucursal' : 'configuración'
    toast.add({ severity: 'error', summary: `Error al guardar ${label}`, life: 5000 })
  }
}

function openGeneralConfirm() {
  edConfirmCode.value = String(Math.floor(100000 + Math.random() * 900000))
  edUserCode.value = ''
  showEdConfirmDialog.value = 'general'
}

function openInvoicingConfirm() {
  edConfirmCode.value = String(Math.floor(100000 + Math.random() * 900000))
  edUserCode.value = ''
  showEdConfirmDialog.value = 'invoicing'
}

function openSriSectionConfirm() {
  edConfirmCode.value = String(Math.floor(100000 + Math.random() * 900000))
  edUserCode.value = ''
  showEdConfirmDialog.value = 'sri'
}

function promptSriUrlChange(env: 'pruebas' | 'produccion', field: 'recepcion' | 'autorizacion') {
  sriEditSnapshot.value = { env, field }
  confirmCode.value = String(Math.floor(100000 + Math.random() * 900000))
  userCode.value = ''
  showConfirmDialog.value = true
}

async function confirmSriUrlChange() {
  if (userCode.value !== confirmCode.value) {
    toast.add({ severity: 'error', summary: 'Código incorrecto', life: 3000 })
    return
  }
  const snap = sriEditSnapshot.value
  if (!snap) return
  const key = `${snap.env}_sri_${snap.field}_url`
  const val = sriUrls.value[snap.env][snap.field]
  try {
    await saveSystemSetting(key, val)
    toast.add({ severity: 'success', summary: 'URL SRI actualizada', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error al guardar URL', life: 3000 })
  }
  showConfirmDialog.value = false
  sriEditSnapshot.value = null
}

async function loadSriUrls() {
  const kv = (k: string, fallback: string) => systemSettings.value.find(s => s.key === k)?.value ?? fallback
  sriUrls.value.pruebas.recepcion = kv('pruebas_sri_recepcion_url', sriUrls.value.pruebas.recepcion)
  sriUrls.value.pruebas.autorizacion = kv('pruebas_sri_autorizacion_url', sriUrls.value.pruebas.autorizacion)
  sriUrls.value.produccion.recepcion = kv('produccion_sri_recepcion_url', sriUrls.value.produccion.recepcion)
  sriUrls.value.produccion.autorizacion = kv('produccion_sri_autorizacion_url', sriUrls.value.produccion.autorizacion)
}

onMounted(async () => {
  loading.value = true
  // Load sequentially to avoid race conditions
  await loadSystemSettings()
  await loadIvas()
  await loadEstablishments()
  loadSriUrls()
  loading.value = false
})
</script>

<template>
  <div class="flex gap-6">
    <!-- Sidebar -->
    <div class="w-56 shrink-0 space-y-1">
      <button
        v-for="s in sections"
        :key="s.key"
        class="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-left transition-colors"
        :class="activeSection === s.key ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'"
        @click="activeSection = s.key"
      >
        <i :class="s.icon" />
        {{ s.label }}
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 space-y-6">
      <h1 class="text-2xl font-bold text-gray-900">Configuración</h1>

      <Message v-if="globalError" severity="error" closable @close="globalError = null">{{ globalError }}</Message>

      <template v-if="loading">
        <div class="text-center py-12 text-gray-400">Cargando configuración...</div>
      </template>

      <template v-else>
        <!-- ===== General ===== -->
        <Card v-if="activeSection === 'general'">
          <template #title>
            <div class="flex items-center gap-2"><i class="pi pi-building text-blue-500" /><span>Datos del emisor</span></div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-sm font-medium text-gray-700">Razón social</label>
                <InputText v-model="general.business_name" class="w-full" />
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium text-gray-700">Nombre comercial</label>
                <InputText v-model="general.tradename" class="w-full" />
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium text-gray-700">RUC</label>
                <InputText v-model="general.ruc" class="w-full" />
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium text-gray-700">Teléfono</label>
                <InputText v-model="general.phone" class="w-full" />
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium text-gray-700">Email</label>
                <InputText v-model="general.email" class="w-full" />
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium text-gray-700">Contribuyente especial</label>
                <InputText v-model="general.special_contributor" class="w-full" placeholder="Resolución SRI" />
              </div>
              <div class="space-y-1 md:col-span-2">
                <label class="text-sm font-medium text-gray-700">Dirección matriz</label>
                <InputText v-model="general.address" class="w-full" />
              </div>
            </div>
            <div class="flex justify-end mt-4">
              <Button label="Guardar datos generales" icon="pi pi-save" @click="openGeneralConfirm" />
            </div>
          </template>
        </Card>

        <!-- ===== Facturación ===== -->
        <Card v-if="activeSection === 'invoicing'">
          <template #title>
            <div class="flex items-center gap-2"><i class="pi pi-file text-orange-500" /><span>Parámetros de facturación</span></div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-sm font-medium text-gray-700">Tipo de IVA por defecto</label>
                <Select
                  v-model="selectedIvaId"
                  :options="ivas"
                  optionLabel="name"
                  optionValue="id"
                  class="w-full"
                  :loading="ivas.length === 0"
                >
                  <template #option="{ option }">
                    <span>{{ option.name }} ({{ option.percentage }}%)</span>
                  </template>
                </Select>
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium text-gray-700">Días de crédito por defecto</label>
                <InputNumber v-model="creditDays" :min="0" class="w-full" />
              </div>
            </div>
            <div class="flex justify-end mt-4">
              <Button label="Guardar facturación" icon="pi pi-save" @click="openInvoicingConfirm" />
            </div>
          </template>
        </Card>

        <!-- ===== SRI ===== -->
        <Card v-if="activeSection === 'sri'">
          <template #title>
            <div class="flex items-center gap-2"><i class="pi pi-qrcode text-purple-500" /><span>Configuración SRI</span></div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-sm font-medium text-gray-700">Ambiente</label>
                <Select
                  v-model="sriEnvironment"
                  :options="[{ label: 'Pruebas', value: '1' }, { label: 'Producción', value: '2' }]"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                />
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium text-gray-700">Tipo de emisión</label>
                <Select
                  v-model="sriEmissionType"
                  :options="[{ label: 'Normal', value: '1' }, { label: 'Contingencia', value: '2' }]"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                />
              </div>
            </div>
            <div class="flex justify-end mt-4">
              <Button label="Guardar SRI" icon="pi pi-save" @click="openSriSectionConfirm" />
            </div>
          </template>
        </Card>

        <!-- ===== Sucursales ===== -->
        <Card v-if="activeSection === 'branches'">
          <template #title>
            <div class="flex items-center gap-2"><i class="pi pi-building text-teal-500" /><span>Sucursales y puntos de emisión</span></div>
          </template>
          <template #content>
            <div class="space-y-4">
              <Button label="Nueva sucursal" icon="pi pi-plus" size="small" @click="addEstablishment" />

              <div v-for="est in establishments" :key="est.id" class="border rounded-lg overflow-hidden">
                <!-- Establishment -->
                <div class="flex items-center gap-2 p-3 bg-gray-50 border-b">
                  <Button
                    :icon="expandedEst[est.id!] ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                    text
                    size="small"
                    @click="expandedEst[est.id!] = !expandedEst[est.id!]"
                  />
                  <InputText v-model="est.code" placeholder="001" class="w-16 font-mono text-sm" />
                  <InputText v-model="est.name" placeholder="Nombre sucursal" class="flex-1 text-sm" />
                  <InputText v-model="est.address" placeholder="Dirección" class="flex-1 text-sm hidden md:block" />
                  <Button icon="pi pi-check" severity="warning" size="small" rounded @click="openEstEditConfirm(est)" />
                  <Button icon="pi pi-trash" text severity="danger" size="small" @click="removeEstablishment(est)" />
                </div>

                <!-- Emission points -->
                <div v-if="expandedEst[est.id!]" class="p-3 space-y-3">
                  <Button label="Nuevo punto de emisión" icon="pi pi-plus" severity="secondary" size="small" @click="addEmissionPoint(est)" />

                  <div v-for="ep in (est.emission_points || [])" :key="ep.id" class="border rounded p-3 bg-white space-y-3">
                    <div class="flex items-center gap-2">
                      <InputText v-model="ep.code" placeholder="001" class="w-16 font-mono text-sm" />
                      <InputText v-model="ep.name" placeholder="Nombre del punto" class="flex-1 text-sm" />
                      <Button icon="pi pi-check" severity="warning" size="small" rounded @click="openEpEditConfirm(ep)" />
                      <Button icon="pi pi-trash" text severity="danger" size="small" @click="removeEmissionPoint(est, ep)" />
                    </div>

                    <!-- Secuenciales por tipo de documento -->
                    <div class="ml-2 space-y-1">
                      <div class="flex items-center justify-between mb-1">
                        <span class="text-xs font-medium text-gray-500">Secuenciales</span>
                        <Button
                          label="Guardar secuenciales"
                          icon="pi pi-shield"
                          size="small"
                          severity="danger"
                          @click="openSeqConfirmDialog(ep)"
                        />
                      </div>
                      <div class="space-y-0.5">
                        <div class="flex items-center gap-2 bg-gray-50 rounded px-2 py-1">
                          <span class="text-xs text-gray-500 w-56">Factura</span>
                          <InputNumber v-model="ep.invoice_sequence" :min="0" class="w-24" />
                        </div>
                        <div class="flex items-center gap-2 bg-gray-50 rounded px-2 py-1">
                          <span class="text-xs text-gray-500 w-56">Liquidación de compra de bienes y prestación de servicios</span>
                          <InputNumber v-model="ep.liquidation_sequence" :min="0" class="w-24" />
                        </div>
                        <div class="flex items-center gap-2 bg-gray-50 rounded px-2 py-1">
                          <span class="text-xs text-gray-500 w-56">Nota de crédito</span>
                          <InputNumber v-model="ep.credit_note_sequence" :min="0" class="w-24" />
                        </div>
                        <div class="flex items-center gap-2 bg-gray-50 rounded px-2 py-1">
                          <span class="text-xs text-gray-500 w-56">Nota de débito</span>
                          <InputNumber v-model="ep.debit_note_sequence" :min="0" class="w-24" />
                        </div>
                        <div class="flex items-center gap-2 bg-gray-50 rounded px-2 py-1">
                          <span class="text-xs text-gray-500 w-56">Guía de remisión</span>
                          <InputNumber v-model="ep.guide_sequence" :min="0" class="w-24" />
                        </div>
                        <div class="flex items-center gap-2 bg-gray-50 rounded px-2 py-1">
                          <span class="text-xs text-gray-500 w-56">Comprobante de retención</span>
                          <InputNumber v-model="ep.retention_sequence" :min="0" class="w-24" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="!est.emission_points || est.emission_points.length === 0" class="text-sm text-gray-400 italic">
                    Sin puntos de emisión. Cree uno para empezar.
                  </div>
                </div>
              </div>

              <div v-if="establishments.length === 0" class="text-center py-8 text-gray-400 text-sm">
                No hay sucursales registradas.
              </div>
            </div>
          </template>
        </Card>

        <!-- ===== URLs SRI ===== -->
        <Card v-if="activeSection === 'sri-urls'">
          <template #title>
            <div class="flex items-center gap-2"><i class="pi pi-globe text-cyan-500" /><span>URLs de servicios SRI</span></div>
          </template>
          <template #content>
            <div class="space-y-6">
              <div class="border border-blue-200 rounded-lg p-4">
                <h3 class="text-sm font-semibold text-blue-700 mb-3">🧪 Ambiente de Pruebas</h3>
                <div class="grid grid-cols-1 gap-3">
                  <div class="space-y-1">
                    <label class="text-xs font-medium text-gray-600">Recepción</label>
                    <div class="flex gap-2">
                      <InputText v-model="sriUrls.pruebas.recepcion" class="w-full font-mono text-xs" />
                      <Button label="Guardar" icon="pi pi-check" size="small" @click="promptSriUrlChange('pruebas', 'recepcion')" />
                    </div>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-medium text-gray-600">Autorización</label>
                    <div class="flex gap-2">
                      <InputText v-model="sriUrls.pruebas.autorizacion" class="w-full font-mono text-xs" />
                      <Button label="Guardar" icon="pi pi-check" size="small" @click="promptSriUrlChange('pruebas', 'autorizacion')" />
                    </div>
                  </div>
                </div>
              </div>
              <div class="border border-green-200 rounded-lg p-4">
                <h3 class="text-sm font-semibold text-green-700 mb-3">🚀 Ambiente de Producción</h3>
                <div class="grid grid-cols-1 gap-3">
                  <div class="space-y-1">
                    <label class="text-xs font-medium text-gray-600">Recepción</label>
                    <div class="flex gap-2">
                      <InputText v-model="sriUrls.produccion.recepcion" class="w-full font-mono text-xs" />
                      <Button label="Guardar" icon="pi pi-check" size="small" @click="promptSriUrlChange('produccion', 'recepcion')" />
                    </div>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-medium text-gray-600">Autorización</label>
                    <div class="flex gap-2">
                      <InputText v-model="sriUrls.produccion.autorizacion" class="w-full font-mono text-xs" />
                      <Button label="Guardar" icon="pi pi-check" size="small" @click="promptSriUrlChange('produccion', 'autorizacion')" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </template>
    </div>

    <!-- Confirm dialog for SRI URLs -->
    <Dialog v-model:visible="showConfirmDialog" header="Confirmar cambio de URL" modal :style="{ width: '420px' }">
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          Cambiando URL de <strong>{{ sriEditSnapshot?.field === 'recepcion' ? 'Recepción' : 'Autorización' }}</strong>
          en <strong>{{ sriEditSnapshot?.env === 'pruebas' ? 'Pruebas' : 'Producción' }}</strong>.
        </p>
        <p class="text-sm text-gray-600">Escriba el siguiente código para confirmar:</p>
        <div class="text-center py-3">
          <span class="text-2xl font-bold tracking-widest text-blue-700 select-all">{{ confirmCode }}</span>
        </div>
        <div class="space-y-1">
          <label class="text-sm font-medium text-gray-700">Código de confirmación</label>
          <InputText v-model="userCode" class="w-full text-center text-lg font-mono" placeholder="000000" maxlength="6" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancelar" severity="secondary" text @click="showConfirmDialog = false" />
          <Button label="Confirmar cambio" icon="pi pi-check" :disabled="userCode.length !== 6" @click="confirmSriUrlChange" />
        </div>
      </div>
    </Dialog>

    <!-- Confirm dialog for sequences -->
    <Dialog v-model:visible="showEdDialogVisible" header="Confirmar cambios" modal :style="{ width: '420px' }">
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          <template v-if="showEdConfirmDialog === 'seq'">
            Está a punto de modificar los secuenciales de
            <strong>{{ edTargetEp?.name }}</strong>.
            Esta operación puede afectar la numeración de comprobantes electrónicos.
          </template>
          <template v-else-if="showEdConfirmDialog === 'ep'">
            Está a punto de modificar el punto de emisión
            <strong>{{ edTargetEp?.name }}</strong>.
          </template>
          <template v-else-if="showEdConfirmDialog === 'est'">
            Está a punto de modificar la sucursal
            <strong>{{ edTargetEst?.name }}</strong>.
          </template>
        </p>
        <p class="text-sm text-gray-600">Escriba el siguiente código para confirmar:</p>
        <div class="text-center py-3">
          <span class="text-2xl font-bold tracking-widest text-orange-700 select-all">{{ edConfirmCode }}</span>
        </div>
        <div class="space-y-1">
          <label class="text-sm font-medium text-gray-700">Código de confirmación</label>
          <InputText v-model="edUserCode" class="w-full text-center text-lg font-mono" placeholder="000000" maxlength="6" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancelar" severity="secondary" text @click="cancelEdEdit" />
          <Button label="Confirmar y guardar" icon="pi pi-check" severity="warning" :disabled="edUserCode.length !== 6" @click="confirmEdSave" />
        </div>
      </div>
    </Dialog>
  </div>
</template>
