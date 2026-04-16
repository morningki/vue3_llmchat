import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'

import persist from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import './assets/styles/main.scss'
import 'animate.css'

const app = createApp(App)

app.use(ElementPlus, {
  locale: zhCn,
})
app.use(createPinia().use(persist))
app.use(router)

app.mount('#app')
