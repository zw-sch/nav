import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import naive from 'naive-ui'
import './styles/global.scss'
import { useUserStore } from '@/stores/userStore'
import { registerSW } from 'virtual:pwa-register'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(naive)

// 注册 Service Worker
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      // 可以在这里提示用户刷新
      console.log('有新内容可用，请刷新页面')
    },
    onOfflineReady() {
      // 可以在这里提示用户已经可以离线使用
      console.log('应用已经可以离线使用')
    }
  })
}

// 初始化认证状态
const init = async () => {
  const userStore = useUserStore()
  await userStore.initAuth()
  app.mount('#app')
}

init()
