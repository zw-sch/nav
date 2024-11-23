<template>
  <div v-if="show" class="hitokoto-container">
    <p class="hitokoto-text">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import axios from 'axios'

const configStore = useConfigStore()
const text = ref('获取中...')
const show = computed(() => configStore.containerConfig.showHitokoto)

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

onMounted(() => {
  fetchHitokoto()
  // 每5分钟更新一次
  timer = window.setInterval(fetchHitokoto, 5 * 60 * 1000)
})

onUnmounted(() => {
  if (timer) {
    window.clearInterval(timer)
  }
})
</script>

<style scoped>
.hitokoto-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  padding: 10px 20px;
  z-index: 100;
  width: fit-content;
  max-width: 80%;
}

.hitokoto-text {
  margin: 0;
  font-size: 14px;
  color: var(--text-color-3);
  line-height: 1.5;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .hitokoto-container {
    width: 90%;
    bottom: 10px;
    padding: 8px 16px;
  }

  .hitokoto-text {
    font-size: 12px;
  }
}
</style>
