<template>
  <n-modal v-model:show="show" preset="dialog" title="管理搜索和热搜源">
    <div class="manage-sources">
      <h3>搜索引擎</h3>
      <div v-for="engine in engines" :key="engine.id" class="source-item">
        <span>{{ engine.name }}</span>
        <n-button text @click="editEngine(engine)">编辑</n-button>
        <n-button text type="error" @click="removeEngine(engine.id)">删除</n-button>
      </div>
      <h3>热搜源</h3>
      <div v-for="source in hotSources" :key="source.id" class="source-item">
        <span>{{ source.name }}</span>
        <n-button text @click="editHotSource(source)">编辑</n-button>
        <n-button text type="error" @click="removeHotSource(source.id)">删除</n-button>
      </div>
    </div>

    <!-- 编辑搜索引擎对话框 -->
    <n-modal v-model:show="showEditEngineDialog" preset="dialog" title="编辑搜索引擎">
      <n-form
        ref="editEngineFormRef"
        :model="editEngineForm"
        :rules="engineRules"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="名称" path="name">
          <n-input v-model:value="editEngineForm.name" placeholder="输入搜索引擎名称" />
        </n-form-item>
        <n-form-item label="网址" path="url">
          <n-input v-model:value="editEngineForm.url" placeholder="输入搜索引擎主页地址" />
        </n-form-item>
        <n-form-item label="搜索URL" path="searchUrl">
          <n-input
            v-model:value="editEngineForm.searchUrl"
            placeholder="输入搜索URL，使用{keyword}作为搜索词占位符"
          />
        </n-form-item>
        <n-form-item label="图标" path="icon">
          <n-input v-model:value="editEngineForm.icon" placeholder="输入Iconify图标名称" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showEditEngineDialog = false">取消</n-button>
        <n-button type="primary" @click="handleEditEngine">保存</n-button>
      </template>
    </n-modal>

    <!-- 编辑热搜源对话框 -->
    <n-modal v-model:show="showEditHotSourceDialog" preset="dialog" title="编辑热搜源">
      <n-form
        ref="editHotSourceFormRef"
        :model="editHotSourceForm"
        :rules="hotSourceRules"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="名称" path="name">
          <n-input v-model:value="editHotSourceForm.name" placeholder="输入热搜源名称" />
        </n-form-item>
        <n-form-item label="类型" path="type">
          <n-select v-model:value="editHotSourceForm.type" :options="typeOptions" @update:value="handleTypeChange" />
        </n-form-item>
        <n-form-item label="API地址" path="url" v-if="editHotSourceForm.type !== 'sangbeicloud'">
          <n-input v-model:value="editHotSourceForm.url" placeholder="输入热搜API地址" />
        </n-form-item>
        <n-form-item label="图标" path="icon">
          <n-input v-model:value="editHotSourceForm.icon" placeholder="输入Iconify图标名称" />
        </n-form-item>
        <n-form-item label="启用预览">
          <n-switch v-model:value="editHotSourceForm.enablePreview">
            <template #checked>开启</template>
            <template #unchecked>关闭</template>
          </n-switch>
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showEditHotSourceDialog = false">取消</n-button>
        <n-button type="primary" @click="handleEditHotSource">保存</n-button>
      </template>
    </n-modal>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { NModal, NButton, NForm, NFormItem, NInput, NSelect, NSwitch } from 'naive-ui'
import { useSearchStore } from '@/stores/searchStore'
import { useHotStore } from '@/stores/hotStore'
import type { SearchEngine } from '@/types/search'
import type { HotSource } from '@/types/hot'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const searchStore = useSearchStore()
const hotStore = useHotStore()
const { engines } = storeToRefs(searchStore)
const { sources: hotSources } = storeToRefs(hotStore)

const show = computed({
  get() {
    return props.show
  },
  set(value) {
    emit('update:show', value)
  }
})

// 编辑搜索引擎
const showEditEngineDialog = ref(false)
const editEngineFormRef = ref<typeof NForm | null>(null)
const editEngineForm = ref<Partial<SearchEngine>>({
  name: '',
  url: '',
  searchUrl: '',
  icon: ''
})

const engineRules = {
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

const editEngine = (engine: SearchEngine) => {
  editEngineForm.value = { ...engine }
  showEditEngineDialog.value = true
}

const handleEditEngine = () => {
  editEngineFormRef.value?.validate((errors) => {
    if (!errors) {
      const index = engines.value.findIndex(e => e.id === editEngineForm.value.id)
      if (index !== -1) {
        engines.value[index] = { ...editEngineForm.value } as SearchEngine
        showEditEngineDialog.value = false
      }
    }
  })
}

// 编辑热搜源
const showEditHotSourceDialog = ref(false)
const editHotSourceFormRef = ref<typeof NForm | null>(null)
const editHotSourceForm = ref<Partial<HotSource>>({
  name: '',
  url: '',
  icon: '',
  type: 'weibo',
  enablePreview: false
})

const hotSourceRules = {
  name: {
    required: true,
    message: '请输入热搜源名称',
    trigger: 'blur'
  },
  url: {
    required: true,
    message: '请输入API地址',
    trigger: 'blur'
  },
  icon: {
    required: true,
    message: '请输入图标名称',
    trigger: 'blur'
  },
  type: {
    required: true,
    message: '请选择类型',
    trigger: 'blur'
  }
}

const typeOptions = [
  {
    label: '桑帛云 API',
    value: 'sangbeicloud'
  },
  {
    label: '自定义',
    value: 'custom'
  }
]

// 根据类型自动设置 URL
const handleTypeChange = (value: string) => {
  if (value === 'sangbeicloud') {
    editHotSourceForm.value.url = `https://api.lolimi.cn/API/jhrb/?hot=${editHotSourceForm.value.name || ''}`
  } else {
    editHotSourceForm.value.url = ''
  }
}

// 监听名称变化，自动更新桑帛云 API 的 URL
watch(() => editHotSourceForm.value.name, (newName) => {
  if (editHotSourceForm.value.type === 'sangbeicloud') {
    editHotSourceForm.value.url = `https://api.lolimi.cn/API/jhrb/?hot=${newName || ''}`
  }
})

const editHotSource = (source: HotSource) => {
  editHotSourceForm.value = { ...source }
  showEditHotSourceDialog.value = true
}

const handleEditHotSource = () => {
  editHotSourceFormRef.value?.validate((errors) => {
    if (!errors) {
      const index = hotSources.value.findIndex(s => s.id === editHotSourceForm.value.id)
      if (index !== -1) {
        hotSources.value[index] = { ...editHotSourceForm.value } as HotSource
        showEditHotSourceDialog.value = false
      }
    }
  })
}

const removeEngine = (id: string) => {
  searchStore.removeEngine(id)
}

const removeHotSource = (id: string) => {
  hotStore.removeSource(id)
}
</script>

<style scoped>
.manage-sources {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .source-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--border-color);
  }
}
</style> 