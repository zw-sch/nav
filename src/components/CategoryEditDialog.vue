<template>
  <n-modal
    :show="modelValue"
    @update:show="$emit('update:modelValue', $event)"
    :title="editing ? '编辑分类' : '添加分类'"
    preset="dialog"
    :show-icon="false"
  >
    <n-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
      size="medium"
    >
      <n-form-item label="分类名称" path="name">
        <n-input v-model:value="form.name" placeholder="请输入分类名称" />
      </n-form-item>
      <n-form-item label="图标" path="icon">
        <n-input-group>
          <n-input v-model:value="form.icon" placeholder="请输入图标名称">
            <template #prefix>
              <Icon v-if="form.icon" :icon="form.icon" />
            </template>
          </n-input>
          <n-button @click="handleIconSelect">
            <template #icon>
              <Icon icon="material-symbols:search" />
            </template>
          </n-button>
        </n-input-group>
        <template #feedback>
          <n-button
            text
            type="primary"
            tag="a"
            href="https://icon-sets.iconify.design"
            target="_blank"
          >
            浏览图标库
          </n-button>
        </template>
      </n-form-item>
    </n-form>

    <template #action>
      <n-space justify="end">
        <n-button @click="handleCancel">取消</n-button>
        <n-button type="primary" :loading="loading" @click="handleSubmit">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NSpace,
  NInputGroup,
  useMessage,
  type FormRules,
  type FormInst
} from 'naive-ui'
import { Icon } from '@iconify/vue'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import type { Category } from '@/types/bookmark'

const props = defineProps<{
  modelValue: boolean
  editing: Category | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const message = useMessage()
const bookmarkStore = useBookmarkStore()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)

const form = ref({
  name: '',
  icon: ''
})

const rules: FormRules = {
  name: [
    {
      required: true,
      message: '请输入分类名称'
    }
  ]
}

// 监听编辑状态
watch(
  () => props.editing,
  (category) => {
    if (category) {
      form.value = {
        name: category.name,
        icon: category.icon || ''
      }
    } else {
      form.value = {
        name: '',
        icon: ''
      }
    }
  },
  { immediate: true }
)

const handleIconSelect = () => {
  // TODO: 实现图标选择功能
  window.open('https://icon-sets.iconify.design', '_blank')
}

const handleSubmit = () => {
  formRef.value?.validate(async (errors) => {
    if (errors) return

    loading.value = true
    try {
      if (props.editing) {
        await bookmarkStore.updateCategory({
          ...props.editing,
          ...form.value
        })
        message.success('更新成功')
      } else {
        await bookmarkStore.addCategory(form.value)
        message.success('添加成功')
      }
      emit('success')
      emit('update:modelValue', false)
    } catch (error) {
      console.error('Failed to save category:', error)
      message.error('保存失败')
    } finally {
      loading.value = false
    }
  })
}

const handleCancel = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped>
:deep(.n-input-group) {
  display: flex;
}

:deep(.n-input-group .n-input) {
  flex: 1;
}
</style>
