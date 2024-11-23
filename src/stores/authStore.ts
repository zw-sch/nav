import { defineStore } from 'pinia'
import { login } from '@/api/auth'
import { useUserStore } from '@/stores/userStore'

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')

  const login = async (username: string, password: string) => {
    try {
      const response = await login({ username, password })
      const { token: newToken, user } = response.data

      token.value = newToken
      const userStore = useUserStore()
      userStore.setUserInfo(user)

      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  return {
    token,
    login,
  }
})
