import { ref, onMounted, onUnmounted } from 'vue'

export function useBreakpoint(breakpoint = 768) {
  const isDesktop = ref(true)

  const checkWidth = () => {
    isDesktop.value = window.innerWidth >= breakpoint
  }

  onMounted(() => {
    checkWidth()
    window.addEventListener('resize', checkWidth)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', checkWidth)
  })

  return {
    isDesktop
  }
}
