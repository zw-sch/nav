import { request } from '@/utils/request'
import type { LoginForm, User, UserUpdateForm } from '@/types/user'

export interface LoginResponse {
  token: string
  user: {
    id: number
    username: string
    avatar: string
    weather_adcode: string
    weather_key: string
    container_config: {
      showWeather: boolean
      showHotSearch: boolean
      showBookmark: boolean
      showDateTime: boolean
    }
  }
}

export const login = (data: LoginForm) => {
  return request.post<LoginResponse>('/api/auth/login', data)
}

export const getUserInfo = () => {
  return request.get<User>('/api/auth/user')
}

export const updateUserInfo = (data: UserUpdateForm) => {
  return request.put<User>('/api/auth/user', data)
}
