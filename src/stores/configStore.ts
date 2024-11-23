import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ContainerConfig } from '@/types/config'
import { useUserStore } from './userStore'

export const useConfigStore = defineStore('config', () => {
  const containerConfig = ref<ContainerConfig>({
    showWeather: true,
    showHotSearch: true,
    showBookmark: true,
  })

  // 更新容器配置
  const updateContainerConfig = (config: Partial<ContainerConfig>) => {
    containerConfig.value = { ...containerConfig.value, ...config }
  }

  // 获取用户配置
  const fetchConfig = async () => {
    const userStore = useUserStore()
    if (userStore.currentUser?.container_config) {
      containerConfig.value = {
        ...containerConfig.value,
        ...userStore.currentUser.container_config,
      }
    }
  }

  return {
    containerConfig,
    updateContainerConfig,
    fetchConfig,
  }
})
