<template>
  <n-modal
    :show="show"
    @update:show="emit('update:show', $event)"
    preset="card"
    style="width: 600px; max-width: 90%"
    title="分类管理"
  >
    <div class="panel-section">
      <div class="section-header">
        <h3>分类列表</h3>
        <n-button @click="handleAdd">
          <template #icon>
            <Icon icon="material-symbols:add" />
          </template>
          添加分类
        </n-button>
      </div>
      <n-data-table
        :columns="columns"
        :data="bookmarkStore.state.categories"
        :pagination="{ pageSize: 10 }"
      />
    </div>

    <!-- 添加/编辑分类表单对话框 -->
    <n-modal
      v-model:show="showForm"
      preset="dialog"
      :title="editing ? '编辑分类' : '添加分类'"
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
          <n-input v-model:value="form.name" placeholder="输入分类名称" />
        </n-form-item>
        <n-form-item label="图标" path="icon">
          <n-input v-model:value="form.icon" placeholder="输入Iconify图标名称（可选）" />
        </n-form-item>
        <n-form-item label="排序" path="sort_order">
          <n-input-number v-model:value="form.sort_order" placeholder="请输入排序值" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showForm = false">取消</n-button>
        <n-button type="primary" :loading="loading" @click="handleSubmit">
          确定
        </n-button>
      </template>
    </n-modal>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { Icon } from '@iconify/vue'
import { NModal, NForm, NFormItem, NInput, NButton, NDataTable, useMessage, useDialog } from 'naive-ui'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import type { Category } from '@/types/bookmark'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const bookmarkStore = useBookmarkStore()
const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const formRef = ref<typeof NForm | null>(null)
const showForm = ref(false)
const editing = ref<Category | null>(null)

const form = ref<Partial<Category>>({
  name: '',
  icon: '',
  sort_order: 0
})

const rules = {
  name: {
    required: true,
    message: '请输入分类名称',
    trigger: 'blur'
  }
}

// 表格列配置
const columns = [
  {
    title: '名称',
    key: 'name'
  },
  {
    title: '图标',
    key: 'icon',
    render(row: Category) {
      return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
        h(Icon, {
          icon: row.icon || 'material-symbols:folder',  // 如果没有图标则显示默认文件夹图标
          style: {
            fontSize: '20px',
            color: 'var(--primary-color)'
          }
        }),
        h('span', row.icon || '-')  // 同时显示图标名称，如果没有则显示 -
      ])
    }
  },
  {
    title: '排序',
    key: 'sort_order',
    sorter: (a: Category, b: Category) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  },
  {
    title: '操作',
    key: 'actions',
    render(row: Category) {
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
            onClick: () => handleDelete(row)
          },
          { default: () => '删除' }
        )
      ])
    }
  }
]

// 处理添加
const handleAdd = () => {
  editing.value = null
  form.value = {
    name: '',
    icon: '',
    sort_order: 0
  }
  showForm.value = true
}

// 处理编辑
const handleEdit = (category: Category) => {
  editing.value = category
  form.value = {
    name: category.name,
    icon: category.icon,
    sort_order: category.sort_order || 0
  }
  showForm.value = true
}

// 处理删除
const handleDelete = (category: Category) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除分类 "${category.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await bookmarkStore.removeCategory(category.id)
        message.success('删除成功')
      } catch (error) {
        console.error('Failed to delete category:', error)
        message.error('删除失败')
      }
    }
  })
}

// 处理表单提交
const handleSubmit = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      loading.value = true
      try {
        if (editing.value) {
          await bookmarkStore.updateCategory(editing.value.id, {
            name: form.value.name!,
            icon: form.value.icon,
            sort_order: form.value.sort_order
          })
          message.success('更新成功')
        } else {
          await bookmarkStore.addCategory({
            name: form.value.name!,
            icon: form.value.icon,
            sort_order: form.value.sort_order
          })
          message.success('添加成功')
        }
        showForm.value = false
      } catch (error) {
        console.error('Failed to save category:', error)
        message.error('保存失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped lang="scss">
.panel-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }
  }
}
</style>
