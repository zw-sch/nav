<template>
  <div class="panel-container">
    <n-form
      ref="formRef"
      :model="form"
      label-placement="left"
      label-width="auto"
      class="config-form"
    >
      <n-form-item label="城市代码" path="adcode">
        <n-input v-model:value="form.adcode" placeholder="请输入城市代码" />
        <template #feedback>
          <n-button
            text
            type="primary"
            tag="a"
            href="https://a.amap.com/lbs/static/code_resource/AMap_adcode_citycode.zip"
            target="_blank"
          >
            城市代码下载
          </n-button>
        </template>
      </n-form-item>

      <n-form-item label="API密钥" path="key">
        <n-input v-model:value="form.key" placeholder="请输入高德地图API密钥" />
        <template #feedback>
          <n-button text type="primary" tag="a" href="https://lbs.amap.com/dev/" target="_blank">
            获取API密钥
          </n-button>
        </template>
      </n-form-item>

      <div class="form-actions">
        <n-button type="primary" @click="handleSubmit">保存配置</n-button>
      </div>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NForm, NFormItem, NInput, NButton, useMessage } from 'naive-ui'
import { useWeatherStore } from '@/stores/weatherStore'
import { useUserStore } from '@/stores/userStore'

const message = useMessage()
const weatherStore = useWeatherStore()
const userStore = useUserStore()

const form = ref({
  adcode: userStore.currentUser?.weather_adcode || '',
  key: userStore.currentUser?.weather_key || ''
})

const getChangedFields = () => {
  const changes: Record<string, string> = {}

  if (form.value.adcode !== userStore.currentUser?.weather_adcode) {
    changes.weather_adcode = form.value.adcode
  }
  if (form.value.key !== userStore.currentUser?.weather_key) {
    changes.weather_key = form.value.key
  }

  return changes
}

const handleSubmit = async () => {
  try {
    const changes = getChangedFields()

    if (Object.keys(changes).length === 0) {
      message.info('没有需要保存的更改')
      return
    }

    await userStore.updateUser(changes)

    weatherStore.updateConfig({
      adcode: form.value.adcode,
      key: form.value.key
    })

    message.success('配置已保存')
    weatherStore.fetchWeather()
  } catch (error) {
    console.error('Failed to save weather config:', error)
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

.form-actions {
  margin-top: 24px;
  text-align: right;
}
</style>
