<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// --- API imports ---
import { getContractTemplate, createContractTemplate, updateContractTemplate, getContractTemplateVariables } from '@/api/contractTemplates'
import type { ContractTemplate, ContractTemplateVariable } from '@/api/types'

const router = useRouter()
const route = useRoute()
const templateId = computed(() => route.params.id as string | undefined)

const loading = ref(false)
const saving = ref(false)
const error = ref('')

// --- Template form fields ---
const form = ref({
  name: '',
  code: '',
  description: '',
  content: '',
  body: '',
  is_active: true,
  is_default: false,
})

// --- Rich text toggle ---
const useRichText = ref(false)

// --- Editor refs ---
const plainTextarea = ref<HTMLTextAreaElement | null>(null)
let quillInstance: any = null

function onEditorLoad(e: { instance: any }) {
  quillInstance = e.instance
}

// --- Variables ---
const variables = ref<ContractTemplateVariable[]>([])
const variablesLoading = ref(true)
const searchQuery = ref('')

const filteredVariables = computed(() => {
  if (!searchQuery.value) return variables.value
  const q = searchQuery.value.toLowerCase()
  return variables.value.filter(
    v => v.key.toLowerCase().includes(q) || v.label.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q)
  )
})

const groupedVariables = computed(() => {
  const groups: Record<string, ContractTemplateVariable[]> = {}
  for (const v of filteredVariables.value) {
    const g = v.group || 'General'
    if (!groups[g]) groups[g] = []
    groups[g].push(v)
  }
  return groups
})

// --- Load existing template if editing ---
onMounted(async () => {
  variablesLoading.value = true
  try {
    const varsRes = await getContractTemplateVariables()
    if (varsRes.success && varsRes.data) {
      variables.value = varsRes.data
    }
  } catch (e) {
    console.warn('Could not load variables:', e)
  } finally {
    variablesLoading.value = false
  }

  if (templateId.value) {
    loading.value = true
    try {
      const res = await getContractTemplate(templateId.value)
      if (res.success && res.data) {
        const t = res.data
        form.value = {
          name: t.name || '',
          code: t.code || '',
          description: t.description || '',
          content: t.content || '',
          body: t.body || '',
          is_active: t.is_active ?? true,
          is_default: t.is_default ?? false,
        }
        // Auto-detect rich text: if body has HTML tags
        if (t.body && (t.body.includes('<') || t.body !== t.content)) {
          useRichText.value = true
        }
      }
    } catch (e: any) {
      error.value = 'Error al cargar la plantilla'
    }
    loading.value = false
  }
})

// --- Submit ---
async function handleSubmit() {
  saving.value = true
  error.value = ''

  /**
   * The backend requires 'content' (plain text).
   * 'body' is stored as rich-text HTML when available.
   * If 'body' is plain text, use it as 'content' too.
   * If 'body' is HTML, extract plain text for 'content'.
   */
  let plainText = form.value.body
  if (useRichText.value && quillInstance) {
    plainText = quillInstance.getText().trim() || form.value.body
  }

  const payload = {
    name: form.value.name,
    code: form.value.code,
    description: form.value.description,
    content: plainText,
    body: form.value.body,
    is_active: form.value.is_active,
    is_default: form.value.is_default,
  }

  try {
    if (templateId.value) {
      await updateContractTemplate(templateId.value, payload)
    } else {
      await createContractTemplate(payload)
    }
    router.push('/contracts/templates')
  } catch (e: any) {
    error.value = e?.message || 'Error al guardar la plantilla'
  } finally {
    saving.value = false
  }
}

// --- Insert variable at cursor ---
function insertVariable(variable: ContractTemplateVariable) {
  const token = `{{ ${variable.key} }}`
  if (useRichText.value) {
    if (quillInstance) {
      const sel = quillInstance.getSelection()
      if (sel) {
        quillInstance.insertText(sel.index, token)
        quillInstance.setSelection(sel.index + token.length)
      } else {
        quillInstance.insertText(quillInstance.getLength(), token)
      }
    }
    return
  }
  // Plain text area
  const ta = plainTextarea.value
  if (ta) {
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const val = form.value.body
    form.value.body = val.substring(0, start) + token + val.substring(end)
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = ta.selectionEnd = start + token.length
    })
  }
}
</script>

<template>
  <div class="template-form-page">
    <div class="top-bar">
      <Button
        :label="templateId ? '← Volver' : '← Cancelar'"
        severity="secondary"
        variant="text"
        @click="router.push('/contracts/templates')"
      />
      <h2>{{ templateId ? 'Editar Plantilla' : 'Nueva Plantilla' }}</h2>
    </div>

    <div v-if="loading" class="loading-state">
      <ProgressSpinner />
    </div>

    <template v-else>
      <Message v-if="error" severity="error" :closable="false" class="mb-3">{{ error }}</Message>

      <div class="form-layout">
        <!-- LEFT COLUMN: template fields -->
        <div class="form-column form-column--main">
          <div class="form-card">
            <div class="field">
              <label for="name">Nombre</label>
              <InputText id="name" v-model="form.name" placeholder="Ej: Contrato de Internet Residencial" fluid />
            </div>

            <div class="field">
              <label for="code">Código</label>
              <InputText id="code" v-model="form.code" placeholder="Ej: CONT-INT-RES" fluid />
            </div>

            <div class="field">
              <label for="description">Descripción</label>
              <InputText id="description" v-model="form.description" placeholder="Breve descripción del uso de esta plantilla" fluid />
            </div>

            <div class="flex gap-3">
              <div class="field flex-1">
                <ToggleSwitch v-model="form.is_active" inputId="is_active" />
                <label for="is_active" class="ml-2">Activo</label>
              </div>
              <div class="field flex-1">
                <ToggleSwitch v-model="form.is_default" inputId="is_default" />
                <label for="is_default" class="ml-2">Plantilla por defecto</label>
              </div>
            </div>
          </div>

          <!-- Editor area -->
          <div class="form-card editor-card">
            <div class="editor-header">
              <label>Contenido de la plantilla</label>
              <div class="editor-toggles">
                <Button
                  :label="useRichText ? 'Texto Plano' : 'Texto Enriquecido'"
                  :icon="useRichText ? 'pi pi-file' : 'pi pi-pencil'"
                  severity="secondary"
                  size="small"
                  variant="text"
                  @click="useRichText = !useRichText"
                />
              </div>
            </div>

            <!-- Plain text mode -->
            <div v-if="!useRichText" class="plain-text-wrapper">
              <Textarea
                ref="plainTextarea"
                v-model="form.body"
                :autoResize="true"
                placeholder="Escribe el contenido de la plantilla aquí... Usa las variables del panel derecho haciendo clic en ellas."
                rows="18"
                fluid
              />
            </div>

            <!-- Rich text mode (PrimeVue Editor + Quill) -->
            <div v-else class="rich-text-wrapper">
              <Editor v-model="form.body" @load="onEditorLoad" placeholder="Escribe el contenido de la plantilla aquí..." editorStyle="min-height: 420px" />
            </div>

            <div class="editor-hint">
              <small>Haz clic en una variable del panel derecho para insertarla en el texto.</small>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="form-actions">
            <Button
              :label="saving ? 'Guardando...' : 'Guardar Plantilla'"
              icon="pi pi-check"
              :loading="saving"
              :disabled="saving || !form.name"
              @click="handleSubmit"
            />
            <Button
              label="Cancelar"
              severity="secondary"
              variant="outlined"
              @click="router.push('/contracts/templates')"
            />
          </div>
        </div>

        <!-- RIGHT COLUMN: variables panel -->
        <div class="form-column form-column--sidebar">
          <div class="variables-panel">
            <div class="panel-header">
              <h3>Variables disponibles</h3>
              <span class="panel-subtitle">Haz clic para insertar</span>
            </div>

            <div class="panel-search">
              <IconField>
                <InputIcon class="pi pi-search" />
                <InputText v-model="searchQuery" placeholder="Buscar variable..." fluid />
              </IconField>
            </div>

            <div v-if="variablesLoading" class="panel-loading">
              <ProgressSpinner class="spinner-sm" />
            </div>

            <div v-else class="variables-list">
              <div v-for="(vars, group) in groupedVariables" :key="group" class="variable-group">
                <div class="group-label">{{ group }}</div>
                <div
                  v-for="v in vars"
                  :key="v.id"
                  class="variable-chip"
                  :title="v.description || v.label"
                  @click="insertVariable(v)"
                >
                  <span class="var-key">{{ v.key }}</span>
                  <span v-if="v.label" class="var-label">{{ v.label }}</span>
                </div>
              </div>

              <div v-if="filteredVariables.length === 0" class="panel-empty">
                No se encontraron variables
              </div>
            </div>

            <div class="panel-footer">
              <small>Las variables se reemplazarán con datos reales al generar el contrato.</small>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.template-form-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.top-bar h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 4rem;
}

/* ── Two-column layout ─────────────────────────────── */
.form-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.5rem;
  align-items: start;
}

.form-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── Form cards ────────────────────────────────────── */
.form-card {
  background: var(--p-surface-card, #fff);
  border: 1px solid var(--p-surface-border, #e0e0e0);
  border-radius: 8px;
  padding: 1.25rem;
}

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
}

/* ── Editor area ───────────────────────────────────── */
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.editor-header label {
  font-weight: 500;
  font-size: 0.875rem;
}

.editor-toggles {
  display: flex;
  gap: 0.5rem;
}

.editor-hint {
  margin-top: 0.5rem;
  color: var(--p-text-muted-color, #999);
}

/* Rich text wrapper needs to let Quill toolbar breathe */
.rich-text-wrapper {
  border: 1px solid var(--p-surface-border, #d0d0d0);
  border-radius: 6px;
  overflow: hidden;
}

.rich-text-wrapper :deep(.ql-editor) {
  min-height: 400px;
}

/* ── Action buttons ────────────────────────────────── */
.form-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

/* ── Variables panel (right sidebar) ──────────────── */
.variables-panel {
  background: var(--p-surface-card, #fff);
  border: 1px solid var(--p-surface-border, #e0e0e0);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 140px);
  position: sticky;
  top: 1rem;
}

.panel-header {
  padding: 1rem 1rem 0;
}

.panel-header h3 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 600;
}

.panel-subtitle {
  font-size: 0.75rem;
  color: var(--p-text-muted-color, #888);
}

.panel-search {
  padding: 0.75rem 1rem;
  flex-shrink: 0;
}

.panel-loading {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.variables-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 1rem 0.75rem;
}

.variable-group {
  margin-bottom: 0.75rem;
}

.group-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--p-text-muted-color, #888);
  margin-bottom: 0.375rem;
}

.variable-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 2px;
}

.variable-chip:hover {
  background: var(--p-surface-hover, #f0f0f0);
}

.variable-chip:active {
  background: var(--p-surface-active, #e0e0e0);
}

.var-key {
  font-family: 'Courier New', monospace;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--p-primary-color, #6366f1);
  background: var(--p-primary-50, #eef2ff);
  padding: 0 4px;
  border-radius: 3px;
  flex-shrink: 0;
}

.var-label {
  font-size: 0.75rem;
  color: var(--p-text-color, #555);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-empty {
  text-align: center;
  padding: 2rem 0;
  color: var(--p-text-muted-color, #888);
  font-size: 0.875rem;
}

.panel-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--p-surface-border, #eee);
  flex-shrink: 0;
}

.panel-footer small {
  color: var(--p-text-muted-color, #999);
}

/* ── Responsive ────────────────────────────────────── */
@media (max-width: 900px) {
  .form-layout {
    grid-template-columns: 1fr;
  }

  .variables-panel {
    max-height: 400px;
    position: static;
  }
}
</style>
