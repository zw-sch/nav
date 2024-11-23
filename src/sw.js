import { precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

// 启用 service worker 立即接管页面
self.skipWaiting()
clientsClaim()

// 预缓存资源
precacheAndRoute(self.__WB_MANIFEST)

// API 请求的缓存策略
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
  })
)

// 其他资源的缓存策略
registerRoute(
  ({ request }) => request.destination === 'image',
  new NetworkFirst({
    cacheName: 'image-cache',
  })
)

// 处理导航请求
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'page-cache',
  })
)

// 处理 Service Worker 的安装事件
self.addEventListener('install', (event) => {
  console.log('Service Worker installed')
})

// 处理 Service Worker 的激活事件
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated')
})

// 处理推送通知
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png'
  }

  event.waitUntil(
    self.registration.showNotification('搜索导航', options)
  )
})

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow('/')
  )
})
