<template>
  <header class="bg-white shadow-lg sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo和公司名称 -->
        <div class="flex items-center">
          <router-link to="/" class="flex items-center space-x-3 group">
            <img 
              src="/images/logo.svg" 
              alt="上海安净生物技术有限公司"
              class="h-10 w-auto group-hover:scale-105 transition-transform duration-200"
            >
            <div class="hidden sm:block">
              <h1 class="text-xl font-bold text-gray-900">安净生物</h1>
              <p class="text-xs text-gray-500">Assay Biotechnology</p>
            </div>
          </router-link>
        </div>

        <!-- 桌面端导航 -->
        <nav class="hidden md:flex items-center space-x-8">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            class="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors duration-200 relative group"
            :class="{ 'text-primary-600': $route.path === item.href }"
          >
            {{ item.name }}
            <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
          </router-link>
        </nav>

        <!-- 语言切换 -->
        <div class="hidden lg:flex items-center space-x-4">
          <!-- 语言切换 -->
          <div class="relative">
            <button
              @click="toggleLanguageMenu"
              class="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <GlobeAltIcon class="h-4 w-4" />
              <span>{{ currentLocale === 'zh-CN' ? '中文' : 'English' }}</span>
              <ChevronDownIcon class="h-3 w-3" />
            </button>
            
            <div
              v-show="isLanguageMenuOpen"
              class="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 z-50"
            >
              <button
                @click="changeLanguage('zh-CN')"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                中文
              </button>
              <button
                @click="changeLanguage('en')"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                English
              </button>
            </div>
          </div>
        </div>

        <!-- 移动端菜单按钮 -->
        <div class="md:hidden">
          <button
            @click="toggleMobileMenu"
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <Bars3Icon v-if="!isMobileMenuOpen" class="h-6 w-6" />
            <XMarkIcon v-else class="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>

    <!-- 移动端导航菜单 -->
    <div
      v-show="isMobileMenuOpen"
      class="md:hidden bg-white border-t border-gray-200"
    >
      <div class="px-2 pt-2 pb-3 space-y-1">
        <router-link
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          @click="closeMobileMenu"
          class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors"
          :class="{ 'text-primary-600 bg-primary-50': $route.path === item.href }"
        >
          {{ item.name }}
        </router-link>
      </div>
      
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import {
  Bars3Icon,
  XMarkIcon,
  GlobeAltIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline'

const { locale } = useI18n()
const route = useRoute()

// 导航菜单
const navigation = ref([
  { name: '首页', href: '/' },
  { name: '文献资料', href: '/literature' },
  { name: '市场动向', href: '/market-trends' },
  { name: '产品中心', href: '/products' },
  { name: '关于我们', href: '/about' }
])

// 移动端菜单状态
const isMobileMenuOpen = ref(false)
const isLanguageMenuOpen = ref(false)
const currentLocale = ref(locale.value)

// 切换移动端菜单
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// 关闭移动端菜单
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

// 切换语言菜单
const toggleLanguageMenu = () => {
  isLanguageMenuOpen.value = !isLanguageMenuOpen.value
}

// 切换语言
const changeLanguage = (lang: string) => {
  locale.value = lang
  currentLocale.value = lang
  isLanguageMenuOpen.value = false
  localStorage.setItem('language', lang)
}

// 点击外部关闭菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.language-menu')) {
    isLanguageMenuOpen.value = false
  }
}

// 监听路由变化，关闭移动端菜单
const closeMenuOnRouteChange = () => {
  isMobileMenuOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // 从本地存储加载语言设置
  const savedLanguage = localStorage.getItem('language')
  if (savedLanguage) {
    locale.value = savedLanguage
    currentLocale.value = savedLanguage
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 监听路由变化
route.path && closeMenuOnRouteChange()
</script>

<style scoped>
.language-menu {
  position: relative;
}
</style>