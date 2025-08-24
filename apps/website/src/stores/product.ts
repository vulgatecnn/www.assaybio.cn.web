import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product, PaginatedResponse, SearchFilters } from '@/types'
import { DataService } from '@/api/data'

export const useProductStore = defineStore('product', () => {
  // State
  const products = ref<Product[]>([])
  const currentProduct = ref<Product | null>(null)
  const categories = ref<Array<{ id: string; name: string; slug: string; count: number }>>([])
  const featuredProducts = ref<Product[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0
  })

  // Getters
  const productsByCategory = computed(() => {
    const grouped: Record<string, Product[]> = {}
    products.value.forEach(product => {
      const categoryId = product.category.id
      if (!grouped[categoryId]) {
        grouped[categoryId] = []
      }
      grouped[categoryId].push(product)
    })
    return grouped
  })

  const activeCategories = computed(() => {
    return categories.value.filter(cat => cat.count > 0)
  })

  // Actions
  async function fetchProducts(params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
    tags?: string[]
  }) {
    isLoading.value = true
    error.value = null
    
    try {
      const response: PaginatedResponse<Product> = await DataService.getProducts({
        page: params?.page || 1,
        limit: params?.limit || 12,
        keyword: params?.search,
        category: params?.category,
        tags: params?.tags
      })
      
      products.value = response.items
      pagination.value = {
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取产品列表失败'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProductBySlug(slug: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const product = await DataService.getProductBySlug(slug)
      currentProduct.value = product
      return product
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取产品详情失败'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCategories() {
    try {
      categories.value = await DataService.getProductCategories()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取产品分类失败'
    }
  }

  async function fetchFeaturedProducts(limit: number = 6) {
    try {
      featuredProducts.value = await DataService.getFeaturedProducts(limit)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取特色产品失败'
    }
  }

  function clearError() {
    error.value = null
  }

  function resetCurrentProduct() {
    currentProduct.value = null
  }

  // 搜索产品
  async function searchProducts(keyword: string, filters?: SearchFilters) {
    return fetchProducts({
      search: keyword,
      category: filters?.category,
      tags: filters?.tags
    })
  }

  return {
    // State
    products,
    currentProduct,
    categories,
    featuredProducts,
    isLoading,
    error,
    pagination,
    
    // Getters
    productsByCategory,
    activeCategories,
    
    // Actions
    fetchProducts,
    fetchProductBySlug,
    fetchCategories,
    fetchFeaturedProducts,
    searchProducts,
    clearError,
    resetCurrentProduct
  }
})