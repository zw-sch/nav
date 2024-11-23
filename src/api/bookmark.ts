import { request } from '@/utils/request'
import type { Bookmark, Category } from '@/types/bookmark'

// 获取分类列表
export const getCategories = () => {
  return request.get<Category[]>('/api/bookmarks/categories')
}

// 添加分类
export const addCategory = (data: Omit<Category, 'id'>) => {
  return request.post<Category>('/api/bookmarks/categories', data)
}

// 更新分类
export const updateCategory = (id: number, data: Partial<Category>) => {
  return request.put<Category>(`/api/bookmarks/categories/${id}`, data)
}

// 删除分类
export const deleteCategory = (id: number) => {
  return request.delete(`/api/bookmarks/categories/${id}`)
}

// 获取书签列表
export const getBookmarks = () => {
  return request.get<Bookmark[]>('/api/bookmarks')
}

// 添加书签
export const addBookmark = (data: Omit<Bookmark, 'id'>) => {
  return request.post<Bookmark>('/api/bookmarks', {
    ...data,
    category_id: data.categoryId,
    internal_url: data.internalUrl,
    external_url: data.externalUrl
  })
}

// 更新书签
export const updateBookmark = (id: number, data: Partial<Bookmark>) => {
  return request.put<Bookmark>(`/api/bookmarks/${id}`, {
    ...data,
    category_id: data.categoryId,
    internal_url: data.internalUrl,
    external_url: data.externalUrl
  })
}

// 删除书签
export const deleteBookmark = (id: number) => {
  return request.delete(`/api/bookmarks/${id}`)
} 