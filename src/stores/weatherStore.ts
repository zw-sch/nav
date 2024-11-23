import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { WeatherInfo } from '@/types/weather'
import { useUserStore } from './userStore'
import { useConfigStore } from '@/stores/configStore'
import { getCurrentWeather } from '@/api/weather'

export const useWeatherStore = defineStore('weather', () => {
  const weather = ref<WeatherInfo | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdateTime = ref(0)

  // 更新配置
  const updateConfig = (config: { adcode: string; key: string }) => {
    const userStore = useUserStore()
    if (userStore.currentUser) {
      userStore.currentUser.weather_adcode = config.adcode
      userStore.currentUser.weather_key = config.key
    }
  }

  // 获取天气数据
  const fetchWeather = async () => {
    const userStore = useUserStore()
    const configStore = useConfigStore()

    // 检查登录状态和容器是否启用
    if (!userStore.isLoggedIn || !configStore.containerConfig.showWeather) {
      return
    }

    // 检查是否需要更新（5分钟内不重复请求）
    const now = Date.now()
    if (now - lastUpdateTime.value < 5 * 60 * 1000) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const res = await getCurrentWeather()
      weather.value = res.data
      lastUpdateTime.value = now
    } catch (err) {
      console.error('Failed to fetch weather:', err)
      error.value = err instanceof Error ? err.message : '获取天气数据失败'
      weather.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    weather,
    loading,
    error,
    fetchWeather,
    updateConfig,
  }
})
