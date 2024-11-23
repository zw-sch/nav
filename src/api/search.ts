import { request } from '@/utils/request'
import type { SearchEngine } from '@/types/search'

// 获取搜索引擎列表
export const getEngines = () => {
  return request.get<SearchEngine[]>('/api/search/engines')
}

// 添加搜索引擎
export const addEngine = (data: Omit<SearchEngine, 'id'>) => {
  return request.post<SearchEngine>('/api/search/engines', {
    ...data,
    search_url: data.searchUrl  // 适配后端字段名
  })
}

// 更新搜索引擎
export const updateEngine = (id: number, data: Partial<SearchEngine>) => {
  return request.put<SearchEngine>(`/api/search/engines/${id}`, {
    ...data,
    search_url: data.searchUrl  // 适配后端字段名
  })
}

// 删除搜索引擎
export const deleteEngine = (id: number) => {
  return request.delete(`/api/search/engines/${id}`)
} 