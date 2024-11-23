<template>
  <div class="panel-container">
    <div class="panel-header">
      <div class="header-content">
        <n-button type="primary" @click="showAddDialog = true">
          <template #icon>
            <Icon icon="material-symbols:add" />
          </template>
          添加搜索引擎
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
            <col style="width: 10%" />
            <col style="width: 10%" />
            <col style="width: 15%" />
          </colgroup>
          <thead>
            <tr>
              <th class="cell">图标</th>
              <th class="cell">名称</th>
              <th class="cell">快速命令</th>
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
              <col style="width: 10%" />
              <col style="width: 10%" />
              <col style="width: 15%" />
            </colgroup>
            <tbody>
              <tr v-for="engine in engines" :key="engine.id">
                <td class="cell">
                  <Icon :icon="engine.icon || 'material-symbols:search'" />
                </td>
                <td class="cell">{{ engine.name }}</td>
                <td class="cell">{{ engine.quickCommand }}</td>
                <td class="cell">{{ engine.sortOrder }}</td>
                <td class="cell">
                  <div class="action-buttons">
                    <n-button text size="small" @click="handleEdit(engine)">编辑</n-button>
                    <n-button text size="small" type="error" @click="handleRemove(engine)">删除</n-button>
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
        v-for="engine in engines"
        :key="engine.id"
        :title="engine.name"
        class="list-item"
      >
        <template #header-extra>
          <div class="item-actions">
            <n-button text @click="handleEdit(engine)">
              <template #icon>
                <Icon icon="material-symbols:edit-outline" />
              </template>
            </n-button>
            <n-button text type="error" @click="handleRemove(engine)">
              <template #icon>
                <Icon icon="material-symbols:delete-outline" />
              </template>
            </n-button>
          </div>
        </template>
      </n-thing>
    </div>

    <AddEngineDialog
      v-model:show="showAddDialog"
      :editing="editingEngine"
      @success="handleSuccess"
    />

    <DeleteConfirm
      ref="deleteConfirmRef"
      title="删除确认"
      content="确定要删除这个搜索引擎吗？"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted, computed, nextTick, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { NButton, NThing, type DataTableColumns, NScrollbar } from 'naive-ui'
import { Icon } from '@iconify/vue'
import { useSearchStore } from '@/stores/searchStore'
import { useBreakpoint } from '@/composables/useBreakpoint'
import AddEngineDialog from '../AddEngineDialog.vue'
import DeleteConfirm from '../common/DeleteConfirm.vue'
import type { SearchEngine } from '@/types/search'

const { isDesktop } = useBreakpoint()
const searchStore = useSearchStore()
const { engines } = storeToRefs(searchStore)

const showAddDialog = ref(false)
const editingEngine = ref<SearchEngine | null>(null)
const deleteConfirmRef = ref<InstanceType<typeof DeleteConfirm> | null>(null)
const engineToDelete = ref<SearchEngine | null>(null)
const tableMaxHeight = ref(500)
const tableBodyRef = ref<HTMLElement | null>(null)
const scrollProgress = ref(0)
const isScrollable = ref(false)
const thumbHeight = ref(20)
const scrollTop = ref(0)

// 计算表格最大高度
onMounted(() => {
  const headerHeight = 64 // 头部高度
  const padding = 32 // 上下padding
  const windowHeight = window.innerHeight
  tableMaxHeight.value = windowHeight - headerHeight - padding
})

// PC端表格列配置
const columns: DataTableColumns<SearchEngine> = [
  {
    title: '名称',
    key: 'name',
    width: 150,
    fixed: 'left'
  },
  {
    title: '网址',
    key: 'url',
    width: 200
  },
  {
    title: '搜索URL',
    key: 'searchUrl',
    width: 300
  },
  {
    title: '快速命令',
    key: 'quickCommand',
    width: 120
  },
  {
    title: '排序',
    key: 'sortOrder',
    width: 80
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    fixed: 'right',
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

const handleEdit = (engine: SearchEngine) => {
  editingEngine.value = engine
  showAddDialog.value = true
}

const handleRemove = (engine: SearchEngine) => {
  engineToDelete.value = engine
  deleteConfirmRef.value?.show()
}

const handleSuccess = () => {
  showAddDialog.value = false
  editingEngine.value = null
}

const confirmDelete = async () => {
  if (engineToDelete.value) {
    await searchStore.removeEngine(engineToDelete.value.id)
    engineToDelete.value = null
  }
}

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  if (!target) return

  const { scrollTop, scrollHeight, clientHeight } = target
  const percentage = (scrollTop / (scrollHeight - clientHeight)) * 100
  scrollTop.value = percentage
}

// 添加滚动事件监听
onMounted(() => {
  const tableBody = document.querySelector('.table-body')
  if (tableBody) {
    tableBody.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  const tableBody = document.querySelector('.table-body')
  if (tableBody) {
    tableBody.removeEventListener('scroll', handleScroll)
  }
})
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
  justify-content: flex-start; /* 改为左对齐 */
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
  padding-right: 24px; /* 为滚动条预留空间 */
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

/* Webkit 滚动条样式 */
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

/* 移除强制显示滚动条的样式 */
.table-body-inner {
  -ms-overflow-style: auto; /* IE/Edge */
  scrollbar-width: thin; /* Firefox */
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

/* 移动端列表样式 */
.mobile-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 8px;
  max-height: 450px;
}

.mobile-list::-webkit-scrollbar {
  width: 4px;
}

.mobile-list::-webkit-scrollbar-track {
  background: var(--scroll-track);
  border-radius: 2px;
}

.mobile-list::-webkit-scrollbar-thumb {
  background: var(--scroll-thumb);
  border-radius: 2px;
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

/* 图标列样式 */
.cell :deep(.iconify) {
  font-size: 20px;
  vertical-align: middle;
}

.table-container {
  flex: 1;
  background: var(--surface);
  border-radius: 8px;
  overflow: hidden;
}
</style>
