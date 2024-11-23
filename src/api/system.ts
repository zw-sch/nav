import { request } from '@/utils/request'
import type { SystemConfig } from '@/types/system'

export function getSystemConfig() {
  return request.get<SystemConfig>('/api/system/config')
}

export function updateSystemConfig(config: Partial<SystemConfig>) {
  return request.put<SystemConfig>('/api/system/config', config)
}
