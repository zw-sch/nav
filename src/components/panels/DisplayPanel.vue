<template>
  <div class="panel-container">
    <n-form
      ref="formRef"
      :model="form"
      label-placement="left"
      label-width="auto"
      class="config-form"
    >
      <div class="switch-grid">
        <n-form-item label="天气组件">
          <n-switch v-model:value="form.showWeather" @update:value="handleChange">
            <template #checked v-if="isDesktop">显示</template>
            <template #unchecked v-if="isDesktop">隐藏</template>
          </n-switch>
        </n-form-item>

        <n-form-item label="热搜榜">
          <n-switch v-model:value="form.showHotSearch" @update:value="handleChange">
            <template #checked v-if="isDesktop">显示</template>
            <template #unchecked v-if="isDesktop">隐藏</template>
          </n-switch>
        </n-form-item>

        <n-form-item label="书签">
          <n-switch v-model:value="form.showBookmark" @update:value="handleChange">
            <template #checked v-if="isDesktop">显示</template>
            <template #unchecked v-if="isDesktop">隐藏</template>
          </n-switch>
        </n-form-item>

        <n-form-item label="显示时间">
          <n-switch v-model:value="form.showDateTime" @update:value="handleChange">
            <template #checked v-if="isDesktop">开启</template>
            <template #unchecked v-if="isDesktop">关闭</template>
          </n-switch>
        </n-form-item>

        <n-form-item label="一言">
          <n-switch v-model:value="form.showHitokoto" @update:value="handleChange">
            <template #checked v-if="isDesktop">显示</template>
            <template #unchecked v-if="isDesktop">隐藏</template>
          </n-switch>
        </n-form-item>

        <n-form-item label="备案信息">
          <n-switch v-model:value="form.showIcp" @update:value="handleChange">
            <template #checked v-if="isDesktop">显示</template>
            <template #unchecked v-if="isDesktop">隐藏</template>
          </n-switch>
        </n-form-item>
      </div>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NForm, NFormItem, NSwitch, useMessage } from 'naive-ui'
import { useConfigStore } from '@/stores/configStore'
import { useUserStore } from '@/stores/userStore'
import { useBreakpoint } from '@/composables/useBreakpoint'
import type { ContainerConfig } from '@/types/config'

const message = useMessage()
const configStore = useConfigStore()
const userStore = useUserStore()
const { isDesktop } = useBreakpoint()

const form = ref<ContainerConfig>({
  showWeather: true,
  showHotSearch: true,
  showBookmark: true,
  showDateTime: true,
  showHitokoto: true,
  showIcp: true,
  ...(userStore.currentUser?.container_config || {})
})

// 状态变更时立即保存并生效
const handleChange = async () => {
  try {
    // 立即更新本地状态
    configStore.updateContainerConfig(form.value)

    // 异步保存到服务器
    await userStore.updateUser({
      container_config: form.value
    })
  } catch (error) {
    console.error('Failed to save display config:', error)
    message.error('保存失败')
  }
}
</script>

<style scoped>
.panel-container {
  padding: 16px;
}

.config-form {
  max-width: 600px;
  margin: 0 auto;
}

.switch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .switch-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  :deep(.n-form-item-label) {
    font-size: 14px;
  }

  :deep(.n-switch) {
    min-width: 40px;
  }
}
</style>
