import './style.css'
import 'quill/dist/quill.snow.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import Editor from 'primevue/editor'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'

// PrimeVue global components
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import Calendar from 'primevue/calendar'
import Checkbox from 'primevue/checkbox'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import TabPanel from 'primevue/tabpanel'
import TabView from 'primevue/tabview'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: false,
    },
  },
})
app.use(ToastService)
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)

// Register global PrimeVue components
app.component('Button', Button)
app.component('Card', Card)
app.component('Column', Column)
app.component('DataTable', DataTable)
app.component('Dialog', Dialog)
app.component('InputNumber', InputNumber)
app.component('InputText', InputText)
app.component('Select', Select)
app.component('Tag', Tag)
app.component('Textarea', Textarea)
app.component('ToggleSwitch', ToggleSwitch)
app.component('Calendar', Calendar)
app.component('Checkbox', Checkbox)
app.component('IconField', IconField)
app.component('InputIcon', InputIcon)
app.component('Message', Message)
app.component('ProgressSpinner', ProgressSpinner)
app.component('TabPanel', TabPanel)
app.component('TabView', TabView)
app.component('Editor', Editor)

app.mount('#app')
