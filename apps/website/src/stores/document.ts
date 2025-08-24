import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Document, PaginatedResponse } from '@/types'
import { DataService } from '@/api/data'

export const useDocumentStore = defineStore('document', () => {
  // State
  const documents = ref<Document[]>([])
  const currentDocument = ref<Document | null>(null)
  const categories = ref<Array<{ name: string; count: number }>>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  })

  // Getters
  const documentsByCategory = computed(() => {
    const grouped: Record<string, Document[]> = {}
    documents.value.forEach(doc => {
      const category = doc.category
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(doc)
    })
    return grouped
  })

  const documentsByType = computed(() => {
    const grouped: Record<string, Document[]> = {}
    documents.value.forEach(doc => {
      const type = doc.type
      if (!grouped[type]) {
        grouped[type] = []
      }
      grouped[type].push(doc)
    })
    return grouped
  })

  const recentDocuments = computed(() => {
    return [...documents.value]
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
      .slice(0, 5)
  })

  // Actions
  async function fetchDocuments(params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
  }) {
    isLoading.value = true
    error.value = null
    
    try {
      const response: PaginatedResponse<Document> = await DataService.getDocuments({
        page: params?.page || 1,
        limit: params?.limit || 10,
        keyword: params?.search,
        category: params?.category
      })
      
      documents.value = response.items
      pagination.value = {
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取文档列表失败'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDocumentById(id: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const document = await DataService.getDocumentById(id)
      currentDocument.value = document
      return document
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取文档详情失败'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCategories() {
    try {
      categories.value = await DataService.getDocumentCategories()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取文档分类失败'
    }
  }

  function clearError() {
    error.value = null
  }

  function resetCurrentDocument() {
    currentDocument.value = null
  }

  // 搜索文档
  async function searchDocuments(keyword: string, category?: string) {
    return fetchDocuments({
      search: keyword,
      category
    })
  }

  // 下载文档（模拟）
  async function downloadDocument(document: Document) {
    if (!document.fileUrl) {
      throw new Error('文档下载地址不存在')
    }
    
    // 这里可以实现真实的下载逻辑
    // 例如打开新窗口或触发下载
    window.open(document.fileUrl, '_blank')
    
    // 增加下载计数（在真实应用中应该通过API更新）
    document.downloadCount += 1
  }

  return {
    // State
    documents,
    currentDocument,
    categories,
    isLoading,
    error,
    pagination,
    
    // Getters
    documentsByCategory,
    documentsByType,
    recentDocuments,
    
    // Actions
    fetchDocuments,
    fetchDocumentById,
    fetchCategories,
    searchDocuments,
    downloadDocument,
    clearError,
    resetCurrentDocument
  }
})