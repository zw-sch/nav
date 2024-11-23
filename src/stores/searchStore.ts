import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { SearchEngine } from '@/types/search'
import { useUserStore } from './userStore'
import { getEngines, addEngine, updateEngine as updateEngineApi, deleteEngine } from '@/api/search'

export const useSearchStore = defineStore(
  'search',
  () => {
    const userStore = useUserStore()

    // 默认搜索引擎
    const defaultEngine: SearchEngine = {
      id: 1,
      name: '百度',
      url: 'https://www.baidu.com',
      icon: 'ri:baidu-fill',
      searchUrl: 'https://www.baidu.com/s?wd={keyword}',
    }

    const allEngines = ref<SearchEngine[]>([defaultEngine])
    const currentEngine = ref<SearchEngine>(defaultEngine)
    const searchText = ref('')
    const isDarkMode = ref(localStorage.getItem('isDarkMode') === 'true')

    // 在 store 初始化时立即应用深色模式
    const applyDarkMode = () => {
      // 更新 theme-color
      const themeColorMeta = document.getElementById('theme-color') as HTMLMetaElement
      if (themeColorMeta) {
        themeColorMeta.content = isDarkMode.value ? '#1a1a1a' : '#ffffff'
      }

      // 更新 document 的 class
      if (isDarkMode.value) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    // 监听深色模式变化
    watch(isDarkMode, (newValue) => {
      localStorage.setItem('isDarkMode', String(newValue))
      applyDarkMode()
    })

    // 监听登录状态变化
    watch(
      () => userStore.isLoggedIn,
      (newValue) => {
        if (!newValue) {
          // 退出登录时重置为默认状态
          allEngines.value = [defaultEngine]
          currentEngine.value = defaultEngine
        }
      },
    )

    // 计算可用的搜索引擎列表
    const engines = computed(() => {
      return userStore.isLoggedIn ? allEngines.value : [defaultEngine]
    })

    // 切换深色模式
    const toggleDarkMode = () => {
      isDarkMode.value = !isDarkMode.value
    }

    // 初始化时立即应用主题
    applyDarkMode()

    // 获取搜索引擎列表
    const fetchEngines = async () => {
      if (userStore.isLoggedIn) {
        try {
          const res = await getEngines()
          if (res.data.length > 0) {
            allEngines.value = res.data.map((engine) => ({
              ...engine,
              searchUrl: engine.search_url || engine.searchUrl,
              quickCommand: engine.quick_command,
              sortOrder: engine.sort_order,
            }))
            // 按 sortOrder 排序
            allEngines.value.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            // 如果当前引擎不在列表中，设置为第一个
            if (!allEngines.value.find((e) => e.id === currentEngine.value.id)) {
              currentEngine.value = allEngines.value[0]
            }
          }
        } catch (error) {
          console.error('Failed to fetch engines:', error)
        }
      }
    }

    // 添加新搜索引擎
    const addNewEngine = async (engine: Omit<SearchEngine, 'id'>) => {
      if (userStore.isLoggedIn) {
        const res = await addEngine(engine)
        const newEngine = {
          ...res.data,
          searchUrl: res.data.search_url || res.data.searchUrl,
          quickCommand: res.data.quick_command,
          sortOrder: res.data.sort_order,
        }
        allEngines.value.push(newEngine)
        // 重新排序
        allEngines.value.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        return newEngine
      }
    }

    // 更新搜索引擎
    const updateSearchEngine = async (id: number, data: Partial<SearchEngine>) => {
      if (userStore.isLoggedIn) {
        const res = await updateEngineApi(id, data)
        const updatedEngine = {
          ...res.data,
          searchUrl: res.data.search_url || res.data.searchUrl,
          quickCommand: res.data.quick_command,
          sortOrder: res.data.sort_order,
        }
        const index = allEngines.value.findIndex((e) => e.id === id)
        if (index !== -1) {
          allEngines.value[index] = updatedEngine
          if (currentEngine.value.id === id) {
            currentEngine.value = updatedEngine
          }
          // 重新排序
          allEngines.value.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        }
        return updatedEngine
      }
    }

    // 删除搜索引擎
    const removeEngine = async (id: number) => {
      if (userStore.isLoggedIn) {
        await deleteEngine(id)
        const index = allEngines.value.findIndex((e) => e.id === id)
        if (index !== -1) {
          allEngines.value.splice(index, 1)
          if (currentEngine.value.id === id) {
            currentEngine.value = allEngines.value[0]
          }
        }
      }
    }

    // 切换搜索引擎
    const setCurrentEngine = (engine: SearchEngine) => {
      if (userStore.isLoggedIn || engine.id === defaultEngine.id) {
        currentEngine.value = engine
      }
    }

    // 执行搜索
    const search = () => {
      if (!searchText.value.trim()) return

      // 检查是否是快速命令
      const text = searchText.value.trim()
      if (text.startsWith('/')) {
        const [command, ...searchTerms] = text.split(' ')
        const commandText = command.toLowerCase() // 移除斜杠并转为小写
        const searchTerm = searchTerms.join(' ').trim()

        // 查找匹配的搜索引擎（不区分大小写）
        const matchedEngine = allEngines.value.find(
          (engine) => engine.quickCommand?.toLowerCase() === commandText,
        )

        if (matchedEngine) {
          if (searchTerm) {
            // 有搜索词时执行搜索
            const url = matchedEngine.searchUrl.replace('{keyword}', encodeURIComponent(searchTerm))
            window.open(url, '_blank')
          } else {
            // 没有搜索词时打开搜索引擎主页
            window.open(matchedEngine.url, '_blank')
          }
          searchText.value = '' // 清空搜索框
          return
        }
      }

      // 如果不是快速命令或没有匹配的引擎，使用当前搜索引擎
      const url = currentEngine.value.searchUrl.replace(
        '{keyword}',
        encodeURIComponent(searchText.value),
      )
      window.open(url, '_blank')
      searchText.value = '' // 清空搜索框
    }

    return {
      engines,
      currentEngine,
      searchText,
      isDarkMode,
      toggleDarkMode,
      addNewEngine,
      updateSearchEngine,
      removeEngine,
      setCurrentEngine,
      search,
      fetchEngines,
    }
  },
  {
    persist: {
      key: 'search-store',
      storage: localStorage,
      paths: ['isDarkMode'], // 持久化存储深色模式状态
    },
  },
)
