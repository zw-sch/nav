<template>
  <n-modal
    :show="show"
    @update:show="emit('update:show', $event)"
    preset="dialog"
    :title="editing ? '编辑搜索引擎' : '添加搜索引擎'"
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
        <n-input v-model:value="form.name" placeholder="输入搜索引擎名称" />
      </n-form-item>
      <n-form-item label="网址" path="url">
        <n-input v-model:value="form.url" placeholder="输入搜索引擎网址" />
      </n-form-item>
      <n-form-item label="搜索URL" path="searchUrl">
        <n-input
          v-model:value="form.searchUrl"
          placeholder="输入搜索URL，使用{keyword}作为搜索词占位符"
        />
      </n-form-item>
      <n-form-item label="图标" path="icon">
        <n-input v-model:value="form.icon" placeholder="输入Iconify图标名称" />
      </n-form-item>
      <n-form-item label="快速命令" path="quickCommand">
        <n-input
          v-model:value="form.quickCommand"
          placeholder="输入快速命令，如: /g"
          :maxlength="10"
          @input="handleQuickCommandInput"
        />
      </n-form-item>
      <n-form-item label="排序" path="sortOrder">
        <n-input-number v-model:value="form.sortOrder" placeholder="输入排序值" />
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="emit('update:show', false)">取消</n-button>
      <n-button type="primary" :loading="loading" @click="handleSubmit">确定</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NModal, NForm, NFormItem, NInput, NButton, NInputNumber, useMessage } from 'naive-ui'
import { useSearchStore } from '@/stores/searchStore'
import type { SearchEngine } from '@/types/search'

const props = defineProps<{
  show: boolean
  editing: SearchEngine | null
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'success'): void
}>()

const searchStore = useSearchStore()
const message = useMessage()
const loading = ref(false)
const formRef = ref<typeof NForm | null>(null)

const form = ref({
  name: '',
  url: '',
  searchUrl: '',
  icon: '',
  quickCommand: '',
  sortOrder: 0,
})

// 当编辑对象变化时，更新表单
watch(
  () => props.editing,
  (newValue) => {
    if (newValue) {
      form.value = { ...newValue }
    } else {
      form.value = {
        name: '',
        url: '',
        searchUrl: '',
        icon: '',
        quickCommand: '',
        sortOrder: 0,
      }
    }
  },
  { immediate: true },
)

const rules = {
  name: {
    required: true,
    message: '请输入搜索引擎名称',
    trigger: 'blur',
  },
  searchUrl: {
    required: true,
    message: '请输入搜索URL',
    trigger: 'blur',
  },
  quickCommand: {
    validator: (rule: any, value: string) => {
      if (!value) return true // 允许为空
      if (!value.startsWith('/')) return new Error('快速命令必须以/开头')
      if (!/^\/[a-zA-Z0-9]+$/.test(value)) return new Error('快速命令只能包含字母和数字')
      if (value.length > 10) return new Error('快速命令不能超过10个字符')
      return true
    },
    trigger: ['input', 'blur'],
  },
}

const handleSubmit = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      loading.value = true
      try {
        if (props.editing) {
          const updatedEngine = await searchStore.updateSearchEngine(props.editing.id, form.value)
          if (updatedEngine) {
            message.success('更新成功')
            emit('success')
            emit('update:show', false)
          }
        } else {
          const newEngine = await searchStore.addNewEngine(form.value)
          if (newEngine) {
            message.success('添加成功')
            emit('success')
            emit('update:show', false)
          }
        }
      } catch (error: any) {
        message.error(error.message)
      } finally {
        loading.value = false
      }
    }
  })
}

// 添加快速命令输入处理
const handleQuickCommandInput = (value: string) => {
  // 如果为空，直接返回
  if (!value) {
    form.value.quickCommand = ''
    return
  }

  // 确保以 / 开头
  if (!value.startsWith('/')) {
    value = '/' + value
  }

  // 只允许字母、数字和/
  const sanitizedValue = value.replace(/[^a-zA-Z0-9/]/g, '')

  // 限制长度为10个字符
  form.value.quickCommand = sanitizedValue.slice(0, 10)
}
</script>
