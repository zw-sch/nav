import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSystemConfig, updateSystemConfig } from '@/api/system'
import type { SystemConfig } from '@/types/system'

export const useSystemStore = defineStore('system', () => {
  const config = ref<SystemConfig>({
    site_title: '',
    icp_record: ''
  })

  const fetchConfig = async () => {
    try {
      const { data } = await getSystemConfig()
      config.value = data
      // 更新网站标题
      if (data.site_title) {
        document.title = data.site_title
      }
    } catch (error) {
      console.error('获取系统配置失败:', error)
      // 在未登录状态下获取配置失败时不需要显示错误
    }
  }

  const updateConfig = async (newConfig: Partial<SystemConfig>) => {
    try {
      const { data } = await updateSystemConfig(newConfig)
      config.value = data
      // 更新网站标题
      if (data.site_title) {
        document.title = data.site_title
      }
      return data
    } catch (error) {
      console.error('更新系统配置失败:', error)
      throw error
    }
  }

  return {
    config,
    fetchConfig,
    updateConfig
  }
})
