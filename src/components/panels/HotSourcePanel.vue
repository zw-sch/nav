<template>
  <div class="panel-container">
    <div class="panel-header">
      <div class="header-content">
        <n-button type="primary" @click="showAddDialog = true">
          <template #icon>
            <Icon icon="material-symbols:add" />
          </template>
          添加热搜源
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
            <col style="width: 15%" />
            <col style="width: 10%" />
            <col style="width: 10%" />
            <col style="width: 15%" />
          </colgroup>
          <thead>
            <tr>
              <th class="cell">图标</th>
              <th class="cell">名称</th>
              <th class="cell">类型</th>
              <th class="cell">预览</th>
              <th class="cell">排序</th>
              <th class="cell">操作</th>
            </tr>
          </thead>
        </table>
      </div>

      <!-- 可滚动的数据区域 -->
      <div class="table-body">
        <div class="table-body-inner">
          <table class="data-table">
            <colgroup>
              <col style="width: 10%" />
              <col style="width: 20%" />
              <col style="width: 15%" />
              <col style="width: 10%" />
              <col style="width: 10%" />
              <col style="width: 15%" />
            </colgroup>
            <tbody>
              <tr
                v-for="source in processedSources"
                :key="source.id"
                draggable="true"
                @dragstart="handleDragStart($event, source)"
                @dragenter="handleDragEnter($event, source)"
                @dragleave="handleDragLeave"
                @dragover.prevent
                @drop="handleDrop($event, source)"
                class="draggable-row"
              >
                <td class="cell">
                  <Icon :icon="source.icon || 'material-symbols:trending-up'" />
                </td>
                <td class="cell">{{ source.name }}</td>
                <td class="cell">{{ source.type }}</td>
                <td class="cell">
                  <n-switch
                    size="small"
                    :value="source.enablePreview"
                    @update:value="(value) => handlePreviewChange(source, value)"
                  />
                </td>
                <td class="cell">{{ source.sortOrder }}</td>
                <td class="cell">
                  <div class="action-buttons">
                    <n-button text size="small" @click="handleEdit(source)">编辑</n-button>
                    <n-button text size="small" type="error" @click="handleRemove(source)">删除</n-button>
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
        v-for="source in hotSources"
        :key="source.id"
        :title="source.name"
        class="list-item"
      >
        <template #header-extra>
          <div class="item-actions">
            <n-button text @click="handleEdit(source)">
              <template #icon>
                <Icon icon="material-symbols:edit-outline" />
              </template>
            </n-button>
            <n-button text type="error" @click="handleRemove(source)">
              <template #icon>
                <Icon icon="material-symbols:delete-outline" />
              </template>
            </n-button>
          </div>
        </template>
      </n-thing>
    </div>

    <AddHotSourceDialog
      v-model:show="showAddDialog"
      :editing="editingSource"
      @success="handleSuccess"
    />

    <DeleteConfirm
      ref="deleteConfirmRef"
      title="删除确认"
      content="确定要删除这个热搜源吗？"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { NButton, NThing, NSwitch, type DataTableColumns } from 'naive-ui'
import { Icon } from '@iconify/vue'
import { useHotStore } from '@/stores/hotStore'
import { useBreakpoint } from '@/composables/useBreakpoint'
import AddHotSourceDialog from '../AddHotSourceDialog.vue'
import DeleteConfirm from '../common/DeleteConfirm.vue'
import type { HotSource } from '@/types/hot'

interface ExtendedHotSource extends Omit<HotSource, 'sort_order'> {
  type: string;
  sortOrder: number;
  sort_order?: number;
}

const { isDesktop } = useBreakpoint()
const hotStore = useHotStore()
const { sources: hotSources } = storeToRefs(hotStore)

// 处理数据，确保显示排序值
const processedSources = computed(() => {
  return hotSources.value.map(source => ({
    ...source,
    type: source.type || '-',
    sortOrder: source.sort_order || 0
  })) as ExtendedHotSource[]
})

// 在组件挂载时获取数据
onMounted(() => {
  hotStore.fetchSources()
})

const showAddDialog = ref(false)
const editingSource = ref<ExtendedHotSource | null>(null)
const deleteConfirmRef = ref<InstanceType<typeof DeleteConfirm> | null>(null)
const sourceToDelete = ref<ExtendedHotSource | null>(null)

// PC端表格列配置
const columns: DataTableColumns<ExtendedHotSource> = [
  { title: '名称', key: 'name' },
  { title: '类型', key: 'type' },
  { title: 'API地址', key: 'url' },
  {
    title: '预览',
    key: 'enablePreview',
    render(row) {
      return row.enablePreview ? '开启' : '关闭'
    }
  },
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

const handleEdit = (source: ExtendedHotSource) => {
  editingSource.value = source
  showAddDialog.value = true
}

const handleRemove = (source: ExtendedHotSource) => {
  sourceToDelete.value = source
  deleteConfirmRef.value?.show()
}

const confirmDelete = async () => {
  if (sourceToDelete.value) {
    await hotStore.removeSource(Number(sourceToDelete.value.id))
    sourceToDelete.value = null
  }
}

const handleSuccess = () => {
  showAddDialog.value = false
  editingSource.value = null
}

// 修改预览开关处理函数
const handlePreviewChange = async (source: HotSource, value: boolean) => {
  try {
    await hotStore.updateSource(source.id, {
      name: source.name,
      url: source.url,
      icon: source.icon,
      type: source.type,
      sort_order: source.sort_order,
      enablePreview: value
    })
  } catch (error) {
    console.error('Failed to update preview status:', error)
  }
}

// 添加拖拽相关的状态和处理函数
const draggedItem = ref<ExtendedHotSource | null>(null)

const handleDragStart = (e: DragEvent, source: ExtendedHotSource) => {
  draggedItem.value = source
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    // 添加一个自定义的拖动效果类
    const target = e.target as HTMLElement
    if (target) {
      target.classList.add('dragging')
    }
  }
}

// 修改拖拽排序处理函数
const handleDrop = async (e: DragEvent, target: ExtendedHotSource) => {
  e.preventDefault()
  const dragged = draggedItem.value
  if (!dragged || dragged.id === target.id) return

  // 移除拖动效果类
  const rows = document.querySelectorAll('.draggable-row')
  rows.forEach(row => row.classList.remove('dragging'))

  try {
    // 更新排序
    await hotStore.updateSource(dragged.id, {
      ...dragged,                   // 保留原有的所有字段
      sort_order: target.sortOrder,
      name: dragged.name,           // 确保包含必要字段
      url: dragged.url,
      icon: dragged.icon
    })
    await hotStore.updateSource(target.id, {
      ...target,                    // 保留原有的所有字段
      sort_order: dragged.sortOrder,
      name: target.name,            // 确保包含必要字段
      url: target.url,
      icon: target.icon
    })

    // 重新获取数据
    await hotStore.fetchSources()
  } catch (error) {
    console.error('Failed to update sort order:', error)
  }
}

const handleDragEnter = (e: DragEvent, target: ExtendedHotSource) => {
  const element = e.currentTarget as HTMLElement
  if (draggedItem.value && draggedItem.value.id !== target.id) {
    element.classList.add('drag-over')
  }
}

const handleDragLeave = (e: DragEvent) => {
  const element = e.currentTarget as HTMLElement
  element.classList.remove('drag-over')
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
  padding: 0 50px; /* 与表格内容保持相同的左边距 */
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
  line-height: 48px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  height: 100%;
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

.header-table th.cell,
.data-table td.cell {
  height: 48px;
  padding: 0 8px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  line-height: 48px;
}

.header-table th.cell {
  font-weight: 500;
  color: var(--text-color-1);
}

.data-table td.cell {
  border-bottom: 1px solid var(--divider-color);
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.cell :deep(.iconify) {
  font-size: 20px;
  vertical-align: middle;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* 确保表格布局正确 */
.header-table,
.data-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

/* 确保列宽一致 */
.header-table colgroup,
.data-table colgroup {
  display: table-column-group;
}

/* 确保表格行高一致 */
.header-table tr,
.data-table tr {
  height: 48px;
}

/* 开关样式调整 */
:deep(.n-switch) {
  vertical-align: middle;
}

/* 确保开在单元格中居中 */
.cell .n-switch {
  margin: 0 auto;
}

/* 拖动相关样式 */
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
