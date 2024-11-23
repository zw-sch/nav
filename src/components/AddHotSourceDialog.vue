<template>
  <n-modal
    :show="show"
    @update:show="emit('update:show', $event)"
    preset="dialog"
    :title="editing ? '编辑热搜源' : '添加热搜源'"
  >
    <n-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
    >
      <n-form-item label="名称" path="name">
        <n-input v-model:value="form.name" placeholder="输入热搜源名称" />
      </n-form-item>
      <n-form-item label="类型" path="type">
        <n-select v-model:value="form.type" :options="typeOptions" @update:value="handleTypeChange" />
      </n-form-item>
      <n-form-item label="API地址" path="url" v-if="form.type !== 'sangbeicloud'">
        <n-input v-model:value="form.url" placeholder="输入热搜API地址" />
      </n-form-item>
      <n-form-item label="图标" path="icon">
        <n-input v-model:value="form.icon" placeholder="输入Iconify图标名称" />
      </n-form-item>
      <n-form-item label="启用预览">
        <n-switch v-model:value="form.enablePreview">
          <template #checked>开启</template>
          <template #unchecked>关闭</template>
        </n-switch>
      </n-form-item>
      <n-form-item label="排序" path="sort_order">
        <n-input-number v-model:value="form.sort_order" placeholder="请输入排序值" />
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="emit('update:show', false)">取消</n-button>
      <n-button type="primary" :loading="loading" @click="handleSubmit">
        确定
      </n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NModal, NForm, NFormItem, NInput, NButton, NSelect, NSwitch, useMessage } from 'naive-ui'
import { useHotStore } from '@/stores/hotStore'
import type { HotSource } from '@/types/hot'

const props = defineProps<{
  show: boolean
  editing: HotSource | null
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'success'): void
}>()

const hotStore = useHotStore()
const message = useMessage()
const loading = ref(false)
const formRef = ref<typeof NForm | null>(null)

const form = ref<Partial<HotSource>>({
  name: '',
  url: '',
  icon: '',
  type: 'sangbeicloud',
  enablePreview: false,
  sort_order: 0
})

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

// 当编辑对象变化时，更新表单
watch(() => props.editing, (newValue) => {
  if (newValue) {
    form.value = {
      name: newValue.name,
      url: newValue.url,
      icon: newValue.icon,
      type: newValue.type,
      enablePreview: newValue.enablePreview,
      sort_order: newValue.sort_order || 0
    }
  } else {
    form.value = {
      name: '',
      url: '',
      icon: '',
      type: 'sangbeicloud',
      enablePreview: false,
      sort_order: 0
    }
  }
}, { immediate: true })

// 根据类型自动设置 URL
const handleTypeChange = (value: string) => {
  if (value === 'sangbeicloud') {
    form.value.url = `https://api.lolimi.cn/API/jhrb/?hot=${form.value.name || ''}`
  } else {
    form.value.url = ''
  }
}

// 监听名称变化，自动更新桑帛云 API 的 URL
watch(() => form.value.name, (newName) => {
  if (form.value.type === 'sangbeicloud') {
    form.value.url = `https://api.lolimi.cn/API/jhrb/?hot=${newName || ''}`
  }
})

const rules = {
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

const handleSubmit = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      loading.value = true
      try {
        if (props.editing) {
          await hotStore.updateSource(props.editing.id, form.value)
          message.success('更新成功')
        } else {
          await hotStore.addSource(form.value as Omit<HotSource, 'id'>)
          message.success('添加成功')
        }

        emit('success')
        emit('update:show', false)
      } catch (error) {
        console.error('Failed to save hot source:', error)
        message.error('保存失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>
