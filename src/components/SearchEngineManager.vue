<template>
  <div class="search-engine-manager">
    <!-- 搜索引擎列表 -->
    <div class="engine-list" :class="{ 'dark-mode': isDarkMode }">
      <div
        v-for="engine in engines"
        :key="engine.id"
        class="engine-item"
        :class="{ active: currentEngine.id === engine.id }"
        @click="setCurrentEngine(engine)"
      >
        <div class="engine-icon">
          <Icon :icon="engine.icon" width="24" height="24" />
        </div>
        <span class="engine-name">{{ engine.name }}</span>
      </div>
    </div>

    <!-- 添加新搜索引擎按钮 -->
    <n-button
      class="add-engine-btn"
      type="primary"
      @click="showAddDialog = true"
    >
      <template #icon>
        <Icon icon="material-symbols:add" />
      </template>
      添加搜索引擎
    </n-button>

    <!-- 添加搜索引擎对话框 -->
    <n-modal v-model:show="showAddDialog" preset="dialog" title="添加搜索引擎">
      <n-form
        ref="formRef"
        :model="newEngine"
        :rules="rules"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="名称" path="name">
          <n-input v-model:value="newEngine.name" placeholder="输入搜索引擎名称" />
        </n-form-item>
        <n-form-item label="网址" path="url">
          <n-input v-model:value="newEngine.url" placeholder="输入搜索引擎主页地址" />
        </n-form-item>
        <n-form-item label="搜索URL" path="searchUrl">
          <n-input
            v-model:value="newEngine.searchUrl"
            placeholder="输入搜索URL，使用{keyword}作为搜索词占位符"
          />
        </n-form-item>
        <n-form-item label="图标" path="icon">
          <n-input v-model:value="newEngine.icon" placeholder="输入Iconify图标名称" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showAddDialog = false">取消</n-button>
        <n-button type="primary" @click="handleAddEngine">确定</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Icon } from '@iconify/vue'
import { useSearchStore } from '@/stores/searchStore'
import type { SearchEngine } from '@/types/search'
import { NButton, NModal, NForm, NFormItem, NInput } from 'naive-ui'

const searchStore = useSearchStore()
const { engines, currentEngine, isDarkMode } = storeToRefs(searchStore)
const { setCurrentEngine, addEngine } = searchStore

const showAddDialog = ref(false)
const formRef = ref<typeof NForm | null>(null)

const newEngine = ref<Partial<SearchEngine>>({
  name: '',
  url: '',
  searchUrl: '',
  icon: ''
})

const rules = {
  name: {
    required: true,
    message: '请输入搜索引擎名称',
    trigger: 'blur'
  },
  url: {
    required: true,
    message: '请输入搜索引擎网址',
    trigger: 'blur'
  },
  searchUrl: {
    required: true,
    message: '请输入搜索URL',
    trigger: 'blur'
  },
  icon: {
    required: true,
    message: '请输入图标名称',
    trigger: 'blur'
  }
}

const handleAddEngine = () => {
  formRef.value?.validate((errors) => {
    if (!errors) {
      const engine: SearchEngine = {
        id: Date.now().toString(),
        name: newEngine.value.name!,
        url: newEngine.value.url!,
        searchUrl: newEngine.value.searchUrl!,
        icon: newEngine.value.icon!
      }
      addEngine(engine)
      showAddDialog.value = false
      newEngine.value = {
        name: '',
        url: '',
        searchUrl: '',
        icon: ''
      }
    }
  })
}
</script>

<style scoped lang="scss">
.search-engine-manager {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;

  .engine-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 20px;

    .engine-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: var(--bg-secondary);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &.active {
        background: var(--primary-color);
        color: white;
      }

      .engine-icon {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .engine-name {
        font-size: 14px;
        font-weight: 500;
      }
    }
  }

  .add-engine-btn {
    width: 100%;
    height: 48px;
    border-radius: 12px;
    font-size: 16px;
  }
}

.dark-mode {
  .engine-item {
    background: var(--bg-secondary);
    
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }
}
</style> 