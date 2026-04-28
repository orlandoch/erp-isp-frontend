import { ref } from 'vue'
import api from '@/api/client'

interface AccountOption {
  label: string
  value: number
}

const accounts = ref<AccountOption[]>([])
const loaded = ref(false)

export function useAccounts() {
  async function loadAccounts() {
    if (loaded.value) return
    try {
      const { data } = await api.get('/settings/accounts', { params: { limit: 200 } })
      const items: any[] = data.data || []
      accounts.value = items.map(a => ({
        label: `${a.code} — ${a.name}`,
        value: a.id,
      }))
      loaded.value = true
    } catch {
      accounts.value = []
      loaded.value = true
    }
  }

  return { accounts, loadAccounts }
}
