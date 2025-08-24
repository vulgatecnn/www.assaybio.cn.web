import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NewsArticle, PaginatedResponse } from '@/types'
import { DataService } from '@/api/data'

export const useNewsStore = defineStore('news', () => {
  // State
  const news = ref<NewsArticle[]>([])
  const currentArticle = ref<NewsArticle | null>(null)
  const featuredNews = ref<NewsArticle[]>([])
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
  const newsByCategory = computed(() => {
    const grouped: Record<string, NewsArticle[]> = {}
    news.value.forEach(article => {
      const category = article.category
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(article)
    })
    return grouped
  })

  const latestNews = computed(() => {
    return [...news.value]
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
      .slice(0, 5)
  })

  // Actions
  async function fetchNews(params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
  }) {
    isLoading.value = true
    error.value = null
    
    try {
      const response: PaginatedResponse<NewsArticle> = await DataService.getNews({
        page: params?.page || 1,
        limit: params?.limit || 10,
        keyword: params?.search,
        category: params?.category
      })
      
      news.value = response.items
      pagination.value = {
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取新闻列表失败'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchNewsBySlug(slug: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const article = await DataService.getNewsBySlug(slug)
      currentArticle.value = article
      return article
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取新闻详情失败'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function fetchFeaturedNews(limit: number = 3) {
    try {
      featuredNews.value = await DataService.getFeaturedNews(limit)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取推荐新闻失败'
    }
  }

  async function fetchCategories() {
    try {
      categories.value = await DataService.getNewsCategories()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取新闻分类失败'
    }
  }

  function clearError() {
    error.value = null
  }

  function resetCurrentArticle() {
    currentArticle.value = null
  }

  // 搜索新闻
  async function searchNews(keyword: string, category?: string) {
    return fetchNews({
      search: keyword,
      category
    })
  }

  return {
    // State
    news,
    currentArticle,
    featuredNews,
    categories,
    isLoading,
    error,
    pagination,
    
    // Getters
    newsByCategory,
    latestNews,
    
    // Actions
    fetchNews,
    fetchNewsBySlug,
    fetchFeaturedNews,
    fetchCategories,
    searchNews,
    clearError,
    resetCurrentArticle
  }
})