import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { HotSource } from '@/types/hot'
import { getSources, addSource as apiAddSource, updateSource as apiUpdateSource, deleteSource } from '@/api/hot'
import { useUserStore } from './userStore'

export const useHotStore = defineStore('hot', () => {
  const userStore = useUserStore()
  const sources = ref<HotSource[]>([])
  const currentSource = ref<HotSource | null>(null)

  // 获取热搜源列表
  const fetchSources = async () => {
    if (userStore.isLoggedIn) {
      try {
        const res = await getSources()
        sources.value = res.data.map((source) => ({
          ...source,
          enablePreview: Boolean(source.enable_preview)
        }))

        // 尝试恢复上次选择的源
        const savedSourceId = localStorage.getItem('lastSelectedHotSourceId')
        if (savedSourceId && sources.value.length > 0) {
          const savedSource = sources.value.find(s => s.id.toString() === savedSourceId)
          if (savedSource) {
            currentSource.value = savedSource
          } else {
            currentSource.value = sources.value[0]
          }
        } else if (sources.value.length > 0) {
          currentSource.value = sources.value[0]
        }
      } catch (error) {
        console.error('Failed to fetch hot sources:', error)
        sources.value = []
        currentSource.value = null
      }
    }
  }

  // 切换热搜源
  const setCurrentSource = (source: HotSource) => {
    currentSource.value = source
    localStorage.setItem('lastSelectedHotSourceId', source.id.toString())
  }

  return {
    sources,
    currentSource,
    setCurrentSource,
    fetchSources
  }
})
