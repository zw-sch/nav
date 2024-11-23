<template>
  <div class="bookmark-container" :class="{ expanded: isExpanded }">
    <div class="header">
      <div class="first-row">
        <div class="header-left">
          <Icon icon="icon-park:bookmark" class="bookmark-icon" />
          <h3>书签</h3>
          <n-button text size="small" @click="showAddBookmarkDialog = true">
            <template #icon>
              <Icon icon="material-symbols:add" />
            </template>
            <span>添加书签</span>
          </n-button>
        </div>
        <div class="header-actions">
          <n-switch v-if="!collapsed" v-model:value="isInternalMode" :rail-style="railStyle">
            <template #checked>内网</template>
            <template #unchecked>外网</template>
          </n-switch>
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
      <div class="search-box">
        <n-input
          v-model:value="searchText"
          placeholder="搜索分类或书签..."
          clearable
          round
          @keydown.enter="handleSearchEnter"
        />
      </div>
    </div>

    <div class="content" v-show="!collapsed">
      <div v-for="category in filteredCategories" :key="category.id" class="category-section">
        <div class="category-header" @click="toggleCategory(category.id)">
          <Icon
            :icon="
              expandedCategories.includes(category.id)
                ? 'material-symbols:expand-more'
                : 'material-symbols:chevron-right'
            "
          />
          <Icon v-if="category.icon" :icon="category.icon" class="category-icon" />
          <span class="category-name">{{ category.label }}</span>
        </div>
        <div v-show="expandedCategories.includes(category.id)" class="bookmarks-grid">
          <template v-for="bookmark in getFilteredBookmarks(category.bookmarks)" :key="bookmark.id">
            <n-tooltip
              v-if="bookmark && bookmark.remark"
              trigger="hover"
              placement="bottom"
              :style="{ width: '100%' }"
            >
              <template #trigger>
                <div class="bookmark-card" @click.stop="openUrl(bookmark)">
                  <Icon
                    :icon="bookmark.icon || 'material-symbols:bookmark'"
                    class="bookmark-icon"
                  />
                  <div class="bookmark-info">
                    <div class="bookmark-name">{{ bookmark.name }}</div>
                    <div class="bookmark-url">{{ getDisplayUrl(bookmark) }}</div>
                    <div v-if="bookmark.remark" class="bookmark-remark">{{ bookmark.remark }}</div>
                  </div>
                </div>
              </template>
              <div class="bookmark-remark-tooltip">{{ bookmark.remark }}</div>
            </n-tooltip>

            <div v-else-if="bookmark" class="bookmark-card" @click.stop="openUrl(bookmark)">
              <Icon :icon="bookmark.icon || 'material-symbols:bookmark'" class="bookmark-icon" />
              <div class="bookmark-info">
                <div class="bookmark-name">{{ bookmark.name }}</div>
                <div class="bookmark-url">{{ getDisplayUrl(bookmark) }}</div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 添加书签对话框 -->
    <AddBookmarkDialog
      v-model:show="showAddBookmarkDialog"
      :editing="editingBookmark"
      @success="handleBookmarkSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Icon } from '@iconify/vue'
import { NSwitch, NButton, NTree, NDropdown, useMessage, NTooltip } from 'naive-ui'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import AddBookmarkDialog from './AddBookmarkDialog.vue'
import type { TreeOption } from 'naive-ui'
import type { Bookmark } from '@/types/bookmark'

const bookmarkStore = useBookmarkStore()
const message = useMessage()

const showAddBookmarkDialog = ref(false)
const editingBookmark = ref<Bookmark | null>(null)

// 内外网切换
const isInternalMode = ref(localStorage.getItem('bookmarkInternalMode') === 'true')

// 监听 isInternalMode 的变化，同步到 store 和 localStorage
watch(isInternalMode, (newValue) => {
  bookmarkStore.state.isInternalMode = newValue
  localStorage.setItem('bookmarkInternalMode', newValue.toString())
})

// 监听 store 中的值变化，同步到本地
watch(
  () => bookmarkStore.state.isInternalMode,
  (newValue) => {
    if (isInternalMode.value !== newValue) {
      isInternalMode.value = newValue
      localStorage.setItem('bookmarkInternalMode', newValue.toString())
    }
  },
)

// 切换按钮样式
const railStyle = ({ focused, checked }) => {
  const style = {}
  if (checked) {
    style.background = '#2080f0'
  } else {
    style.background = '#4098fc'
  }
  if (focused) {
    style.boxShadow = '0 0 0 2px #2080f0'
  }
  return style
}

// 添加搜索状态
const searchText = ref('')

// 添加展开状态管理
const expandedCategories = ref<string[]>([])

// 切换分类展开状态
const toggleCategory = (categoryId: string) => {
  const index = expandedCategories.value.indexOf(categoryId)
  if (index === -1) {
    expandedCategories.value.push(categoryId)
  } else {
    expandedCategories.value.splice(index, 1)
  }
}

// 修改过滤逻辑，添加自动展开功能和图标信息
const filteredCategories = computed(() => {
  const searchLower = searchText.value.toLowerCase()
  const results = bookmarkStore.state.categories
    .map((category) => {
      const bookmarks = bookmarkStore.state.bookmarks
        .filter((b) => b.categoryId === category.id)
        .filter(
          (b) =>
            !searchText.value ||
            b.name.toLowerCase().includes(searchLower) ||
            b.remark?.toLowerCase().includes(searchLower),
        )

      const categoryMatches = category.name.toLowerCase().includes(searchLower)

      if (!searchText.value || categoryMatches || bookmarks.length > 0) {
        return {
          id: category.id,
          label: category.name,
          icon: category.icon,
          bookmarks,
        }
      }
      return null
    })
    .filter(Boolean)

  // 如是搜索状态，自动展开包含匹配书签的分类
  if (searchText.value) {
    results.forEach((category) => {
      if (category.bookmarks.length > 0 && !expandedCategories.value.includes(category.id)) {
        expandedCategories.value.push(category.id)
      }
    })
  }

  return results
})

function renderIcon(icon: string) {
  return () => h(Icon, { icon })
}

// 处理书签操作
const handleBookmarkAction = (key: string, bookmark: Bookmark) => {
  if (key === 'visit') {
    const url = isInternalMode.value ? bookmark.internalUrl : bookmark.externalUrl
    window.open(url, '_blank')
  } else if (key === 'edit') {
    editingBookmark.value = bookmark
    showAddBookmarkDialog.value = true
  } else if (key === 'delete') {
    bookmarkStore.removeBookmark(bookmark.id)
    message.success('删除成功')
  }
}

// 处理书签添加/编辑成功
const handleBookmarkSuccess = () => {
  showAddBookmarkDialog.value = false
  editingBookmark.value = null
}

// 根据当前模式过滤书
const getFilteredBookmarks = (bookmarks: Bookmark[]) => {
  return bookmarks.filter((bookmark) => {
    if (isInternalMode.value) {
      // 内网模式：显示所有有内网地址或外网地址的书签
      return bookmark.internalUrl || bookmark.externalUrl
    } else {
      // 外网模式只显示有外网地址的书签
      return bookmark.externalUrl
    }
  })
}

// 获取显示的URL
const getDisplayUrl = (bookmark: Bookmark) => {
  if (isInternalMode.value) {
    // 内网模式：优先显示内网地址，没有则显示外网地址
    return bookmark.internalUrl || bookmark.externalUrl
  } else {
    // 外网模式：显示外网地址
    return bookmark.externalUrl
  }
}

// 打开书签链接
const openUrl = (bookmark: Bookmark) => {
  const url = isInternalMode.value
    ? bookmark.internalUrl || bookmark.externalUrl // 内网模式：优先使用内网地址，没有则使用外网地址
    : bookmark.externalUrl // 外网模式：网地址
  if (url) {
    window.open(url, '_blank')
  }
}

// 从 localStorage 读取状态
const collapsed = ref(localStorage.getItem('bookmarkCollapsed') === 'true')
const isExpanded = ref(false)

// 修改展开/收起按钮的点击处理
const handleExpandClick = () => {
  if (collapsed.value && !isExpanded.value) {
    // 展开容器时，保存之前的折叠状态
    localStorage.setItem('bookmarkBeforeExpand', collapsed.value.toString())
    collapsed.value = false
    localStorage.setItem('bookmarkCollapsed', 'false')
  }
  isExpanded.value = !isExpanded.value
}

// 修改折叠按钮的点击处理
const handleCollapseClick = () => {
  if (isExpanded.value && !collapsed.value) {
    // 如果是从展开状态折叠，恢复之前的折叠状态
    const beforeExpandState = localStorage.getItem('bookmarkBeforeExpand')
    collapsed.value = beforeExpandState === 'true'
    isExpanded.value = false
  } else {
    collapsed.value = !collapsed.value
  }
  localStorage.setItem('bookmarkCollapsed', collapsed.value.toString())
}

// 添加 ESC 键监听
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (isExpanded.value) {
      // 如果是放大状态，按 ESC 键退出放大
      isExpanded.value = false
      // 恢复之前的折叠状态
      const beforeExpandState = localStorage.getItem('bookmarkBeforeExpand')
      collapsed.value = beforeExpandState === 'true'
      localStorage.setItem('bookmarkCollapsed', collapsed.value.toString())
    } else if (searchText.value) {
      // 如果有搜索内容，清空搜索并折叠容器
      searchText.value = ''
      collapsed.value = true
      localStorage.setItem('bookmarkCollapsed', 'true')
    }
  }
}

// 在组件挂载时添加键盘事件监听
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

// 在组件卸载时移除键盘事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 监听搜索文本变化
watch(searchText, (newValue) => {
  if (newValue) {
    // 有搜索内容时自动展开容器
    collapsed.value = false
    localStorage.setItem('bookmarkCollapsed', 'false')

    // 自动展开包含匹配书签的分类
    const results = filteredCategories.value
    results.forEach((category) => {
      if (category && category.bookmarks.length > 0 && !expandedCategories.value.includes(category.id)) {
        expandedCategories.value.push(category.id)
      }
    })
  }
})

// 添加搜索框的回车事件处理
const handleSearchEnter = () => {
  // 获取过滤后的所有书签
  const allFilteredBookmarks = filteredCategories.value.reduce<Bookmark[]>((acc, category) => {
    if (category) {
      const bookmarks = getFilteredBookmarks(category.bookmarks)
      return [...acc, ...bookmarks]
    }
    return acc
  }, [])

  // 如果只有一个搜索结果，直接打开链接
  if (allFilteredBookmarks.length === 1) {
    openUrl(allFilteredBookmarks[0])
    // 清空搜索并折叠容器
    searchText.value = ''
    collapsed.value = true
    localStorage.setItem('bookmarkCollapsed', 'true')
  }
}
</script>
<style scoped lang="scss">
.bookmark-container {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 16px;
  margin-top: 20px;
  transition: all 0.3s ease;
  width: 100%;
  box-sizing: border-box;

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
    height: 100vh;

    .header {
      flex-shrink: 0;
      position: sticky;
      top: 12px;
      background: var(--bg-secondary);
      z-index: 1;
      margin-bottom: 12px;
    }

    .content {
      flex: 1;
      overflow-y: auto;
      margin: 0 -12px;
      padding: 0 12px;
      max-height: none !important;
      height: calc(100vh - 120px);
    }
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;

    // PC 端布局
    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      height: 32px;

      .bookmark-icon {
        font-size: 20px;
        color: var(--primary-color);
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

      .n-button {
        height: 32px;
        padding: 0 8px;
        font-size: 14px;
        font-weight: normal;
        width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
      }
    }

    .search-box {
      flex: 1;
      max-width: 400px;
      height: 32px;
      order: 2;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-shrink: 0;
      height: 32px;
      order: 3;

      .n-button {
        height: 32px;
        width: 32px;
      }

      .n-switch {
        height: 22px;
      }
    }

    // 移除 first-row 在 PC 端的样式
    @media (min-width: 641px) {
      .first-row {
        display: contents;
      }
    }
  }

  .content {
    width: 100%;
    box-sizing: border-box;
    max-height: 200px;
    overflow-y: auto;
    transition: all 0.3s ease;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--scrollbar-color);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-track {
      background-color: transparent;
    }

    .bookmark-container.expanded & {
      max-height: none;
      height: calc(100vh - 100px);
      overflow-y: auto;
    }

    .category-section {
      margin-bottom: 16px;
      width: 100%;

      .category-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0px;
        cursor: pointer;
        color: var(--text-primary);
        font-weight: 500;
        transition: background-color 0.2s;
        border-radius: 4px;

        &:hover {
          background-color: var(--bg-primary);
        }

        .category-name {
          font-size: 16px;
        }

        .category-icon {
          font-size: 20px;
          color: var(--primary-color);
        }
      }

      .bookmarks-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr); // 固定5列
        gap: 16px;
        padding: 16px;
        width: 100%;
        box-sizing: border-box;
        min-width: 0; // 添加这行，防止溢出
      }
    }

    .bookmark-card {
      display: flex;
      align-items: flex-start; // 修改为顶部对齐
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--bg-primary);
      height: 100px; // 固定卡片高度
      box-sizing: border-box;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .bookmark-icon {
        font-size: 24px;
        color: var(--primary-color);
        flex-shrink: 0;
      }

      .bookmark-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        height: 100%; // 占满卡片高度
        overflow: hidden; // 确保内容不会溢出

        .bookmark-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .bookmark-url {
          font-size: 12px;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .bookmark-remark {
          font-size: 12px;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2; // 显示两行
          -webkit-box-orient: vertical;
          line-height: 1.4;
          max-height: 2.8em; // 两行的高度
        }
      }
    }

    // 响应式布局
    @media (max-width: 1400px) {
      .bookmarks-grid {
        grid-template-columns: repeat(4, 1fr) !important;
      }
    }

    @media (max-width: 1200px) {
      .bookmarks-grid {
        grid-template-columns: repeat(3, 1fr) !important;
      }
    }

    @media (max-width: 900px) {
      .bookmarks-grid {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }

    @media (max-width: 640px) {
      padding: 12px;

      .bookmarks-grid {
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 8px;
        padding: 8px;
      }

      .bookmark-card {
        height: auto;
        min-height: 60px;
        max-height: 80px;
        padding: 8px;
        width: 100%;
        box-sizing: border-box;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 4px;

        .bookmark-icon {
          font-size: 20px;
          margin: 0;
        }

        .bookmark-info {
          width: 100%;

          .bookmark-name {
            font-size: 12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: center;
          }

          .bookmark-url,
          .bookmark-remark {
            display: none;
          }
        }
      }
    }
  }
}

// 深色模式适配
.dark-mode {
  .bookmark-card {
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
    }
  }

  .bookmark-container.expanded {
    background: var(--bg-secondary);
  }
}

// 移动端适配
@media (max-width: 640px) {
  .bookmark-container {
    padding: 12px;

    .header {
      flex-direction: column;
      gap: 12px;
      margin-right: -8px;

      .first-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        order: 1;

        .header-left {
          width: auto;
          flex: 0 0 auto;

          h3 {
            font-size: 14px;
            width: 48px;
          }

          .n-button {
            font-size: 12px;
            width: 80px;
            padding: 0 4px;
            height: 28px;
          }
        }

        .header-actions {
          width: auto;
          flex: 0 0 auto;
          margin-left: auto;
          gap: 4px;
          padding-right: 8px;

          .n-button {
            height: 28px;
            width: 28px;
          }

          .n-switch {
            height: 20px;
            transform: scale(0.9);
          }
        }
      }

      .search-box {
        order: 2;
        width: 100%;
        max-width: none;
        margin-top: 12px;

        .n-input {
          width: 100%;
          margin: 0 auto;
        }
      }
    }
  }
}

// 超小屏幕使用两列布局
@media (max-width: 360px) {
  .bookmark-container {
    .content {
      .bookmarks-grid {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }
  }
}

// 添加备注样式
.bookmark-remark {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto;
}

// 添加备注提示框样式
.bookmark-remark-tooltip {
  max-width: 300px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
}
</style>
