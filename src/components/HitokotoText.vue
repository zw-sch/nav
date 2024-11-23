<template>
  <div v-if="shouldShow" class="hitokoto-container">
    <div class="hitokoto-wrapper">
      <p class="hitokoto-text">{{ text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import { useUserStore } from '@/stores/userStore'
import axios from 'axios'

const configStore = useConfigStore()
const userStore = useUserStore()
const text = ref('获取中...')

// 修改显示逻辑，同时考虑登录状态和一言开关
const shouldShow = computed(() => {
  return userStore.isLoggedIn && configStore.containerConfig.showHitokoto
})

let timer: number | null = null

const fetchHitokoto = async () => {
  try {
    const response = await axios.get('https://v1.hitokoto.cn/?encode=json')
    text.value = response.data.hitokoto
  } catch (error) {
    console.error('Failed to fetch hitokoto:', error)
    text.value = '获取中...'
  }
}

const startTimer = () => {
  if (timer) {
    clearInterval(timer)
  }
  timer = window.setInterval(fetchHitokoto, 5 * 60 * 1000)
}

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 监听显示状态变化
watch(shouldShow, (newValue) => {
  if (newValue) {
    fetchHitokoto()
    startTimer()
  } else {
    stopTimer()
    text.value = '获取中...'
  }
})

onMounted(() => {
  if (shouldShow.value) {
    fetchHitokoto()
    startTimer()
  }
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.hitokoto-container {
  width: 100%;
  margin-top: auto;
  padding-top: 20px;
}

.hitokoto-wrapper {
  max-width: min(90vw, 1200px);
  margin: 0 auto;
  padding: 16px 20px;
}

.hitokoto-text {
  margin: 0;
  font-size: 14px;
  color: var(--text-color-3);
  line-height: 1.5;
  opacity: 0.8;
  text-align: center;
}

@media (max-width: 768px) {
  .hitokoto-container {
    padding-top: 16px;
  }

  .hitokoto-wrapper {
    padding: 12px 16px;
  }

  .hitokoto-text {
    font-size: 12px;
  }
}
</style>
