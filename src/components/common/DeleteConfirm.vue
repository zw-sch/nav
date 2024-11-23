<template>
  <n-modal
    v-model:show="showModal"
    :style="{ width: isDesktop ? '400px' : '90%' }"
    preset="dialog"
    type="warning"
    :title="title"
    :content="content"
    positive-text="确认"
    negative-text="取消"
    @positive-click="handleConfirm"
    @negative-click="handleCancel"
  >
    <template #icon>
      <Icon icon="material-symbols:warning-outline" :size="24" />
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useBreakpoint } from '@/composables/useBreakpoint'

const props = defineProps<{
  title?: string
  content?: string
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const { isDesktop } = useBreakpoint()
const showModal = ref(false)

const handleConfirm = () => {
  emit('confirm')
  showModal.value = false
}

const handleCancel = () => {
  emit('cancel')
  showModal.value = false
}

// 暴露方法给父组件
defineExpose({
  show: () => {
    showModal.value = true
  }
})
</script>
