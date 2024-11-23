<template>
  <div
    v-if="isLoggedIn"
    class="hot-search"
    :class="{ 'dark-mode': isDarkMode, expanded: isExpanded }"
  >
    <div class="hot-header">
      <div class="header-left">
        <Icon icon="ri:fire-fill" class="icon" />
        <h3>热搜榜</h3>
        <n-dropdown
          v-if="sources.length > 0"
          trigger="hover"
          :options="hotSourceOptions"
          @select="handleHotSourceChange"
          class="mobile-dropdown"
        >
          <n-button text class="source-btn">
            {{ currentSource?.name }}
            <template #icon>
              <Icon icon="material-symbols:keyboard-arrow-down" />
            </template>
          </n-button>
        </n-dropdown>
      </div>

      <div class="quick-sources" v-if="showQuickSources">
        <div
          v-for="source in visibleSources"
          :key="source.id"
          class="source-item"
          :class="{ active: currentSource?.id === source.id }"
          @click="handleHotSourceChange(source.id)"
        >
          <Icon :icon="source.icon" class="source-icon" />
          <span class="source-name">{{ source.name }}</span>
        </div>
      </div>

      <div class="header-right">
        <span class="update-time" v-if="updateTime">
          {{ formatUpdateTime(updateTime) }}
        </span>
        <n-button
          v-if="sources.length > 0"
          quaternary
          circle
          size="small"
          class="refresh-btn"
          :loading="loading"
          @click="fetchHotSearch"
        >
          <template #icon>
            <Icon icon="material-symbols:refresh" />
          </template>
        </n-button>
        <n-button quaternary circle @click="handleExpandClick">
          <template #icon>
            <Icon
              :icon="
                isExpanded ? 'material-symbols:close-fullscreen' : 'material-symbols:open-in-full'
              "
            />
          </template>
        </n-button>
        <n-button quaternary circle @click="handleCollapseClick">
          <template #icon>
            <Icon
              :icon="collapsed ? 'material-symbols:expand-more' : 'material-symbols:expand-less'"
            />
          </template>
        </n-button>
      </div>
    </div>
    <div class="hot-list" v-show="!collapsed">
      <template v-if="sources.length > 0">
        <div class="hot-items-container">
          <n-popover
            v-for="(item, index) in displayHotList"
            :key="index"
            :trigger="getTrigger"
            placement="right"
            :width="shouldShowPreview ? 500 : 'trigger'"
            :raw="true"
            :show-arrow="false"
            :style="{ padding: 0 }"
            :disabled="isMobile"
          >
            <template #trigger>
              <div class="hot-item" @click="openUrl(item.url)">
                <span class="index" :class="{ 'top-3': index < 3 }">{{ index + 1 }}</span>
                <span class="title">{{ item.title }}</span>
              </div>
            </template>

            <template v-if="!isMobile">
              <template v-if="currentSource?.enablePreview">
                <div class="preview-container">
                  <div class="preview-header">
                    <span class="preview-title">{{ item.title }}</span>
                    <n-button text size="small" @click="openUrl(item.url)">
                      <template #icon>
                        <Icon icon="material-symbols:open-in-new" />
                      </template>
                      在新窗口打开
                    </n-button>
                  </div>
                  <div class="preview-content">
                    <iframe
                      :src="item.url"
                      frameborder="0"
                      sandbox="allow-scripts allow-same-origin"
                      loading="lazy"
                      @load="handleIframeLoad"
                    ></iframe>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="info-card" v-if="hasDetailInfo(item)">
                  <div class="card-header">
                    <h3 class="card-title">{{ item.title }}</h3>
                    <n-button text size="small" @click="openUrl(item.url)">
                      <template #icon>
                        <Icon icon="material-symbols:open-in-new" />
                      </template>
                      在新窗口打开
                    </n-button>
                  </div>
                  <div class="card-content">
                    <div v-if="item.cover" class="cover-container">
                      <img :src="item.cover" :alt="item.title" class="cover-image" />
                    </div>
                    <div class="info-container">
                      <div v-if="item.author" class="author">
                        作者：{{ item.author }}
                      </div>
                      <div v-if="item.desc" class="description">
                        {{ item.desc }}
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else-if="item.desc" class="simple-desc">
                  {{ item.desc }}
                </div>
              </template>
            </template>
          </n-popover>
        </div>
      </template>
      <div v-else class="empty-state">
        <Icon icon="material-symbols:format-list-bulleted" class="empty-icon" />
        <p>暂无热搜源，请添加热搜源</p>
        <n-button type="primary" @click="showAddHotSourceDialog = true"> 添加热搜源 </n-button>
      </div>
    </div>

    <AddHotSourceDialog
      v-model:show="showAddHotSourceDialog"
      :editing="null"
      @success="handleHotSourceSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, h } from 'vue'
import { storeToRefs } from 'pinia'
import { Icon } from '@iconify/vue'
import { NButton, NDropdown, NTooltip, NPopover, useMessage } from 'naive-ui'
import { useSearchStore } from '@/stores/searchStore'
import { useUserStore } from '@/stores/userStore'
import { useHotStore } from '@/stores/hotStore'
import type { HotItem } from '@/types/hot'
import AddHotSourceDialog from './AddHotSourceDialog.vue'

const message = useMessage()
const userStore = useUserStore()
const { isDarkMode } = storeToRefs(useSearchStore())
const { isLoggedIn } = storeToRefs(userStore)

const hotStore = useHotStore()
const { sources, currentSource } = storeToRefs(hotStore)

const hotList = ref<HotItem[]>([])
const updateTime = ref<string>('')
const loading = ref(false)
const showAddHotSourceDialog = ref(false)
const collapsed = ref(localStorage.getItem('hotSearchCollapsed') === 'true')
const isExpanded = ref(localStorage.getItem('hotSearchExpanded') === 'true')
const isMobile = ref<boolean>(false)

// 确保在组件挂载时检查登录状态和配置
const isVisible = computed(() => {
  return userStore.currentUser?.container_config?.showHotSearch ?? false
})

// 修改 shouldShowPreview 计算属性
const shouldShowPreview = computed(() => {
  return currentSource.value?.enablePreview && !isMobile.value
})

// 获取热搜数据
const fetchHotSearch = async () => {
  if (loading.value || !isLoggedIn.value || !currentSource.value) return
  loading.value = true
  try {
    const response = await fetch(currentSource.value.url)
    const data = await response.json()
    if (data.code === 200) {
      const limit = isExpanded.value ? 50 : 10
      hotList.value = data.data.slice(0, limit)
      updateTime.value = data.updateTime || new Date().toISOString()
    }
  } catch (error) {
    console.error('Failed to fetch hot search:', error)
    hotList.value = []
  } finally {
    loading.value = false
  }
}

// 监听登录状态变化
watch(isLoggedIn, (newValue) => {
  if (newValue) {
    fetchHotSearch()
  } else {
    hotList.value = []
    updateTime.value = ''
  }
})

// 监听热搜显示状态变化
watch(
  () => isVisible.value,
  async (newValue) => {
    if (
      newValue &&
      sources.value.length === 0 &&
      !userStore.currentUser?.container_config?.showHotSearch
    ) {
      // 只有在容器开启但还没有数据时才获取
      await hotStore.fetchSources()
    }
  },
  { immediate: true },
)

// 热搜来源配置
const hotSourceOptions = computed(() => [
  ...sources.value.map((source) => ({
    label: source.name,
    key: source.id,
    icon: renderIcon(source.icon),
  })),
  {
    type: 'divider',
    key: 'd1',
  },
  {
    label: '添加源',
    key: 'add',
    icon: renderIcon('material-symbols:add'),
  },
])

function renderIcon(icon: string) {
  return () => h(Icon, { icon })
}

const openUrl = (url: string) => {
  window.open(url, '_blank')
}

// 在 script setup 中添加
const savedSourceId = ref(localStorage.getItem('lastSelectedHotSourceId'))

// 修改热搜源切换处理函数
const handleHotSourceChange = async (key: string | number) => {
  if (key === 'add') {
    showAddHotSourceDialog.value = true
    return
  }

  const source = sources.value.find((s) => s.id === key)
  if (source) {
    hotStore.setCurrentSource(source)
    collapsed.value = false
    await fetchHotSearch()
  }
}

// 监听当前热搜源变化，自动刷新数据
watch(
  () => currentSource.value,
  async (newSource) => {
    if (newSource) {
      await fetchHotSearch()
    } else {
      hotList.value = []
      updateTime.value = ''
    }
  },
)

// 修改 visibleSources 计算属性
const getSourceCount = () => {
  const width = window.innerWidth
  if (isExpanded.value) {
    // 放大状态下显示更多
    if (width >= 1920) return 11
    else if (width >= 1440) return 9
    else if (width >= 1200) return 7
    else if (width >= 992) return 5
    else if (width >= 500) return 2
    else return 0
  } else {
    // 正常状态下
    if (width >= 1920) return 5
    else if (width >= 1440) return 4
    else if (width >= 1200) return 3
    else if (width >= 992) return 2
    else if (width >= 500) return 1
    else return 0
  }
}

// 使用 ref 来存储可见源的数量
const visibleSourceCount = ref(getSourceCount())

// 修改 visibleSources 计算属性
const visibleSources = computed(() => {
  return visibleSourceCount.value > 0 ? sources.value.slice(0, visibleSourceCount.value) : []
})

// 只保留这一个完整的 checkDevice 函数和相关的事件处理
const checkDevice = () => {
  const width = window.innerWidth
  isMobile.value = width <= 640
  visibleSourceCount.value = getSourceCount()
}

// 添加防抖函数
const debounce = <T extends (...args: unknown[]) => unknown>(fn: T, delay: number) => {
  let timer: number | null = null
  return (...args: Parameters<T>) => {
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

// 使用防抖处理窗口大小变化
const debouncedCheckDevice = debounce(checkDevice, 200)

// 组件挂载和卸载时的事件处理
onMounted(() => {
  checkDevice() // 初始化检查
  window.addEventListener('resize', debouncedCheckDevice)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', debouncedCheckDevice)
  document.removeEventListener('keydown', handleKeydown)
})

// 检测文本出
const isTextOverflow = (text: string) => {
  const testDiv = document.createElement('div')
  testDiv.style.position = 'absolute'
  testDiv.style.visibility = 'hidden'
  testDiv.style.whiteSpace = 'nowrap'
  testDiv.style.fontSize = '14px'
  testDiv.innerText = text
  document.body.appendChild(testDiv)
  const width = testDiv.offsetWidth
  document.body.removeChild(testDiv)
  return width > 160 // 假设单个热搜项的最大宽度为160px
}

// 添加热搜源成功处理
const handleHotSourceSuccess = async () => {
  showAddHotSourceDialog.value = false
  await hotStore.fetchSources() // 重新获取热搜源列表
  message.success('添加成功')
}

// 在 script setup 部分添加开状态监听
watch(isExpanded, async (newValue) => {
  if (newValue && currentSource.value) {
    // 展开时重新获取数据
    await fetchHotSearch()
  }
})

// 修改计算属性来控制显示的数据量
const displayHotList = computed(() => {
  return isExpanded.value ? hotList.value : hotList.value.slice(0, 10)
})

// 修改展开/收起按钮的点击处理
const handleExpandClick = () => {
  if (collapsed.value && !isExpanded.value) {
    collapsed.value = false
    localStorage.setItem('hotSearchCollapsed', 'false')
  }
  isExpanded.value = !isExpanded.value
  localStorage.setItem('hotSearchExpanded', isExpanded.value.toString())
}

// 修改折叠按钮的点击处理
const handleCollapseClick = () => {
  if (isExpanded.value && !collapsed.value) {
    isExpanded.value = false
    localStorage.setItem('hotSearchExpanded', 'false')
  }
  collapsed.value = !collapsed.value
  localStorage.setItem('hotSearchCollapsed', collapsed.value.toString())
}

// 添加 ESC 键监听
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isExpanded.value) {
    // 如果是放大状态，按 ESC 键退出
    isExpanded.value = false
    localStorage.setItem('hotSearchExpanded', 'false')
  }
}

// 在组件挂载时添加盘事件监听
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

// 在组件卸载时移除键盘事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 格式化时间，只显示小时和分钟
const formatUpdateTime = (time: string) => {
  const date = new Date(time)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const showQuickSources = computed(() => visibleSources.value.length > 0)

// 修改监听展开状态变化的代码
watch(isExpanded, () => {
  // 强制重新计算可见源数量
  visibleSourceCount.value = getSourceCount()
})

// 修改 hasDetailInfo 函数
const hasDetailInfo = (item: HotItem) => {
  // 移动端始终返回 false，不显示详细信息卡片
  if (isMobile.value) return false
  return Boolean(item.author || item.cover || (item.desc && item.desc.length > 50))
}

// 添加 handleIframeLoad 函数
const handleIframeLoad = () => {
  // 空函数，用于处理 iframe 载事件
  // 移动端不触发此函数，因为不会显示预览
}

// 修改 PopoverTrigger 类型问题
const getTrigger = computed(() => isMobile.value ? 'none' as const : 'hover' as const)

// 在 script setup 部分添加对 isMinimalMode 的监听
const props = defineProps<{
  isMinimalMode?: boolean
}>()

// 修改 watch 监听
watch(
  [() => currentSource.value, () => props.isMinimalMode],
  async ([newSource, isMinimal]) => {
    if (newSource && !isMinimal) {
      await fetchHotSearch()
    }
  },
  { immediate: true } // 添加 immediate: true 确保首次加载时执行
)
</script>

<style scoped lang="scss">
.hot-search {
  width: 100%;
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 16px;
  margin-top: 12px;
  transition: all 0.3s ease;

  &.expanded {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    margin: 0;
    padding: 12px;
    border-radius: 0;
    width: 100%;
    max-width: 100%;
    display: flex;
    flex-direction: column;

    .hot-header {
      flex-shrink: 0;
      position: sticky;
      top: 12px;
      background: var(--bg-secondary);
      z-index: 1;
      margin-bottom: 12px;
    }

    .hot-list {
      flex: 1;
      overflow-y: auto;
      margin: 0 -12px;
      padding: 0 12px;
    }
  }

  .hot-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      height: 32px;

      .icon {
        font-size: 20px;
        color: #ff4d4f;
        flex-shrink: 0;
      }

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        line-height: 32px;
        width: 48px;
      }

      .source-btn {
        height: 32px;
        padding: 0 8px;
        font-size: 14px;
        font-weight: normal;
        width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: left;
        justify-content: flex-start;
        gap: 4px;

        .iconify {
          font-size: 16px;
          flex-shrink: 0;
        }

        span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: left;
        }
      }

      .mobile-dropdown {
        display: none;

        @media (max-width: 991px) {
          display: block;
        }
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-shrink: 0;
      height: 32px;

      .update-time {
        font-size: 12px;
        color: var(--text-secondary);
        min-width: 56px;
        text-align: right;
      }

      .n-button {
        height: 32px;
        width: 32px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;

        .iconify {
          font-size: 20px;
        }
      }

      .refresh-btn {
        font-size: 16px;
        transition: transform 0.3s ease;

        &:hover {
          transform: rotate(180deg);
        }
      }
    }

    .quick-sources {
      display: flex;
      gap: 16px;
      margin: 0 24px;
      padding: 8px 0;
      justify-content: center;
      flex-wrap: nowrap;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
      -ms-overflow-style: none;

      &::-webkit-scrollbar {
        display: none;
      }

      @media (max-width: 499px) {
        display: none;
      }

      .source-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        background: var(--bg-primary);
        flex-shrink: 0;
        max-width: 160px;

        &:hover {
          background: var(--bg-secondary);
          transform: translateY(-1px);
        }

        &.active {
          background: var(--primary-color);
          color: white;
        }

        .source-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .source-name {
          font-size: 15px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }

  .hot-list {
    display: flex;
    flex-direction: column;
    min-height: 200px;

    // 添加网格布局容器
    .hot-items-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr); // 两列布局
      gap: 16px; // 列间距
      padding: 16px;
    }

    :deep(.n-tooltip) {
      width: 100%;
      max-width: 100%;
    }

    .hot-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      width: 100%;
      min-width: 0;

      &:hover {
        background: var(--bg-primary);
      }

      .index {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);

        &.top-3 {
          color: #ff4d4f;
        }
      }

      .title {
        flex: 1;
        min-width: 0;
        font-size: 14px;
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.5;
        padding-right: 8px;
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      color: var(--text-secondary);
      flex: 1;

      .empty-icon {
        font-size: 48px;
        margin-bottom: auto;
        opacity: 0.5;
      }

      p {
        margin: 0 0 20px;
        font-size: 14px;
      }
    }
  }
}

// 移动端适配
@media (max-width: 640px) {
  .hot-search {
    padding: 12px;

    .hot-header {
      margin-right: -8px;
      gap: 8px;

      .header-left {
        h3 {
          font-size: 14px;
          width: 48px;
        }

        .source-btn {
          font-size: 12px;
          width: 80px;
          padding: 0 4px;
          height: 28px;

          .iconify {
            font-size: 14px;
          }
        }
      }

      .header-right {
        gap: 4px;
        padding-right: 8px;

        .update-time {
          font-size: 10px;
          min-width: 40px;
        }

        .n-button {
          height: 28px;
          width: 28px;

          .iconify {
            font-size: 18px;
          }
        }
      }
    }

    .hot-list {
      .hot-items-container {
        grid-template-columns: 1fr !important; // 移动端改为单列
        gap: 8px;
        padding: 8px;
      }

      .hot-item {
        padding: 6px 8px;

        .index {
          width: 16px;
          height: 16px;
          font-size: 12px;
        }

        .title {
          font-size: 14px;
          padding-right: 4px;
        }
      }
    }

    &.expanded {
      .hot-list {
        .hot-items-container {
          grid-template-columns: 1fr !important; // 确保展开状态也是单列
        }
      }
    }
  }
}

// 添加横屏模式适配
@media (orientation: landscape) and (max-width: 900px) {
  .hot-search.expanded {
    .hot-list {
      .hot-items-container {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }
  }
}

// 自定义 tooltip 样式
:deep(.n-tooltip) {
  .n-tooltip-trigger {
    width: 100%;
  }
}

// 添加预览相关样式
.preview-container {
  background: var(--bg-primary);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);

    .preview-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-right: 12px;
    }
  }

  .preview-content {
    position: relative;
    width: 100%;
    height: 600px;
    overflow: hidden;

    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  }
}

.dark-mode {
  .preview-container {
    .preview-content {
      background: #1a1a1a;

      .mobile-browser {
        background: #2a2a2a;

        .browser-header {
          background: #333;
          border-bottom-color: #444;

          .browser-address {
            background: #2a2a2a;
            color: #999;
          }
        }
      }
    }
  }
}

// 自定义 popover 样式
:deep(.n-popover) {
  padding: 0;
  max-height: 80vh;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

  &.dark-mode {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  }
}

// 添加响应式样式
@media (max-width: 991px) {
  .hot-header {
    .quick-sources {
      display: none;
    }
  }
}

// 修改放大状态下的样式
.hot-search.expanded {
  .hot-header {
    .quick-sources {
      gap: 16px;
      margin: 0 24px;
      padding: 8px 0;
      flex-wrap: nowrap;

      .source-item {
        max-width: 200px;
      }
    }
  }
}

// 添加信息卡片样式
.info-card {
  padding: 16px;
  background: var(--bg-primary);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    gap: 12px;

    .card-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.4;
      flex: 1;
    }
  }

  .card-content {
    display: flex;
    gap: 16px;

    .cover-container {
      flex-shrink: 0;
      width: 120px;
      height: 160px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      .cover-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .info-container {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .author {
        font-size: 14px;
        color: var(--text-secondary);
      }

      .description {
        font-size: 14px;
        line-height: 1.6;
        color: var(--text-primary);
        opacity: 0.9;
        display: -webkit-box;
        -webkit-line-clamp: 5;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }
}

.simple-desc {
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  max-height: 200px;
  overflow-y: auto;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

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

.dark-mode {
  .simple-desc {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
}
</style>
