<template>
  <n-modal
    :show="show"
    @update:show="emit('update:show', $event)"
    preset="dialog"
    :title="editing ? '编辑书签' : '添加书签'"
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
        <n-input v-model:value="form.name" placeholder="输入书签名称" />
      </n-form-item>
      <n-form-item label="分类" path="categoryId">
        <n-select
          v-model:value="form.categoryId"
          :options="categoryOptions"
          placeholder="选择分类"
          :render-label="renderCategoryLabel"
          @update:value="handleCategorySelect"
        />
      </n-form-item>
      <n-form-item label="内网地址" path="internalUrl">
        <n-input v-model:value="form.internalUrl" placeholder="输入内网访问地址" />
      </n-form-item>
      <n-form-item label="外网地址" path="externalUrl">
        <n-input v-model:value="form.externalUrl" placeholder="输入外网访问地址" />
      </n-form-item>
      <n-form-item label="图标" path="icon">
        <n-input v-model:value="form.icon" placeholder="输入Iconify图标名称" />
      </n-form-item>
      <n-form-item label="备注" path="remark">
        <n-input v-model:value="form.remark" type="textarea" placeholder="输入备注信息" />
      </n-form-item>
      <n-form-item label="排序" path="sort_order">
        <n-input-number v-model:value="form.sort_order" placeholder="请输入排序值" />
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="emit('update:show', false)">取消</n-button>
      <n-button type="primary" :loading="loading" @click="handleSubmit"> 确定 </n-button>
    </template>
  </n-modal>

  <!-- 快速添加分类的弹出框 -->
  <n-modal
    v-model:show="showQuickAddCategory"
    title="添加分类"
    preset="dialog"
    :style="{ width: '400px' }"
  >
    <n-form
      ref="categoryFormRef"
      :model="categoryForm"
      :rules="categoryRules"
      label-placement="left"
      label-width="80"
    >
      <n-form-item label="名称" path="name">
        <n-input v-model:value="categoryForm.name" placeholder="输入分类名称" />
      </n-form-item>
      <n-form-item label="图标" path="icon">
        <n-input v-model:value="categoryForm.icon" placeholder="输入图标名称（可选）" />
      </n-form-item>
    </n-form>
    <template #action>
      <n-space justify="end">
        <n-button @click="showQuickAddCategory = false">取消</n-button>
        <n-button type="primary" @click="handleQuickAddCategory">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { NModal, NForm, NFormItem, NInput, NButton, NSelect, useMessage } from 'naive-ui'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import type { Bookmark } from '@/types/bookmark'

const props = defineProps<{
  show: boolean
  editing: Bookmark | null
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'success'): void
}>()

const bookmarkStore = useBookmarkStore()
const message = useMessage()
const loading = ref(false)
const formRef = ref<typeof NForm | null>(null)

const form = ref<Partial<Bookmark>>({
  name: '',
  categoryId: undefined,
  icon: '',
  remark: '',
  internalUrl: '',
  externalUrl: '',
  sort_order: 0
})

// 分类选项
const categoryOptions = computed(() => {
  return [
    ...bookmarkStore.state.categories.map((category) => ({
      label: category.name,
      value: category.id,
      path: bookmarkStore.getCategoryPath(category.id) || [category.name],
    })),
    {
      label: '+ 添加新分类',
      value: 'add_new',
      style: {
        borderTop: '1px solid var(--divider-color)',
        cursor: 'pointer',
        color: 'var(--primary-color)',
      },
    },
  ]
})

// 当编辑对象变化时，更新表单
watch(
  () => props.editing,
  (newValue) => {
    if (newValue) {
      form.value = {
        ...newValue,
        sort_order: newValue.sort_order || 0
      }
    } else {
      form.value = {
        name: '',
        categoryId: undefined,
        icon: '',
        remark: '',
        internalUrl: '',
        externalUrl: '',
        sort_order: 0
      }
    }
  },
  { immediate: true },
)

const rules = {
  name: {
    required: true,
    message: '请输入书签名称',
    trigger: 'blur',
  },
  categoryId: {
    required: true,
    message: '请选择分类',
    trigger: ['blur', 'change'],
    type: 'number',
  },
}

const handleSubmit = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      loading.value = true
      try {
        if (props.editing) {
          await bookmarkStore.updateBookmark(props.editing.id, form.value)
          message.success('更新成功')
        } else {
          await bookmarkStore.addBookmark({
            ...form.value,
            categoryId: form.value.categoryId!,
          })
          message.success('添加成功')
        }

        emit('success')
        emit('update:show', false)
      } catch (error) {
        console.error('Failed to save bookmark:', error)
        message.error('保存失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// 自定义分类标签渲染
const renderCategoryLabel = (option: { label: string; path?: string[] }) => {
  return option.path ? option.path.join(' / ') : option.label
}

// 处理分类选择
const handleCategorySelect = (value: number | string) => {
  if (value === 'add_new') {
    showQuickAddCategory.value = true
    // 恢复之前选中的值
    form.value.categoryId = previousCategoryId.value
  } else {
    previousCategoryId.value = value as number
    form.value.categoryId = value as number
  }
}

// 保存上一次选择的分类ID
const previousCategoryId = ref<number>()

// 快速添加分类的弹出框
const showQuickAddCategory = ref(false)
const categoryFormRef = ref<typeof NForm | null>(null)
const categoryForm = ref({
  name: '',
  icon: '',
})

const categoryRules = {
  name: {
    required: true,
    message: '请输入分类名称',
    trigger: 'blur',
  },
}

// 处理快速添加分类
const handleQuickAddCategory = async () => {
  try {
    await categoryFormRef.value?.validate()
    const newCategory = await bookmarkStore.addCategory({
      name: categoryForm.value.name,
      icon: categoryForm.value.icon || undefined,
    })

    // 添加成功后，自动选择新分类
    form.value.categoryId = newCategory.id

    // 关闭弹窗并重置表单
    showQuickAddCategory.value = false
    categoryForm.value = {
      name: '',
      icon: '',
    }

    message.success('添加分类成功')
  } catch (error) {
    console.error('Failed to add category:', error)
    message.error('添加分类失败')
  }
}
</script>

<style scoped>
:deep(.n-select-menu .n-base-select-option) {
  padding: 4px 12px;
}

:deep(.n-select-menu .n-base-select-option:last-child) {
  margin-top: 4px;
}
</style>
