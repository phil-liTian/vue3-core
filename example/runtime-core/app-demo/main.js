import { createApp } from '../../../lib/vue-core.esm.js'
import { App } from './App.js'

const app = createApp(App)
console.log('version--->', app);

app.mount(document.querySelector('#app'))

