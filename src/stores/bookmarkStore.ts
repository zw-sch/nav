import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Bookmark, Category, BookmarkState } from '@/types/bookmark'
import { useUserStore } from './userStore'
import {
  getCategories,
  addCategory as addCategoryApi,
  updateCategory as updateCategoryApi,
  deleteCategory as deleteCategoryApi,
  getBookmarks,
  addBookmark as addBookmarkApi,
  updateBookmark as updateBookmarkApi,
  deleteBookmark as deleteBookmarkApi,
} from '@/api/bookmark'

export const useBookmarkStore = defineStore('bookmark', () => {
  const userStore = useUserStore()

  const state = ref<BookmarkState>({
    categories: [],
    bookmarks: [],
  })

  // 获取分类列表
  const fetchCategories = async () => {
    if (userStore.isLoggedIn) {
      try {
        const res = await getCategories()
        state.value.categories = res.data
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }
  }

  // 添加分类
  const addCategory = async (category: Partial<Category>) => {
    try {
      const data = {
        name: category.name,
        icon: category.icon || ''
      }
      const response = await addCategoryApi(data)
      state.value.categories.push(response.data)
    } catch (error) {
      console.error('Failed to add category:', error)
      throw error
    }
  }

  // 更新分类
  const updateCategory = async (category: Partial<Category>) => {
    try {
      const data = {
        name: category.name,
        icon: category.icon || '',
        sort_order: category.sort_order
      }
      await updateCategoryApi(category.id, data)
      const index = state.value.categories.findIndex(c => c.id === category.id)
      if (index !== -1) {
        state.value.categories[index] = {
          ...state.value.categories[index],
          ...category
        }
      }

      // 如果更新涉及排序，则重新获取所有数据以保持同步
      if (category.sort_order !== undefined) {
        await Promise.all([
          fetchCategories(),
          fetchBookmarks()
        ])
      }
    } catch (error) {
      console.error('Failed to update category:', error)
      throw error
    }
  }

  // 删除分类
  const removeCategory = async (id: number) => {
    try {
      await deleteCategoryApi(id)
      state.value.categories = state.value.categories.filter(c => c.id !== id)
    } catch (error) {
      console.error('Failed to remove category:', error)
      throw error
    }
  }

  // 获取书签列表
  const fetchBookmarks = async () => {
    if (userStore.isLoggedIn) {
      try {
        const res = await getBookmarks()
        state.value.bookmarks = res.data.map((bookmark) => ({
          ...bookmark,
          categoryId: bookmark.category_id,
          internalUrl: bookmark.internal_url,
          externalUrl: bookmark.external_url,
        }))
      } catch (error) {
        console.error('Failed to fetch bookmarks:', error)
      }
    }
  }

  // 添加书签
  const addBookmark = async (bookmark: Omit<Bookmark, 'id'>) => {
    if (userStore.isLoggedIn) {
      try {
        const res = await addBookmarkApi(bookmark)
        const newBookmark = {
          ...res.data,
          categoryId: res.data.category_id,
          internalUrl: res.data.internal_url,
          externalUrl: res.data.external_url,
        }
        state.value.bookmarks.push(newBookmark)
        return newBookmark
      } catch (error) {
        console.error('Failed to add bookmark:', error)
        throw error
      }
    }
  }

  // 更新书签
  const updateBookmark = async (id: number, data: Partial<Bookmark>) => {
    if (userStore.isLoggedIn) {
      const res = await updateBookmarkApi(id, data)
      const updatedBookmark = {
        ...res.data,
        categoryId: res.data.category_id,
        internalUrl: res.data.internal_url,
        externalUrl: res.data.external_url,
      }
      const index = state.value.bookmarks.findIndex((b) => b.id === id)
      if (index !== -1) {
        state.value.bookmarks[index] = updatedBookmark
      }
      return updatedBookmark
    }
  }

  // 删除书签
  const removeBookmark = async (id: number) => {
    if (userStore.isLoggedIn) {
      await deleteBookmarkApi(id)
      const index = state.value.bookmarks.findIndex((b) => b.id === id)
      if (index !== -1) {
        state.value.bookmarks.splice(index, 1)
      }
    }
  }

  // 获取分类路径
  const getCategoryPath = (categoryId: number) => {
    const category = state.value.categories.find((c) => c.id === categoryId)
    return category ? [category.name] : []
  }

  // 添加初始化状态标记
  const initialized = ref(false)

  // 修改 fetchAll 方法
  const fetchAll = async () => {
    if (userStore.isLoggedIn && !initialized.value) {
      try {
        await Promise.all([fetchCategories(), fetchBookmarks()])
        initialized.value = true
      } catch (error) {
        console.error('Failed to fetch bookmark data:', error)
      }
    }
  }

  return {
    state,
    addCategory,
    updateCategory,
    removeCategory,
    addBookmark,
    updateBookmark,
    removeBookmark,
    getCategoryPath,
    fetchAll,
    fetchCategories,
    fetchBookmarks,
    initialized,
  }
})
