<template>
  <section class="py-20 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          最新资讯
        </h2>
        <div class="w-24 h-1 bg-primary-600 mx-auto mb-6"></div>
        <p class="text-xl text-gray-600">
          了解行业动态和公司最新消息
        </p>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="inline-flex items-center justify-center w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p class="mt-4 text-gray-600">正在加载新闻...</p>
      </div>

      <!-- 新闻网格 -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <article
          v-for="article in featuredNews"
          :key="article.id"
          class="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer"
          @click="viewArticle(article)"
        >
          <!-- 新闻图片占位符 -->
          <div class="h-48 bg-gradient-to-br from-primary-50 to-secondary-50 relative flex items-center justify-center">
            <div class="text-gray-400">
              <svg class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div class="absolute top-4 left-4">
              <span class="bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                {{ article.category }}
              </span>
            </div>
            <div v-if="article.featured" class="absolute top-4 right-4">
              <span class="bg-accent-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                推荐
              </span>
            </div>
          </div>
          
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
              {{ article.title }}
            </h3>
            <p class="text-gray-600 text-sm mb-4 line-clamp-3">
              {{ article.excerpt }}
            </p>
            
            <div class="flex items-center justify-between">
              <div class="flex items-center text-sm text-gray-500">
                <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <time>{{ formatDate(article.publishDate) }}</time>
              </div>
              
              <span class="text-primary-600 hover:text-primary-700 text-sm font-medium group-hover:translate-x-1 transition-transform duration-300">
                阅读更多 →
              </span>
            </div>
          </div>
        </article>
      </div>

      <div class="text-center mt-12">
        <router-link
          to="/news"
          class="inline-flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          查看更多资讯
          <svg class="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNewsStore } from '@/stores'
import { storeToRefs } from 'pinia'
import type { NewsArticle } from '@/types'

const router = useRouter()
const newsStore = useNewsStore()
const { featuredNews, isLoading } = storeToRefs(newsStore)

// 查看文章详情
function viewArticle(article: NewsArticle) {
  router.push({
    name: 'news-detail',
    params: { slug: article.slug }
  })
}

// 格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 组件挂载时加载特色新闻
onMounted(() => {
  newsStore.fetchFeaturedNews(3)
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>