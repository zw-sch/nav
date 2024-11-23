<template>
  <div class="panel-container">
    <n-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-placement="left"
      label-width="auto"
      class="config-form"
    >
      <n-form-item label="网站标题" path="site_title">
        <n-input
          v-model:value="form.site_title"
          placeholder="请输入网站标题"
          maxlength="50"
          show-count
          clearable
        />
      </n-form-item>

      <n-form-item label="ICP备案" path="icp_record">
        <n-input
          v-model:value="form.icp_record"
          placeholder="请输入ICP备案信息"
          maxlength="50"
          show-count
          clearable
        />
      </n-form-item>

      <div class="form-actions">
        <n-space justify="end">
          <n-button @click="resetForm">重置</n-button>
          <n-button type="primary" :loading="loading" @click="handleSubmit">
            保存配置
          </n-button>
        </n-space>
      </div>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NForm, NFormItem, NInput, NButton, NSpace, useMessage } from 'naive-ui'
import { useSystemStore } from '@/stores/systemStore'
import type { FormInst } from 'naive-ui'
import type { SystemConfig } from '@/types/system'

const message = useMessage()
const systemStore = useSystemStore()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)

const form = ref<SystemConfig>({
  site_title: '',
  icp_record: ''
})

const rules = {
  site_title: {
    required: true,
    message: '请输入网站标题',
    trigger: 'blur'
  }
}

const resetForm = () => {
  form.value = { ...systemStore.config }
}

const handleSubmit = async () => {
  try {
    loading.value = true
    await formRef.value?.validate()
    await systemStore.updateConfig(form.value)
    message.success('配置已保存')
  } catch (error) {
    if (error instanceof Error) {
      message.error(error.message)
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    loading.value = true
    await systemStore.fetchConfig()
    form.value = { ...systemStore.config }
  } catch (error) {
    message.error('加载配置失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.panel-container {
  padding: 16px;
  height: 100%;
  overflow: auto;
}

.config-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-actions {
  margin-top: 24px;
  text-align: right;
}
</style>
