<template>
  <article class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
    <!-- 新闻图片（暂时使用占位图） -->
    <div class="relative h-48 bg-gradient-to-br from-primary-50 to-secondary-50 overflow-hidden">
      <div class="flex items-center justify-center h-full">
        <div class="text-center text-gray-400">
          <svg class="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
      </div>
      
      <!-- 分类标签 -->
      <div class="absolute top-4 left-4">
        <span class="bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded-full">
          {{ article.category }}
        </span>
      </div>
      
      <!-- 特色标签 -->
      <div v-if="article.featured" class="absolute top-4 right-4">
        <span class="bg-accent-500 text-white text-xs font-medium px-3 py-1 rounded-full">
          推荐
        </span>
      </div>
    </div>

    <!-- 新闻内容 -->
    <div class="p-6">
      <div class="mb-4">
        <h3 class="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
          {{ article.title }}
        </h3>
      </div>
      
      <p class="text-gray-600 text-sm mb-4 line-clamp-3">
        {{ article.excerpt }}
      </p>

      <!-- 标签 -->
      <div v-if="article.tags.length > 0" class="mb-4">
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="tag in article.tags.slice(0, 3)" 
            :key="tag"
            class="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
          >
            #{{ tag }}
          </span>
        </div>
      </div>

      <!-- 底部信息 -->
      <div class="flex items-center justify-between pt-4 border-t border-gray-100">
        <div class="flex items-center space-x-3">
          <div class="flex items-center text-sm text-gray-500">
            <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {{ article.author }}
          </div>
          <div class="flex items-center text-sm text-gray-500">
            <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ formatDate(article.publishDate) }}
          </div>
        </div>
        
        <button
          @click="readMore"
          class="flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          阅读全文
          <svg class="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { NewsArticle } from '@/types'

interface Props {
  article: NewsArticle
}

const props = defineProps<Props>()
const router = useRouter()

// 格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 阅读更多
function readMore() {
  router.push({
    name: 'news-detail',
    params: { slug: props.article.slug }
  })
}
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