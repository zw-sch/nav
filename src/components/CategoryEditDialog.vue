<template>
  <n-modal
    :show="show"
    @update:show="emit('update:show', $event)"
    :title="editing ? '编辑分类' : '添加分类'"
    preset="dialog"
    :show-icon="false"
    @close="handleClose"
  >
    <n-form
      ref="formRef"
      :model="formValue"
      :rules="rules"
      label-placement="left"
      label-width="80"
      require-mark-placement="right-hanging"
    >
      <n-form-item label="名称" path="name">
        <n-input v-model:value="formValue.name" placeholder="请输入分类名称" />
      </n-form-item>
      <n-form-item label="图标" path="icon">
        <n-input-group>
          <n-input
            v-model:value="formValue.icon"
            placeholder="请输入图标名称"
            @keydown.enter.prevent="handleIconSearch"
          >
            <template #prefix>
              <Icon v-if="formValue.icon" :icon="formValue.icon" />
            </template>
          </n-input>
          <n-button type="primary" ghost @click="handleIconSearch">
            <template #icon>
              <Icon icon="material-symbols:search" />
            </template>
            查找
          </n-button>
        </n-input-group>
      </n-form-item>
      <n-form-item label="排序" path="sort_order">
        <n-input-number v-model:value="formValue.sort_order" placeholder="请输入排序值" />
      </n-form-item>
    </n-form>

    <template #action>
      <n-space>
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" :loading="loading" @click="handleSubmit">
          确定
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NModal, NForm, NFormItem, NInput, NSpace, NButton, NInputNumber, NInputGroup } from 'naive-ui'
import { Icon } from '@iconify/vue'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import type { Category } from '@/types/bookmark'

const props = defineProps<{
  show: boolean
  editing: Category | null
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'success': []
}>()

const bookmarkStore = useBookmarkStore()
const formRef = ref<typeof NForm | null>(null)
const loading = ref(false)

// 表单数据
const formValue = ref({
  name: '',
  icon: '',
  sort_order: 0
})

// 表单验证规则
const rules = {
  name: {
    required: true,
    message: '请输入分类名称',
    trigger: 'blur'
  }
}

// 监听编辑对象变化
watch(
  () => props.editing,
  (newVal) => {
    if (newVal) {
      formValue.value = {
        name: newVal.name,
        icon: newVal.icon || '',
        sort_order: newVal.sort_order || 0
      }
    } else {
      // 新增时，获取最大排序值并加1
      const maxSortOrder = Math.max(
        0,
        ...bookmarkStore.state.categories.map(c => c.sort_order || 0)
      )
      formValue.value = {
        name: '',
        icon: '',
        sort_order: maxSortOrder + 1
      }
    }
  },
  { immediate: true }
)

// 关闭对话框
const handleClose = () => {
  emit('update:show', false)
}

// 处理图标搜索
const handleIconSearch = () => {
  const searchTerm = formValue.value.icon
  if (searchTerm) {
    window.open(`https://icon-sets.iconify.design?query=${encodeURIComponent(searchTerm)}`, '_blank')
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    loading.value = true
    if (props.editing) {
      // 编辑模式
      await bookmarkStore.updateCategory({
        id: props.editing.id,
        name: formValue.value.name,
        icon: formValue.value.icon,
        sort_order: formValue.value.sort_order,
        user_id: props.editing.user_id
      })
    } else {
      // 新增模式
      await bookmarkStore.addCategory({
        name: formValue.value.name,
        icon: formValue.value.icon,
        sort_order: formValue.value.sort_order
      })
    }
    emit('success')
    handleClose()
  } catch (error) {
    console.error('Failed to save category:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:deep(.n-input-wrapper) {
  display: flex;
  align-items: center;
}

:deep(.n-input__prefix) {
  margin-right: 8px;
  display: flex;
  align-items: center;
}

:deep(.iconify) {
  font-size: 20px;
}

/* 调整输入组样式 */
:deep(.n-input-group) {
  display: flex;
  gap: 8px;
}

:deep(.n-input-group .n-input) {
  flex: 1;
}

:deep(.n-input-group .n-button) {
  margin-left: 8px;
}
</style>
