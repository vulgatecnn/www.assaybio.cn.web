<template>
  <div class="documents-page">
    <AppHeader />
    
    <main>
      <!-- 页面头部 -->
      <section class="bg-primary-900 text-white py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-6">技术文献</h1>
          <p class="text-xl text-primary-200 max-w-3xl mx-auto">
            下载技术手册、规范文件和应用指南
          </p>
        </div>
      </section>

      <!-- 搜索和过滤 -->
      <section class="py-8 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col lg:flex-row gap-6">
            <!-- 搜索框 -->
            <div class="flex-1">
              <div class="relative">
                <input
                  v-model="searchKeyword"
                  type="text"
                  placeholder="搜索文档标题或描述..."
                  class="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  @input="debounceSearch"
                />
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- 分类过滤 -->
            <div class="lg:w-64">
              <select
                v-model="selectedCategory"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                @change="handleFilterChange"
              >
                <option value="">全部分类</option>
                <option 
                  v-for="category in categories" 
                  :key="category.name" 
                  :value="category.name"
                >
                  {{ category.name }} ({{ category.count }})
                </option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <!-- 文档列表 -->
      <section class="py-16 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- 加载状态 -->
          <div v-if="isLoading" class="text-center py-12">
            <div class="inline-flex items-center justify-center w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <p class="mt-4 text-gray-600">正在加载文档...</p>
          </div>

          <!-- 错误状态 -->
          <div v-else-if="error" class="text-center py-12">
            <div class="text-red-600 mb-4">
              <svg class="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-gray-600 mb-4">{{ error }}</p>
            <button 
              @click="loadDocuments"
              class="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              重新加载
            </button>
          </div>

          <!-- 文档网格 -->
          <div v-else-if="documents.length > 0">
            <div class="mb-8">
              <p class="text-gray-600">
                找到 <span class="font-semibold">{{ pagination.total }}</span> 个文档
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <DocumentCard 
                v-for="document in documents" 
                :key="document.id" 
                :document="document"
                @download="handleDownload"
              />
            </div>

            <!-- 分页 -->
            <Pagination
              v-if="pagination.totalPages > 1"
              :current-page="pagination.page"
              :total-pages="pagination.totalPages"
              :total="pagination.total"
              @page-change="handlePageChange"
              class="mt-12"
            />
          </div>

          <!-- 空状态 -->
          <div v-else class="text-center py-12">
            <div class="text-gray-400 mb-4">
              <svg class="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">暂无文档</h3>
            <p class="text-gray-600">没有找到符合条件的文档，请调整搜索条件</p>
          </div>
        </div>
      </section>
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import DocumentCard from '@/components/documents/DocumentCard.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { useDocumentStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { debounce } from '@/utils/debounce'
import type { Document } from '@/types'

const route = useRoute()
const documentStore = useDocumentStore()

// 响应式状态
const { documents, categories, isLoading, error, pagination } = storeToRefs(documentStore)
const searchKeyword = ref('')
const selectedCategory = ref('')

// 防抖搜索
const debounceSearch = debounce(() => {
  loadDocuments()
}, 500)

// 加载文档
async function loadDocuments(page = 1) {
  await documentStore.fetchDocuments({
    page,
    limit: 12,
    search: searchKeyword.value,
    category: selectedCategory.value
  })
}

// 处理分页变化
function handlePageChange(page: number) {
  loadDocuments(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 处理过滤变化
function handleFilterChange() {
  loadDocuments(1)
}

// 处理文档下载
async function handleDownload(document: Document) {
  try {
    await documentStore.downloadDocument(document)
    // TODO: 显示下载成功提示
    console.log('Document downloaded:', document.title)
  } catch (err) {
    // TODO: 显示下载失败提示
    console.error('Download failed:', err)
  }
}

// 从URL查询参数获取初始状态
function initializeFromRoute() {
  const query = route.query
  if (query.search) {
    searchKeyword.value = query.search as string
  }
  if (query.category) {
    selectedCategory.value = query.category as string
  }
}

// 生命周期
onMounted(async () => {
  initializeFromRoute()
  await Promise.all([
    documentStore.fetchCategories(),
    loadDocuments()
  ])
})

// 监听路由查询参数变化
watch(() => route.query, (newQuery) => {
  if (newQuery.search !== searchKeyword.value) {
    searchKeyword.value = (newQuery.search as string) || ''
  }
  if (newQuery.category !== selectedCategory.value) {
    selectedCategory.value = (newQuery.category as string) || ''
  }
  loadDocuments(1)
})
</script>