<template>
  <div class="panel-container">
    <div class="panel-header">
      <div class="header-content">
        <n-button type="primary" @click="showAddDialog = true">
          <template #icon>
            <Icon icon="material-symbols:add" />
          </template>
          添加书签
        </n-button>
      </div>
    </div>

    <!-- PC端表格视图 -->
    <div v-if="isDesktop" class="table-wrapper">
      <!-- 固定表头 -->
      <div class="table-header">
        <table class="header-table">
          <colgroup>
            <col style="width: 10%" />
            <col style="width: 20%" />
            <col style="width: 20%" />
            <col style="width: 10%" />
            <col style="width: 15%" />
          </colgroup>
          <thead>
            <tr>
              <th class="cell">图标</th>
              <th class="cell">名称</th>
              <th class="cell">分类</th>
              <th class="cell">排序</th>
              <th class="cell">操作</th>
            </tr>
          </thead>
        </table>
      </div>

      <!-- 可动的数据区域 -->
      <div class="table-body">
        <div class="table-body-inner">
          <table class="data-table">
            <colgroup>
              <col style="width: 10%" />
              <col style="width: 20%" />
              <col style="width: 20%" />
              <col style="width: 10%" />
              <col style="width: 15%" />
            </colgroup>
            <tbody>
              <tr v-for="bookmark in processedBookmarks" :key="bookmark.id" draggable="true" @dragstart="handleDragStart($event, bookmark)" @dragenter="handleDragEnter($event, bookmark)" @dragleave="handleDragLeave" @dragover.prevent @drop="handleDrop($event, bookmark)" class="draggable-row">
                <td class="cell">
                  <Icon :icon="bookmark.icon || 'material-symbols:bookmark'" />
                </td>
                <td class="cell">{{ bookmark.name }}</td>
                <td class="cell">{{ bookmark.categoryName }}</td>
                <td class="cell">{{ bookmark.sortOrder }}</td>
                <td class="cell">
                  <div class="action-buttons">
                    <n-button text size="small" @click="handleEdit(bookmark)">编辑</n-button>
                    <n-button text size="small" type="error" @click="handleRemove(bookmark)">删除</n-button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 移动端简化列表 -->
    <div v-else class="mobile-list">
      <n-thing
        v-for="bookmark in bookmarkData"
        :key="bookmark.id"
        :title="bookmark.name"
        class="list-item"
      >
        <template #description>
          <span class="category-tag">{{ bookmark.categoryName }}</span>
        </template>
        <template #header-extra>
          <div class="item-actions">
            <n-button text @click="handleEdit(bookmark)">
              <template #icon>
                <Icon icon="material-symbols:edit-outline" />
              </template>
            </n-button>
            <n-button text type="error" @click="handleRemove(bookmark)">
              <template #icon>
                <Icon icon="material-symbols:delete-outline" />
              </template>
            </n-button>
          </div>
        </template>
      </n-thing>
    </div>

    <AddBookmarkDialog
      v-model:show="showAddDialog"
      :editing="editingBookmark"
      @success="handleSuccess"
    />

    <DeleteConfirm
      ref="deleteConfirmRef"
      title="删除确认"
      content="确定要删除这个书签吗？"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { NButton, NThing, type DataTableColumns } from 'naive-ui'
import { Icon } from '@iconify/vue'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import { useBreakpoint } from '@/composables/useBreakpoint'
import AddBookmarkDialog from '../AddBookmarkDialog.vue'
import DeleteConfirm from '../common/DeleteConfirm.vue'
import type { Bookmark, ExtendedBookmark } from '@/types/bookmark'

const { isDesktop } = useBreakpoint()
const bookmarkStore = useBookmarkStore()
const { state } = storeToRefs(bookmarkStore)
const bookmarks = computed(() => state.value.bookmarks)

// 在 setup 中添加
const forceUpdate = ref(0)

// 处理数据，确保显示排序值和分类名称
const processedBookmarks = computed<ExtendedBookmark[]>(() => {
  // 添加 forceUpdate 作为依赖，但不使用它的值
  forceUpdate.value
  return [...bookmarks.value]
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(bookmark => ({
      ...bookmark,
      categoryName: bookmarkStore.getCategoryPath(bookmark.categoryId).join(' / '),
      sortOrder: bookmark.sort_order || 0
    }))
})

// 在组件挂载时获取数据
onMounted(() => {
  bookmarkStore.fetchAll()
})

const showAddDialog = ref(false)
const editingBookmark = ref<Bookmark | null>(null)

const bookmarkData = computed(() => {
  return processedBookmarks.value.map((bookmark) => {
    const categoryPath = bookmarkStore.getCategoryPath(bookmark.categoryId)
    return {
      ...bookmark,
      categoryName: categoryPath.join(' / ')
    }
  })
})

// PC端表格列配置
const columns: DataTableColumns<Bookmark> = [
  { title: '名称', key: 'name' },
  { title: '分类', key: 'categoryName' },
  { title: '内网地址', key: 'internalUrl', ellipsis: true },
  { title: '外网地址', key: 'externalUrl', ellipsis: true },
  { title: '备注', key: 'remark', ellipsis: true },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h('div', { style: 'display: flex; gap: 8px;' }, [
        h(
          NButton,
          {
            text: true,
            onClick: () => handleEdit(row)
          },
          { default: () => '编辑' }
        ),
        h(
          NButton,
          {
            text: true,
            type: 'error',
            onClick: () => handleRemove(row)
          },
          { default: () => '删除' }
        )
      ])
    }
  }
]

const deleteConfirmRef = ref<InstanceType<typeof DeleteConfirm> | null>(null)
const bookmarkToDelete = ref<Bookmark | null>(null)

const handleEdit = (bookmark: Bookmark) => {
  editingBookmark.value = bookmark
  showAddDialog.value = true
}

const handleRemove = (bookmark: Bookmark) => {
  bookmarkToDelete.value = bookmark
  deleteConfirmRef.value?.show()
}

const confirmDelete = async () => {
  if (bookmarkToDelete.value) {
    await bookmarkStore.removeBookmark(bookmarkToDelete.value.id)
    bookmarkToDelete.value = null
  }
}

const handleSuccess = () => {
  showAddDialog.value = false
  editingBookmark.value = null
}

// 添加拖拽相关的状态
const draggedItem = ref<ExtendedBookmark | null>(null)

// 添加拖拽处理函数
const handleDragStart = (e: DragEvent, bookmark: ExtendedBookmark) => {
  draggedItem.value = bookmark
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    const target = e.target as HTMLElement
    if (target) {
      target.classList.add('dragging')
    }
  }
}

const handleDragEnter = (e: DragEvent, target: ExtendedBookmark) => {
  const element = e.currentTarget as HTMLElement
  if (draggedItem.value && draggedItem.value.id !== target.id) {
    element.classList.add('drag-over')
  }
}

const handleDragLeave = (e: DragEvent) => {
  const element = e.currentTarget as HTMLElement
  element.classList.remove('drag-over')
}

const handleDrop = async (e: DragEvent, target: ExtendedBookmark) => {
  e.preventDefault()
  const dragged = draggedItem.value
  if (!dragged || dragged.id === target.id) return

  // 移除拖动效果类
  const rows = document.querySelectorAll('.draggable-row')
  rows.forEach(row => row.classList.remove('dragging'))

  try {
    // 获取当前排序值
    const draggedSort = dragged.sortOrder
    const targetSort = target.sortOrder

    // 先在本地更新状态
    const bookmarksArray = [...bookmarks.value]
    const draggedIndex = bookmarksArray.findIndex(b => b.id === dragged.id)
    const targetIndex = bookmarksArray.findIndex(b => b.id === target.id)

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // 更新本地状态中的排序值
      bookmarksArray[draggedIndex] = {
        ...bookmarksArray[draggedIndex],
        sort_order: targetSort
      }
      bookmarksArray[targetIndex] = {
        ...bookmarksArray[targetIndex],
        sort_order: draggedSort
      }

      // 更新 store 中的状态
      bookmarkStore.$patch((state) => {
        state.bookmarks = bookmarksArray
      })

      // 强制更新视图
      forceUpdate.value++
    }

    // 然后发送请求到服务器
    await Promise.all([
      bookmarkStore.updateBookmark(dragged.id, {
        ...dragged,
        sort_order: targetSort
      }),
      bookmarkStore.updateBookmark(target.id, {
        ...target,
        sort_order: draggedSort
      })
    ])

    // 重新获取所有数据以确保同步
    await Promise.all([
      bookmarkStore.fetchBookmarks(),
      bookmarkStore.fetchCategories()
    ])

  } catch (error) {
    console.error('Failed to update sort order:', error)
    // 如果更新失败，重新获取数据
    await bookmarkStore.fetchAll()
  } finally {
    // 清理拖拽状态
    draggedItem.value = null
  }
}
</script>

<style scoped>
.panel-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.panel-header {
  margin-bottom: 16px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--surface);
}

.header-content {
  padding: 0 50px;
  display: flex;
  justify-content: flex-start;
}

.table-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-radius: 8px;
  overflow: hidden;
  min-height: 0;
}

.table-header {
  flex-shrink: 0;
  background: var(--surface);
  border-bottom: 1px solid var(--divider-color);
  padding: 0 16px;
  padding-right: 24px;
}

.header-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

.table-body {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

.table-body-inner {
  height: 100%;
  overflow-y: auto;
  padding: 0 16px;
  padding-right: 24px;
  scrollbar-width: thin;
  scrollbar-color: var(--scroll-thumb) var(--scroll-track);
}

.table-body-inner::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-body-inner::-webkit-scrollbar-track {
  background: var(--scroll-track);
  border-radius: 4px;
}

.table-body-inner::-webkit-scrollbar-thumb {
  background-color: var(--scroll-thumb);
  border-radius: 4px;
  border: 2px solid var(--scroll-track);
  min-height: 40px;
}

.table-body-inner::-webkit-scrollbar-thumb:hover {
  background-color: var(--scroll-thumb-hover, var(--scroll-thumb));
}

.table-body-inner::-webkit-scrollbar-corner {
  background: transparent;
}

.data-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

.cell {
  height: 48px;
  padding: 0 8px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.cell :deep(.iconify) {
  font-size: 20px;
  vertical-align: middle;
}

/* 移动端列表样式 */
.mobile-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 8px;
}

.list-item {
  padding: 8px 12px;
  background: var(--surface);
  border-radius: 8px;
}

.item-actions {
  display: flex;
  gap: 4px;
}

.draggable-row {
  cursor: move;
  transition: transform 0.2s ease, background-color 0.2s ease;
  will-change: transform;
}

.draggable-row:hover {
  background-color: var(--hover-color);
}

.draggable-row.dragging {
  opacity: 0.5;
  background-color: var(--hover-color);
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.draggable-row.drag-over {
  position: relative;
}

.draggable-row.drag-over::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: -2px;
  height: 2px;
  background-color: var(--primary-color);
  animation: dropIndicator 0.5s ease infinite;
}

@keyframes dropIndicator {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

/* 添加表格行动画 */
.data-table tbody tr {
  transition: all 0.3s ease;
}
</style>
