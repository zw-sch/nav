<script setup lang="ts">
import { computed, ref, h, watch, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import {
  darkTheme,
  NConfigProvider,
  NButton,
  NMessageProvider,
  NDialogProvider,
  NDropdown,
  NAvatar,
} from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useSearchStore } from '@/stores/searchStore'
import { useUserStore } from '@/stores/userStore'
import { useConfigStore } from '@/stores/configStore'
import { useWeatherStore } from '@/stores/weatherStore'
import { useHotStore } from '@/stores/hotStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import SearchBox from './components/SearchBox.vue'
import LoginDialog from './components/LoginDialog.vue'
import ManageSourcesDialog from './components/ManageSourcesDialog.vue'
import HotSearch from './components/HotSearch.vue'
import BookmarkContainer from './components/BookmarkContainer.vue'
import ManagePanel from './components/ManagePanel.vue'
import WeatherInfo from './components/WeatherInfo.vue'
import AddEngineDialog from './components/AddEngineDialog.vue'
import DateTime from './components/DateTime.vue'
import HitokotoText from '@/components/HitokotoText.vue'
import { useSystemStore } from '@/stores/systemStore'

const searchStore = useSearchStore()
const userStore = useUserStore()
const configStore = useConfigStore()
const weatherStore = useWeatherStore()
const hotStore = useHotStore()
const bookmarkStore = useBookmarkStore()
const systemStore = useSystemStore()
const { isDarkMode } = storeToRefs(searchStore)
const { isLoggedIn, currentUser } = storeToRefs(userStore)
const { containerConfig } = storeToRefs(configStore)

const theme = computed(() => (isDarkMode.value ? darkTheme : null))
const showLoginDialog = ref(false)
const showManageSourcesDialog = ref(false)
const isMinimalMode = ref(localStorage.getItem('minimalMode') === 'true')
const showManagePanel = ref(false)
const showAddEngineDialog = ref(false)

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('dark-mode', isDarkMode.value)
}

const toggleMinimalMode = () => {
  isMinimalMode.value = !isMinimalMode.value
  localStorage.setItem('minimalMode', isMinimalMode.value.toString())
}

const handleLogout = () => {
  userStore.logout()
}

const dropdownOptions = [
  {
    label: '管理面板',
    key: 'manage-panel',
    icon: renderIcon('material-symbols:dashboard'),
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: renderIcon('material-symbols:logout'),
  },
]

const handleDropdownSelect = (key: string) => {
  if (key === 'manage-panel') {
    showManagePanel.value = true
  } else if (key === 'logout') {
    handleLogout()
  }
}

function renderIcon(icon: string) {
  return () => h(Icon, { icon })
}

const handleEngineSuccess = () => {
  showAddEngineDialog.value = false
}

// 初始化时检查容器配置
const initStores = async () => {
  if (isLoggedIn.value) {
    // 等待获取用户配置
    await configStore.fetchConfig()

    // 只有在对应容器启用时才初始化
    if (configStore.containerConfig.showWeather) {
      await weatherStore.fetchWeather()
    }
    if (configStore.containerConfig.showHotSearch) {
      await hotStore.fetchSources()
    }
    if (configStore.containerConfig.showBookmark) {
      await bookmarkStore.fetchCategories()
      await bookmarkStore.fetchBookmarks()
    }
  }
}

// 监听登录状态变化
watch(isLoggedIn, async (newValue) => {
  if (newValue) {
    await initStores()
  }
})

// 初始化时执行
onMounted(async () => {
  if (isLoggedIn.value) {
    await initStores()
  }
  await systemStore.fetchConfig()
})

// 在 script setup 部分添加对 minimalMode 变化的监听
watch(isMinimalMode, async (newValue) => {
  if (!newValue && hotStore.currentSource) {
    // 当从极简模式切换到正常模式时，强制刷新热搜数据
    await hotStore.fetchSources()
  }
})
</script>

<template>
  <n-message-provider>
    <n-dialog-provider>
      <n-config-provider :theme="theme">
        <div
          class="app-container"
          :class="{
            'dark-mode': isDarkMode,
            'minimal-mode': isMinimalMode,
          }"
        >
          <div class="header" v-show="!isMinimalMode">
            <div class="header-content">
              <div class="header-left">
                <WeatherInfo v-if="isLoggedIn && containerConfig.showWeather" />
              </div>
              <div class="header-center">
                <DateTime v-if="isLoggedIn && containerConfig.showDateTime" />
              </div>
              <div class="header-right">
                <template v-if="isLoggedIn">
                  <n-dropdown
                    trigger="hover"
                    :options="dropdownOptions"
                    @select="handleDropdownSelect"
                  >
                    <n-avatar
                      round
                      :src="currentUser?.avatar"
                      :fallback-src="currentUser?.avatar"
                    />
                  </n-dropdown>
                </template>
                <template v-else>
                  <n-button quaternary @click="showLoginDialog = true"> 登录 </n-button>
                </template>
                <n-button class="theme-toggle" quaternary circle @click="toggleTheme">
                  <template #icon>
                    <Icon
                      :icon="
                        isDarkMode ? 'material-symbols:light-mode' : 'material-symbols:dark-mode'
                      "
                    />
                  </template>
                </n-button>
              </div>
            </div>
          </div>

          <div class="main-content">
            <div
              class="content-wrapper"
              :class="{
                'center-search':
                  !isLoggedIn ||
                  isMinimalMode ||
                  (!containerConfig.showHotSearch && !containerConfig.showBookmark),
              }"
            >
              <SearchBox :minimal-mode="isMinimalMode" @add-engine="showAddEngineDialog = true" />
              <template v-if="isLoggedIn && !isMinimalMode">
                <HotSearch v-if="containerConfig.showHotSearch" :is-minimal-mode="isMinimalMode" />
                <BookmarkContainer v-if="containerConfig.showBookmark" />
              </template>
              <div class="footer" v-if="!isMinimalMode">
                <div class="footer-content">
                  <HitokotoText v-if="containerConfig.showHitokoto" class="hitokoto" />
                  <n-button
                    v-if="systemStore.config.icp_record && (!isLoggedIn || containerConfig.showIcp)"
                    text
                    tag="a"
                    href="https://beian.miit.gov.cn/"
                    target="_blank"
                    class="icp-link"
                  >
                    {{ systemStore.config.icp_record }}
                  </n-button>
                </div>
              </div>
            </div>
          </div>

          <LoginDialog v-model:show="showLoginDialog" @login-success="showLoginDialog = false" />

          <ManageSourcesDialog v-model:show="showManageSourcesDialog" />

          <ManagePanel v-model:show="showManagePanel" />

          <n-button
            v-if="isLoggedIn"
            class="minimal-mode-toggle"
            circle
            type="primary"
            @click="toggleMinimalMode"
          >
            <template #icon>
              <Icon
                :icon="
                  isMinimalMode ? 'material-symbols:fullscreen-exit' : 'material-symbols:fullscreen'
                "
              />
            </template>
          </n-button>

          <AddEngineDialog
            v-model:show="showAddEngineDialog"
            :editing="null"
            @success="handleEngineSuccess"
          />
        </div>
      </n-config-provider>
    </n-dialog-provider>
  </n-message-provider>
</template>

<style scoped lang="scss">
.app-container {
  min-height: 100vh;
  max-height: 100vh;
  padding: 40px 0;
  background: var(--bg-primary);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: auto;

  &.minimal-mode {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    overflow: hidden;

    .content-wrapper {
      width: 100%;
      max-width: min(90vw, 1200px) !important;
      padding: 0 20px;
      height: min(90vh, 800px);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      :deep(.search-container) {
        width: min(100%, 800px);
        transform-origin: center;
        transition: all 0.3s ease;
      }
    }
  }

  .header {
    width: 100%;
    margin-bottom: 40px;
    flex-shrink: 0;

    .header-content {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      width: min(90vw, 1200px);
      margin: 0 auto;
      padding: 0 20px;
      height: 40px;
      gap: 20px;

      .header-left {
        justify-self: start;
        min-width: 0;
      }

      .header-center {
        justify-self: center;
        min-width: 0;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 12px;
        justify-self: end;
        flex-shrink: 0;

        .theme-toggle {
          font-size: 20px;
        }
      }
    }
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    width: 100%;

    .content-wrapper {
      width: min(90vw, 1200px);
      margin: 0 auto;
      padding: 0 20px;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;

      &.center-search {
        justify-content: center;
        align-items: center;
        padding-bottom: 20vh;

        :deep(.search-box) {
          margin: 0;
          width: 100%;
          max-width: 800px;
        }

        .footer {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
        }
      }
    }
  }

  .minimal-mode-toggle {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 1000;
    opacity: 0.6;
    transition: opacity 0.3s ease;

    &:hover {
      opacity: 1;
    }
  }
}

@media (max-width: 640px) {
  .app-container {
    padding: 20px 0;

    &.minimal-mode {
      padding: 0;

      .content-wrapper {
        padding: 0 16px;
        height: 100vh;
        max-width: 100% !important;

        :deep(.search-container) {
          width: 100%;
          transform: none;
        }
      }
    }

    .header {
      margin-bottom: 24px;

      .header-content {
        grid-template-columns: auto 1fr auto;
        gap: 12px;
        padding: 0 16px;

        .header-center {
          display: none;
        }
      }
    }

    .main-content {
      .content-wrapper {
        padding: 0 16px;
        width: 100%;
      }
    }

    .minimal-mode-toggle {
      right: 16px;
      bottom: 16px;
    }
  }
}

@media (orientation: landscape) and (max-height: 600px) {
  .app-container.minimal-mode {
    .content-wrapper {
      height: auto;
      padding: 20px;
    }
  }
}

.footer {
  text-align: center;
  margin-top: auto;
  padding: 16px 0;
  width: 100%;

  .footer-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
}

.hitokoto {
  font-size: 14px;
  color: var(--text-color-3);
}

.icp-link {
  font-size: 12px;
  color: var(--text-color-3);
  transition: color 0.2s ease;
  line-height: 1;
}

.icp-link:hover {
  color: var(--text-color-2);
}
</style>
