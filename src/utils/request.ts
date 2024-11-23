import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { createDiscreteApi } from 'naive-ui'
import { useUserStore } from '@/stores/userStore'

interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

const { message } = createDiscreteApi(['message'])

const request = axios.create({
  // 后端地址
  baseURL: '',
  timeout: 50000
})

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response
    if (data.code === 200) {
      return data as any
    } else {
      message.error(data.message)
      return Promise.reject(data)
    }
  },
  (error) => {
    if (error.response?.data?.message) {
      message.error(error.response.data.message)
    } else {
      message.error(error.message || '请求失败')
    }
    return Promise.reject(error.response?.data || error)
  }
)

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()
    if (userStore.token && !(config.method === 'get' && config.url?.includes('/api/system/config'))) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export { request }
