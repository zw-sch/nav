<template>
  <div class="datetime-container">
    <div class="solar-time">{{ solarTime }}</div>
    <div class="lunar-time">{{ lunarTime }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Lunar } from 'lunar-typescript'

const solarTime = ref('')
const lunarTime = ref('')

const updateTime = () => {
  const now = new Date()
  
  // 更新公历时间
  solarTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-')

  // 更新农历时间
  const lunar = Lunar.fromDate(now)
  lunarTime.value = `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${now.toLocaleDateString('zh-CN', { weekday: 'long' })}`
}

let timer: number

onMounted(() => {
  updateTime()
  timer = window.setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped lang="scss">
.datetime-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  height: 40px;
  justify-content: center;

  .solar-time {
    font-size: 16px;
    font-weight: 500;
    color: var(--text-primary);
    font-family: 'Monaco', monospace;
    line-height: 1.2;
  }

  .lunar-time {
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.2;
  }
}

@media (max-width: 640px) {
  .datetime-container {
    display: none;  // 移动端不显示
  }
}
</style> 