import { request } from '@/utils/request'
import type { HotSource } from '@/types/hot'

// 获取热搜源列表
export const getSources = () => {
  return request.get<HotSource[]>('/api/hot/sources')
}

// 添加热搜源
export const addSource = (data: Omit<HotSource, 'id'>) => {
  return request.post<HotSource>('/api/hot/sources', data)
}

// 更新热搜源
export const updateSource = (id: number, data: Partial<HotSource>) => {
  return request.put<HotSource>(`/api/hot/sources/${id}`, data)
}

// 删除热搜源
export const deleteSource = (id: number) => {
  return request.delete(`/api/hot/sources/${id}`)
}
