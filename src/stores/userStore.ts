import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User, LoginForm, UserUpdateForm } from '@/types/user'
import { login as loginApi, getUserInfo, updateUserInfo } from '@/api/auth'
import { useSearchStore } from './searchStore'
import { useWeatherStore } from './weatherStore'
import { useConfigStore } from './configStore'
import { useHotStore } from './hotStore'
import { useBookmarkStore } from './bookmarkStore'

export const useUserStore = defineStore(
  'user',
  () => {
    const currentUser = ref<User | null>(null)
    const isLoggedIn = ref(false)
    const token = ref('')

    const login = async (form: LoginForm) => {
      try {
        const res = await loginApi(form)
        token.value = res.data.token
        currentUser.value = res.data.user
        isLoggedIn.value = true

        // 登录成功后初始化其他 store
        await initStores()

        return true
      } catch (error) {
        console.error('Login failed:', error)
        return false
      }
    }

    const logout = () => {
      currentUser.value = null
      isLoggedIn.value = false
      token.value = ''
    }

    // 获取用户信息
    const fetchUserInfo = async () => {
      try {
        const res = await getUserInfo()
        currentUser.value = res.data
        await initStores()
      } catch (error) {
        console.error('Failed to fetch user info:', error)
      }
    }

    // 更新用户信息
    const updateUser = async (data: UserUpdateForm) => {
      try {
        const res = await updateUserInfo(data)
        currentUser.value = res.data
        await initStores()
        return res.data
      } catch (error) {
        console.error('Failed to update user info:', error)
        throw error
      }
    }

    // 初始化其他 store
    const initStores = async () => {
      if (currentUser.value) {
        // 初始化搜索引擎 - 这个是基础功能，始终需要初始化
        const searchStore = useSearchStore()
        await searchStore.fetchEngines()

        // 初始化容器配置
        const configStore = useConfigStore()
        if (currentUser.value.container_config) {
          configStore.updateContainerConfig(currentUser.value.container_config)
        }

        // 只有当天气功能开启时才初始化天气
        if (
          currentUser.value.container_config?.showWeather &&
          currentUser.value.weather_adcode &&
          currentUser.value.weather_key
        ) {
          const weatherStore = useWeatherStore()
          weatherStore.updateConfig({
            adcode: currentUser.value.weather_adcode,
            key: currentUser.value.weather_key,
          })
          await weatherStore.fetchWeather()
        }

        // 只有当热搜功能开启时才初始化热搜
        if (currentUser.value.container_config?.showHotSearch) {
          const hotStore = useHotStore()
          await hotStore.fetchSources()
        }

        // 只有当书签功能开启时才初始化书签
        if (currentUser.value.container_config?.showBookmark) {
          const bookmarkStore = useBookmarkStore()
          await bookmarkStore.fetchAll()
        }
      }
    }

    // 初始化时检查登录状态
    const initAuth = async () => {
      if (token.value) {
        isLoggedIn.value = true
        await fetchUserInfo()
      }
    }

    return {
      currentUser,
      isLoggedIn,
      token,
      login,
      logout,
      initAuth,
      fetchUserInfo,
      updateUser,
    }
  },
  {
    persist: {
      key: 'user-store',
      storage: localStorage,
      paths: ['token'],
    },
  },
)
