<template>
  <div class="news-page">
    <AppHeader />
    
    <main>
      <!-- 页面头部 -->
      <section class="bg-primary-900 text-white py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-6">新闻动态</h1>
          <p class="text-xl text-primary-200 max-w-3xl mx-auto">
            了解公司最新动态和行业资讯
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
                  placeholder="搜索新闻标题或内容..."
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

      <!-- 新闻列表 -->
      <section class="py-16 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- 加载状态 -->
          <div v-if="isLoading" class="text-center py-12">
            <div class="inline-flex items-center justify-center w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <p class="mt-4 text-gray-600">正在加载新闻...</p>
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
              @click="loadNews"
              class="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              重新加载
            </button>
          </div>

          <!-- 新闻网格 -->
          <div v-else-if="news.length > 0">
            <div class="mb-8">
              <p class="text-gray-600">
                找到 <span class="font-semibold">{{ pagination.total }}</span> 篇新闻
              </p>
            </div>

            <!-- 列表式布局 -->
            <div class="space-y-6">
              <article 
                v-for="article in news" 
                :key="article.id" 
                class="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div class="p-6">
                  <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <!-- 左侧内容 -->
                    <div class="flex-1">
                      <!-- 分类和日期 -->
                      <div class="flex items-center gap-3 mb-3">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {{ article.category }}
                        </span>
                        <span v-if="article.featured" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          推荐
                        </span>
                        <span class="text-sm text-gray-500">{{ formatDate(article.publishDate) }}</span>
                      </div>

                      <!-- 标题 -->
                      <h2 class="text-xl font-bold text-gray-900 mb-3 hover:text-primary-600 transition-colors">
                        <router-link :to="`/news/${article.slug}`">
                          {{ article.title }}
                        </router-link>
                      </h2>

                      <!-- 摘要 -->
                      <p class="text-gray-600 mb-4 leading-relaxed">
                        {{ article.excerpt }}
                      </p>

                      <!-- 标签和作者 -->
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="text-sm text-gray-500">作者: {{ article.author }}</span>
                        </div>
                        <div class="flex flex-wrap gap-2">
                          <span 
                            v-for="tag in article.tags.slice(0, 3)" 
                            :key="tag"
                            class="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer transition-colors"
                            @click="searchByTag(tag)"
                          >
                            #{{ tag }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- 右侧操作 -->
                    <div class="flex items-center lg:flex-col lg:items-end gap-3">
                      <router-link 
                        :to="`/news/${article.slug}`"
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 transition-colors"
                      >
                        阅读全文
                        <svg class="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                      </router-link>
                    </div>
                  </div>
                </div>
              </article>
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">暂无新闻</h3>
            <p class="text-gray-600">没有找到符合条件的新闻，请调整搜索条件</p>
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
import NewsCard from '@/components/news/NewsCard.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { useNewsStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { debounce } from '@/utils/debounce'

const route = useRoute()
const newsStore = useNewsStore()

// 响应式状态
const { news, categories, isLoading, error, pagination } = storeToRefs(newsStore)
const searchKeyword = ref('')
const selectedCategory = ref('')

// 防抖搜索
const debounceSearch = debounce(() => {
  loadNews()
}, 500)

// 加载新闻
async function loadNews(page = 1) {
  await newsStore.fetchNews({
    page,
    limit: 12,
    search: searchKeyword.value,
    category: selectedCategory.value
  })
}

// 处理分页变化
function handlePageChange(page: number) {
  loadNews(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 处理过滤变化
function handleFilterChange() {
  loadNews(1)
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
    newsStore.fetchCategories(),
    loadNews()
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
  loadNews(1)
})
</script>