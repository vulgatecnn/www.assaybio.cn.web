<template>
  <div class="news-detail-page">
    <AppHeader />
    
    <main>
      <!-- 加载状态 -->
      <div v-if="isLoading" class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p class="mt-4 text-gray-600">正在加载新闻详情...</p>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <div class="text-red-600 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-4">新闻未找到</h1>
          <p class="text-gray-600 mb-6">{{ error }}</p>
          <router-link 
            to="/news"
            class="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            返回新闻列表
          </router-link>
        </div>
      </div>

      <!-- 新闻详情内容 -->
      <div v-else-if="article" class="py-8">
        <!-- 面包屑导航 -->
        <nav class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <ol class="flex items-center space-x-2 text-sm">
            <li>
              <router-link to="/" class="text-gray-500 hover:text-gray-700">首页</router-link>
            </li>
            <li class="text-gray-400">/</li>
            <li>
              <router-link to="/news" class="text-gray-500 hover:text-gray-700">新闻动态</router-link>
            </li>
            <li class="text-gray-400">/</li>
            <li>
              <router-link 
                :to="{ name: 'news', query: { category: article.category } }"
                class="text-gray-500 hover:text-gray-700"
              >
                {{ article.category }}
              </router-link>
            </li>
            <li class="text-gray-400">/</li>
            <li class="text-gray-900 font-medium">{{ article.title }}</li>
          </ol>
        </nav>

        <!-- 文章内容 -->
        <article class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- 文章头部 -->
          <header class="mb-10">
            <!-- 分类和特色标签 -->
            <div class="flex items-center gap-3 mb-4">
              <span class="bg-primary-100 text-primary-800 text-sm font-medium px-3 py-1 rounded-full">
                {{ article.category }}
              </span>
              <span v-if="article.featured" class="bg-accent-100 text-accent-800 text-sm font-medium px-3 py-1 rounded-full">
                推荐文章
              </span>
            </div>

            <!-- 标题 -->
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              {{ article.title }}
            </h1>

            <!-- 文章元信息 -->
            <div class="flex flex-wrap items-center gap-6 text-gray-600 border-b border-gray-200 pb-6">
              <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{{ article.author }}</span>
              </div>
              
              <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{{ formatDate(article.publishDate) }}</span>
              </div>
            </div>
          </header>

          <!-- 文章摘要 -->
          <div v-if="article.excerpt" class="bg-gray-50 border-l-4 border-primary-500 p-6 mb-10">
            <p class="text-lg text-gray-700 italic leading-relaxed">
              {{ article.excerpt }}
            </p>
          </div>

          <!-- 文章正文 -->
          <div class="prose prose-lg max-w-none">
            <div class="text-gray-900 leading-relaxed whitespace-pre-wrap">
              {{ article.content }}
            </div>
            
            <!-- 微信二维码显示（仅在微信平台相关文章中显示） -->
            <div v-if="article.slug === '微信平台上线'" class="mt-8 text-center bg-gray-50 p-6 rounded-lg">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">扫描二维码关注"水中的放大镜"</h3>
              <div class="inline-block p-4 bg-white rounded-lg shadow-sm">
                <img 
                  src="/images/logo.svg" 
                  alt="水中的放大镜微信二维码"
                  class="w-48 h-48 object-cover"
                  @error="handleImageError"
                />
              </div>
              <p class="text-sm text-gray-600 mt-3">长按识别二维码或搜索"水中的放大镜"关注我们</p>
            </div>
          </div>

          <!-- 标签 -->
          <div v-if="article.tags.length > 0" class="mt-10 pt-8 border-t border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">相关标签</h3>
            <div class="flex flex-wrap gap-3">
              <span 
                v-for="tag in article.tags" 
                :key="tag"
                class="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded-full cursor-pointer transition-colors"
                @click="searchByTag(tag)"
              >
                #{{ tag }}
              </span>
            </div>
          </div>

          <!-- 文章底部操作 -->
          <div class="mt-10 pt-8 border-t border-gray-200 flex justify-end">
            <router-link 
              to="/news"
              class="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回新闻列表
            </router-link>
          </div>
        </article>

        <!-- 相关新闻 -->
        <section class="mt-20 py-16 bg-gray-50">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-8 text-center">相关新闻</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <NewsCard 
                v-for="relatedArticle in relatedNews" 
                :key="relatedArticle.id" 
                :article="relatedArticle" 
              />
            </div>
          </div>
        </section>
      </div>
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import NewsCard from '@/components/news/NewsCard.vue'
import { useNewsStore } from '@/stores'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const newsStore = useNewsStore()

const { currentArticle: article, isLoading, error } = storeToRefs(newsStore)
const relatedNews = ref([])

// 方法
async function loadArticle() {
  const slug = route.params.slug as string
  if (!slug) {
    router.push('/news')
    return
  }

  const result = await newsStore.fetchNewsBySlug(slug)
  if (result) {
    // 更新页面SEO信息
    document.title = result.seo.title
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', result.seo.description)
    }
    
    // 加载相关新闻
    await loadRelatedNews(result.category)
  }
}

async function loadRelatedNews(category: string) {
  try {
    await newsStore.fetchNews({ category, limit: 3 })
    // 排除当前文章
    relatedNews.value = newsStore.news.filter(a => a.id !== article.value?.id)
  } catch (err) {
    console.error('加载相关新闻失败:', err)
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function searchByTag(tag: string) {
  router.push({
    name: 'news',
    query: { search: tag }
  })
}

function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
  // 可以添加一个占位符或错误提示
}

// 生命周期
onMounted(() => {
  loadArticle()
})

// 监听路由参数变化
watch(() => route.params.slug, (newSlug, oldSlug) => {
  if (newSlug && newSlug !== oldSlug) {
    newsStore.resetCurrentArticle()
    loadArticle()
  }
})
</script>

<style scoped>
.prose {
  font-size: 1.125rem;
  line-height: 1.875;
}

.prose p {
  margin-bottom: 1.5rem;
}

.prose h1, .prose h2, .prose h3 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #111827;
}

.prose h1 {
  font-size: 1.875rem;
}

.prose h2 {
  font-size: 1.5rem;
}

.prose h3 {
  font-size: 1.25rem;
}
</style>