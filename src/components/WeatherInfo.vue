<template>
  <div v-if="isLoggedIn && weather && !error" class="weather-container">
    <n-spin :show="loading">
      <div class="weather-content">
        <div class="weather-main">
          <Icon :icon="getWeatherIcon(weather.weather)" class="weather-icon" />
          <span class="temperature">{{ weather.temperature }}°</span>
        </div>
        <div class="weather-details">
          <div class="location">
            <Icon icon="material-symbols:location-on" />
            {{ weather.city }}
            <span class="weather-text">{{ weather.weather }}</span>
          </div>
          <div class="weather-info">
            <span class="wind-info">
              <Icon icon="material-symbols:air" />
              {{ weather.winddirection }}{{ weather.windpower }}级
            </span>
            <span class="humidity">
              <Icon icon="material-symbols:humidity-percentage" />
              {{ weather.humidity }}%
            </span>
          </div>
        </div>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useWeatherStore } from '@/stores/weatherStore'
import { useUserStore } from '@/stores/userStore'
import { Icon } from '@iconify/vue'

const weatherStore = useWeatherStore()
const userStore = useUserStore()
const { isLoggedIn } = storeToRefs(userStore)
const { weather, loading, error } = storeToRefs(weatherStore)

const getWeatherIcon = (weather: string) => {
  const icons: Record<string, string> = {
    晴: 'material-symbols:sunny',
    多云: 'material-symbols:partly-cloudy-day',
    阴: 'material-symbols:cloud',
    雨: 'material-symbols:rainy',
    雪: 'material-symbols:weather-snowy',
    雾: 'material-symbols:foggy',
  }
  return icons[weather] || 'material-symbols:wb-cloudy'
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString()
}

// 每30分钟更新一次天气
onMounted(() => {
  weatherStore.fetchWeather()
  setInterval(
    () => {
      weatherStore.fetchWeather()
    },
    30 * 60 * 1000,
  )
})
</script>

<style scoped lang="scss">
.weather-container {
  padding: 8px 16px;
  border-radius: 12px;
  height: 40px;
  display: flex;
  align-items: center;

  .weather-content {
    display: flex;
    align-items: center;
    gap: 12px;

    .weather-main {
      display: flex;
      align-items: center;
      gap: 4px;
      padding-right: 12px;
      border-right: 1px solid var(--border-color);

      .weather-icon {
        font-size: 24px;
        color: var(--primary-color);
      }

      .temperature {
        font-size: 20px;
        font-weight: 500;
        min-width: 40px;
      }
    }

    .weather-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 13px;

      .location {
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: 500;
        color: var(--text-primary);

        .weather-text {
          color: var(--text-secondary);
          font-weight: normal;
          margin-left: 4px;
        }
      }

      .weather-info {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--text-secondary);

        .wind-info,
        .humidity {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }
  }
}

@media (max-width: 640px) {
  .weather-container {
    .weather-content {
      .weather-details {
        .weather-info {
          display: none; // 在移动端隐藏风力和湿度信息
        }
      }
    }
  }
}
</style>
