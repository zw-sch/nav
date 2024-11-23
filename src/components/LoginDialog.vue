<template>
  <n-modal v-model:show="show" preset="dialog" title="用户登录">
    <n-form
      ref="formRef"
      :model="loginForm"
      :rules="rules"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
    >
      <n-form-item label="用户名" path="username">
        <n-input v-model:value="loginForm.username" placeholder="请输入用户名" />
      </n-form-item>
      <n-form-item label="密码" path="password">
        <n-input
          v-model:value="loginForm.password"
          type="password"
          placeholder="请输入密码"
          @keyup.enter="handleLogin"
        />
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="show = false">取消</n-button>
      <n-button type="primary" :loading="loading" @click="handleLogin">
        登录
      </n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NModal, NForm, NFormItem, NInput, NButton, useMessage } from 'naive-ui'
import { useUserStore } from '@/stores/userStore'
import type { LoginForm } from '@/types/user'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'login-success'): void
}>()

const userStore = useUserStore()
const loading = ref(false)
const formRef = ref<typeof NForm | null>(null)
const message = useMessage()

const loginForm = ref<LoginForm>({
  username: '',
  password: ''
})

const rules = {
  username: {
    required: true,
    message: '请输入用户名',
    trigger: 'blur'
  },
  password: {
    required: true,
    message: '请输入密码',
    trigger: 'blur'
  }
}

const handleLogin = () => {
  formRef.value?.validate(async (errors: any) => {
    if (!errors) {
      loading.value = true
      try {
        const success = await userStore.login(loginForm.value)
        if (success) {
          message.success('登录成功')
          emit('login-success')
          emit('update:show', false)
        }
      } catch (error: any) {
        // 错误信息已经在请求拦截器中处理
      } finally {
        loading.value = false
      }
    }
  })
}

const show = computed({
  get() {
    return props.show
  },
  set(value) {
    emit('update:show', value)
  }
})
</script> 