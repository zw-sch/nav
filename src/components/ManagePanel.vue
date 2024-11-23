<template>
  <n-drawer
    :show="show"
    @update:show="emit('update:show', $event)"
    :width="isDesktop ? 900 : '80%'"
    placement="right"
    :trap-focus="false"
  >
    <n-drawer-content title="管理面板">
      <!-- 移动端折叠菜单 -->
      <div v-if="!isDesktop" class="mobile-container">
        <n-collapse v-model:expanded-names="activeCollapse">
          <n-collapse-item v-for="panel in panels" :key="panel.name" :title="panel.title" :name="panel.name">
            <Suspense>
              <template #default>
                <component :is="panel.component" />
              </template>
              <template #fallback>
                <n-spin size="medium" />
              </template>
            </Suspense>
          </n-collapse-item>
        </n-collapse>
      </div>

      <!-- PC端标签页 -->
      <div v-else class="desktop-container">
        <n-tabs type="line" animated v-model:value="activeTab">
          <n-tab-pane v-for="panel in panels" :key="panel.name" :name="panel.name" :tab="panel.title">
            <Suspense>
              <template #default>
                <component :is="panel.component" />
              </template>
              <template #fallback>
                <n-spin size="medium" />
              </template>
            </Suspense>
          </n-tab-pane>
        </n-tabs>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, onErrorCaptured } from 'vue'
import { useBreakpoint } from '@/composables/useBreakpoint'
import {
  NDrawer,
  NDrawerContent,
  NTabs,
  NTabPane,
  NCollapse,
  NCollapseItem,
  NSpin,
  useMessage,
  NScrollbar
} from 'naive-ui'

const message = useMessage()

// 定义面板配置
const panels = [
  {
    name: 'engines',
    title: '搜索引擎',
    component: defineAsyncComponent({
      loader: () => import('./panels/EnginePanel.vue'),
      onError: (error) => {
        console.error('Failed to load EnginePanel:', error)
        message.error('加载搜索引擎管理面板失败')
      }
    })
  },
  {
    name: 'hotSources',
    title: '热搜源',
    component: defineAsyncComponent({
      loader: () => import('./panels/HotSourcePanel.vue'),
      onError: (error) => {
        console.error('Failed to load HotSourcePanel:', error)
        message.error('加载热搜源管理面板失败')
      }
    })
  },
  {
    name: 'bookmarks',
    title: '书签',
    component: defineAsyncComponent({
      loader: () => import('./panels/BookmarkPanel.vue'),
      onError: (error) => {
        console.error('Failed to load BookmarkPanel:', error)
        message.error('加载书签管理面板失败')
      }
    })
  },
  {
    name: 'categories',
    title: '分类管理',
    component: defineAsyncComponent({
      loader: () => import('./panels/CategoryPanel.vue'),
      onError: (error) => {
        console.error('Failed to load CategoryPanel:', error)
        message.error('加载分类管理面板失败')
      }
    })
  },
  {
    name: 'weather',
    title: '天气配置',
    component: defineAsyncComponent({
      loader: () => import('./panels/WeatherPanel.vue'),
      onError: (error) => {
        console.error('Failed to load WeatherPanel:', error)
        message.error('加载天气配置面板失败')
      }
    })
  },
  {
    name: 'display',
    title: '显示设置',
    component: defineAsyncComponent({
      loader: () => import('./panels/DisplayPanel.vue'),
      onError: (error) => {
        console.error('Failed to load DisplayPanel:', error)
        message.error('加载显示设置面板失败')
      }
    })
  },
  {
    name: 'system',
    title: '系统设置',
    component: defineAsyncComponent({
      loader: () => import('./panels/SystemPanel.vue'),
      onError: (error) => {
        console.error('Failed to load SystemPanel:', error)
        message.error('加载系统设置面板失败')
      }
    })
  }
]

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const { isDesktop } = useBreakpoint()
const activeTab = ref('engines')
const activeCollapse = ref<string[]>(['engines'])

// 全局错误处理
onErrorCaptured((error, instance, info) => {
  console.error('Error captured:', error, instance, info)
  message.error('操作出错，请重试')
  return false // 阻止错误继续传播
})
</script>

<style scoped>
.desktop-container {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

:deep(.n-drawer-content) {
  display: flex;
  flex-direction: column;
}

:deep(.n-drawer-content-content) {
  flex: 1;
  overflow: hidden;
}

:deep(.n-drawer-header) {
  flex-shrink: 0;
}

:deep(.n-tabs) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.n-tabs-nav) {
  flex-shrink: 0;
  background: var(--surface);
  padding: 0 16px;
}

:deep(.n-tabs-content) {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

:deep(.n-tab-pane) {
  height: 100%;
}
</style>
