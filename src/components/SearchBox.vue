<template>
  <div class="search-container" :class="{ 'minimal-mode': minimalMode }">
    <div v-if="minimalMode" class="minimal-engine-icon">
      <Icon :icon="currentEngine.icon" />
    </div>
    <form class="search-box" :class="{ focused: isFocused }" @submit.prevent="handleSearch">
      <div class="engine-icon" @click="showEngineDropdown = !showEngineDropdown">
        <Icon :icon="currentEngine.icon" class="engine-logo" />
        <Icon
          icon="material-symbols:keyboard-arrow-down"
          class="arrow-icon"
          :class="{ rotated: showEngineDropdown }"
        />
      </div>
      <input
        ref="inputRef"
        v-model="searchText"
        class="search-input"
        :placeholder="`在 ${currentEngine.name} 中搜索`"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
        type="search"
        enterkeyhint="search"
      />
      <n-button class="search-button" type="primary" @click="handleSearch"> 搜索 </n-button>
      <div v-show="showEngineDropdown" class="engine-dropdown">
        <div
          v-for="engine in engines"
          :key="engine.id"
          class="engine-item"
          :class="{ active: engine.id === currentEngine.id }"
          @click="handleEngineSelect(engine)"
        >
          <Icon :icon="engine.icon" class="engine-item-icon" />
          {{ engine.name }}
        </div>
        <div class="divider" v-if="isLoggedIn"></div>
        <div v-if="isLoggedIn" class="engine-item add-engine" @click="handleAddEngine">
          <Icon icon="material-symbols:add" class="engine-item-icon" />
          添加搜索引擎
        </div>
      </div>
      <div
        v-show="showSuggestions && suggestions.length > 0"
        class="suggestions-dropdown"
        ref="suggestionsRef"
      >
        <div
          v-for="(suggestion, index) in suggestions"
          :key="index"
          class="suggestion-item"
          :class="{ 'selected': index === selectedIndex }"
          @click="handleSuggestionSelect(suggestion)"
        >
          <template v-if="suggestion.type === 'bookmark'">
            <Icon :icon="suggestion.icon" class="suggestion-icon" />
            <span class="suggestion-text">{{ suggestion.text }}</span>
          </template>
          <template v-else>
            {{ suggestion.text }}
          </template>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Icon } from '@iconify/vue'
import { NButton } from 'naive-ui'
import { useSearchStore } from '@/stores/searchStore'
import { useUserStore } from '@/stores/userStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import type { SearchEngine } from '@/types/search'
import type { Bookmark } from '@/types/bookmark'

const searchStore = useSearchStore()
const userStore = useUserStore()
const bookmarkStore = useBookmarkStore()
const { engines, currentEngine, searchText } = storeToRefs(searchStore)
const { isLoggedIn } = storeToRefs(userStore)
const { setCurrentEngine } = searchStore

const inputRef = ref<HTMLInputElement | null>(null)
const isFocused = ref(false)
const showEngineDropdown = ref(false)

// 添加事件总线
const emit = defineEmits<{
  (e: 'add-engine'): void
}>()

const handleSearch = () => {
  // 检查是否是快捷命令
  const shortcutMatch = searchText.value.match(/^\/(\w+)$/)
  if (shortcutMatch) {
    // 找到对应的搜索引擎
    const shortcut = shortcutMatch[1]
    const targetEngine = engines.value.find(e => e.shortcut === shortcut)
    if (targetEngine) {
      // 如果找到对应的搜索引擎，直接跳转到其主页
      window.open(targetEngine.home_url || targetEngine.search_url.split('?')[0], '_blank')
      return
    }
  }
  // 不是快捷命令或没找到对应引擎，执行普通搜索
  searchStore.search()
}

const handleEngineSelect = (engine: SearchEngine) => {
  setCurrentEngine(engine)
  showEngineDropdown.value = false
  inputRef.value?.focus()
}

const handleAddEngine = () => {
  showEngineDropdown.value = false
  emit('add-engine') // 触发添加搜索引擎事件
}

const handleFocus = () => {
  isFocused.value = true
}

const handleBlur = () => {
  isFocused.value = false
  setTimeout(() => {
    showEngineDropdown.value = false
    showSuggestions.value = false
    selectedIndex.value = -1
  }, 200)
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.search-box')) {
    showEngineDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 添加 props
defineProps<{
  minimalMode?: boolean
}>()

// 添加自动补全相关的状态
const suggestions = ref<{ type: string; text: string; bookmark?: Bookmark }[]>([])
const showSuggestions = ref(false)

// 添加 JSONP 请求函数
const fetchSuggestions = (query: string) => {
  // 如果是空或者只有快捷命令时不显示补全
  if (!query || query === '/' || /^\/[\w\d]+$/.test(query)) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }

  // 先搜索书签
  const searchLower = query.toLowerCase()
  const matchedBookmarks = bookmarkStore.state.bookmarks.filter(
    (b) => {
      // 过滤掉没有任何URL的书签
      const hasUrl = b.externalUrl || b.internalUrl
      return hasUrl && (
        b.name.toLowerCase().includes(searchLower) ||
        b.remark?.toLowerCase().includes(searchLower)
      )
    }
  )

  // 创建 JSONP 回调
  const script = document.createElement('script')
  const callbackName = `jsonp_${Date.now()}`

  ;(window as any)[callbackName] = (data: any) => {
    // 确保 data.result 存在，如果不存在则使用空数组
    const searchSuggestions = (data?.result || []).map((item: { word: string }) => item.word)

    // 合并书签和搜索建议
    suggestions.value = [
      ...matchedBookmarks.map(b => ({
        type: 'bookmark',
        text: b.name,
        icon: b.icon || 'material-symbols:bookmark',
        bookmark: b
      })),
      ...searchSuggestions.map(s => ({
        type: 'suggestion',
        text: s
      }))
    ]

    showSuggestions.value = true
    document.body.removeChild(script)
    delete (window as any)[callbackName]
  }

  // 处理快捷命令：提取空格后的内容作为搜索词
  const searchText = query.match(/^\/[\w\d]+\s+(.+)$/)?.[1] || query

  script.src = `https://sug.so.360.cn/suggest?encodein=utf-8&encodeout=utf-8&format=json&word=${encodeURIComponent(searchText)}&callback=${callbackName}`
  document.body.appendChild(script)
}

// 修改 watch 函数
watch(() => searchText.value, (newValue) => {
  // 只在以下情况不显示补全：
  // 1. 无输入
  // 2. 输入了 /
  // 3. 只输入了快捷命令（如 /gh, /123, /abc 等）
  if (newValue && !/^\/($|[\w\d]+$)/.test(newValue)) {
    fetchSuggestions(newValue)
    selectedIndex.value = -1
    if (suggestionsRef.value) {
      suggestionsRef.value.scrollTop = 0
    }
  } else {
    suggestions.value = []
    showSuggestions.value = false
    selectedIndex.value = -1
  }
})

// 修改建议选择处理函数
const handleSuggestionSelect = (suggestion: { type: string; text: string; bookmark?: Bookmark }) => {
  if (suggestion.type === 'bookmark' && suggestion.bookmark) {
    // 如果是书签，直接打开链接
    const url = bookmarkStore.state.isInternalMode
      ? suggestion.bookmark.externalUrl || suggestion.bookmark.internalUrl // 优先使用外网地址
      : suggestion.bookmark.externalUrl || suggestion.bookmark.internalUrl // 外网模式下也优先使用外网地址，没有则使用内网地址
    if (url) {
      window.open(url, '_blank')
    }
    showSuggestions.value = false
    searchText.value = ''
  } else {
    // 如果是普通搜索建议
    const prefix = searchText.value.match(/^\/[\w\d]+\s+/)?.[0] || ''
    searchText.value = prefix + suggestion.text
    showSuggestions.value = false
    handleSearch()
  }
}

const selectedIndex = ref(-1) // 当前选中的建词索引

// 修改键盘事件处理函数
const handleKeydown = (e: KeyboardEvent) => {
  // 确保 suggestions.value 始终是数组
  if (!showSuggestions.value || !Array.isArray(suggestions.value) || suggestions.value.length === 0) {
    if (e.key === 'Enter') {
      e.preventDefault() // 阻止默认行为

      // 检查是否是快捷命令
      const shortcutMatch = searchText.value.match(/^\/(\w+)$/)
      if (shortcutMatch) {
        handleSearch() // 如果是快捷命令，直接调用 handleSearch
        return
      }

      // 检查是否有书签匹配
      const searchLower = searchText.value.toLowerCase()
      const matchedBookmarks = userStore.isLoggedIn && bookmarkStore.$state.bookmarks
        ? bookmarkStore.$state.bookmarks.filter(
            (b: Bookmark) => {
              const hasUrl = b.externalUrl || b.internalUrl
              return hasUrl && (
                b.name.toLowerCase().includes(searchLower) ||
                b.remark?.toLowerCase().includes(searchLower)
              )
            }
          )
        : []

      // 如果有匹配的书签，直接打开第一个
      if (matchedBookmarks.length > 0) {
        const firstBookmark = matchedBookmarks[0]
        const url = bookmarkStore.$state.isInternalMode
          ? firstBookmark.internalUrl || firstBookmark.externalUrl
          : firstBookmark.externalUrl || firstBookmark.internalUrl
        if (url) {
          window.open(url, '_blank')
          searchText.value = ''
          return
        }
      }
      // 如果没有匹配的书签，执行普通搜索
      handleSearch()
    }
    return
  }

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      selectedIndex.value = (selectedIndex.value + 1) % suggestions.value.length
      scrollToSelected()
      break
    case 'ArrowUp':
      e.preventDefault()
      selectedIndex.value = selectedIndex.value <= 0
        ? suggestions.value.length - 1
        : selectedIndex.value - 1
      scrollToSelected()
      break
    case 'Enter':
      e.preventDefault() // 阻止默认行为
      if (selectedIndex.value >= 0) {
        handleSuggestionSelect(suggestions.value[selectedIndex.value])
      } else {
        // 如果没有选中任何建议，但有书签类型的建议，直接选择第一个书签
        const firstBookmark = suggestions.value.find(s => s.type === 'bookmark')
        if (firstBookmark) {
          handleSuggestionSelect(firstBookmark)
        } else {
          handleSearch()
        }
      }
      break
    case 'Escape':
      showSuggestions.value = false
      selectedIndex.value = -1
      break
  }
}

// 添加滚动到选中项的函数
const scrollToSelected = () => {
  if (!suggestionsRef.value) return

  const container = suggestionsRef.value
  const selectedElement = container.children[selectedIndex.value] as HTMLElement

  if (!selectedElement) return

  const containerHeight = container.clientHeight
  const itemHeight = selectedElement.offsetHeight
  const itemTop = selectedElement.offsetTop
  const scrollTop = container.scrollTop

  // 当选中项在可视区域外时进行滚动
  if (itemTop < scrollTop) {
    // 向上滚动
    container.scrollTop = itemTop
  } else if (itemTop + itemHeight > scrollTop + containerHeight) {
    // 向下滚动
    container.scrollTop = itemTop + itemHeight - containerHeight
  }
}

const suggestionsRef = ref<HTMLDivElement | null>(null)
</script>

<style scoped lang="scss">
.search-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 0;
  transition: all 0.3s ease;

  &.minimal-mode {
    padding: 0;
    max-width: 800px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;

    .minimal-engine-icon {
      font-size: 48px;
      color: var(--primary-color);
      opacity: 0.8;
      transition: all 0.3s ease;

      &:hover {
        opacity: 1;
        transform: scale(1.1);
      }
    }

    .search-box {
      transform: scale(1.1);
      transform-origin: center;
      width: 100%;
    }
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    border-radius: 16px;
    transition: all 0.3s ease;
    border: 2px solid var(--primary-color);
    background: var(--bg-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin: 0; // 重置 form 默认边距

    &.focused {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .engine-icon {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;

      .engine-logo {
        font-size: 28px; // 增大标尺寸
        color: var(--primary-color);
      }

      &:hover {
        background: var(--bg-secondary);
      }

      .arrow-icon {
        transition: transform 0.3s ease;
        font-size: 20px;

        &.rotated {
          transform: rotate(180deg);
        }
      }
    }

    .search-input {
      flex: 1;
      height: 44px;
      padding: 0 16px;
      border: none;
      background: transparent;
      font-size: 16px;
      color: var(--text-primary);
      outline: none;

      &::placeholder {
        color: var(--text-secondary);
      }
    }

    .search-button {
      height: 44px;
      padding: 0 24px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 500;
    }

    .engine-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      width: 200px;
      max-height: 260px;
      overflow-y: auto;
      background: var(--bg-primary);
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--scrollbar-color);
        border-radius: 2px;
      }

      .engine-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        cursor: pointer;
        transition: all 0.2s ease;
        height: 48px;
        box-sizing: border-box;

        &:hover {
          background: var(--bg-secondary);
        }

        &.active {
          background: var(--primary-color);
          color: white;
        }

        &.add-engine {
          color: var(--primary-color);
          font-weight: 500;
        }

        .engine-item-icon {
          font-size: 20px;
          flex-shrink: 0;
        }
      }

      .divider {
        height: 1px;
        background: var(--border-color);
        margin: 4px 0;
      }
    }

    .suggestions-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: 0;
      background: var(--bg-primary);
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      max-height: 300px;
      overflow-y: auto;

      .suggestion-item {
        padding: 12px 16px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: var(--bg-secondary);
        }

        &.selected {
          background: var(--bg-secondary);
        }

        // 添加图标样式
        display: flex;
        align-items: center;
        gap: 8px;

        .suggestion-icon {
          font-size: 16px;
          color: var(--primary-color);
        }

        .suggestion-text {
          flex: 1;
        }
      }

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--scrollbar-color);
        border-radius: 2px;
      }
    }
  }
}

.dark-mode {
  .search-box {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

    &.focused {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }

  .engine-dropdown {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

    &::-webkit-scrollbar-thumb {
      background: var(--scrollbar-color-dark);
    }
  }

  .suggestions-dropdown {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}

@media (max-width: 640px) {
  .search-container {
    padding: 0 10px;

    &.minimal-mode {
      padding: 0 16px;
      max-width: 100%;

      .minimal-engine-icon {
        font-size: 36px;
      }

      .search-box {
        transform: none;
        padding: 6px;
      }
    }

    .search-box {
      gap: 6px;

      .engine-icon {
        padding: 4px;

        .engine-logo {
          font-size: 20px;
        }

        .arrow-icon {
          font-size: 16px;
        }
      }

      .search-input {
        height: 36px;
        font-size: 14px;
        padding: 0 8px;
      }

      .search-button {
        height: 36px;
        padding: 0 12px;
        font-size: 14px;
        border-radius: 8px;
      }
    }
  }
}

@media (max-width: 360px) {
  .search-container {
    .search-box {
      .search-button {
        padding: 0 8px;
      }
    }
  }
}
</style>
