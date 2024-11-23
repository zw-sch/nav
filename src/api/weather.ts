import { request } from '@/utils/request'
import type { WeatherInfo } from '@/types/weather'

interface WeatherResponse {
  code: number
  message?: string
  data?: WeatherInfo
}

// 获取天气信息
export const getCurrentWeather = () => {
  return request<WeatherResponse>({
    url: '/api/weather/current',
    method: 'GET',
  })
}
