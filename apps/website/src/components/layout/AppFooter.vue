<template>
  <footer class="bg-gray-900 text-white">
    <!-- 主要内容区域 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- 公司信息 -->
        <div class="lg:col-span-2">
          <div class="mb-4">
            <div>
              <h3 class="text-xl font-bold">上海安净生物技术有限公司</h3>
              <p class="text-sm text-gray-300">Assay Biotechnology</p>
            </div>
          </div>
          
          <p class="text-gray-300 mb-6 leading-relaxed">
            专注于水中微生物检测技术及方法的研发、引进和推广，为3000+企事业单位提供专业的检测解决方案。
            我们只专注于水中微生物检测领域，我们更专心于提供系统、无忧的服务。
          </p>
          
          <!-- 联系信息 -->
          <div class="space-y-3">
            
            <div class="flex items-center space-x-3">
              <EnvelopeIcon class="h-5 w-5 text-primary-400" />
              <div>
                <p class="font-medium">邮箱</p>
                <a href="mailto:info@assaybio.cn" class="text-primary-400 hover:text-primary-300">
                  info@assaybio.cn
                </a>
              </div>
            </div>
            
            <div class="flex items-center space-x-3">
              <MapPinIcon class="h-5 w-5 text-primary-400" />
              <div>
                <p class="font-medium">地址</p>
                <p class="text-gray-300">上海市浦东新区张江高科技园区</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 快速链接 -->
        <div>
          <h4 class="text-lg font-semibold mb-4">快速链接</h4>
          <ul class="space-y-2">
            <li v-for="link in quickLinks" :key="link.name">
              <router-link
                :to="link.href"
                class="text-gray-300 hover:text-white transition-colors duration-200"
              >
                {{ link.name }}
              </router-link>
            </li>
          </ul>
        </div>

        <!-- 产品服务 -->
        <div>
          <h4 class="text-lg font-semibold mb-4">产品服务</h4>
          <ul class="space-y-2">
            <li v-for="service in services" :key="service.name">
              <router-link
                :to="service.href"
                class="text-gray-300 hover:text-white transition-colors duration-200"
              >
                {{ service.name }}
              </router-link>
            </li>
          </ul>
        </div>
      </div>

    </div>

    <!-- 版权信息 -->
    <div class="border-t border-gray-800 bg-gray-950">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <div class="mb-2 md:mb-0">
            <p>&copy; 2024 上海安净生物技术有限公司. 保留所有权利.</p>
          </div>
          
          <div class="flex items-center space-x-6">
            <a href="http://beian.miit.gov.cn" target="_blank" class="hover:text-gray-300">
              沪ICP备19033946号-1
            </a>
            <a href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=31011202012026" target="_blank" class="hover:text-gray-300">
              沪公网安备 31011202012026号
            </a>
            <router-link to="/privacy" class="hover:text-gray-300">
              隐私政策
            </router-link>
            <router-link to="/terms" class="hover:text-gray-300">
              使用条款
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 返回顶部按钮 -->
    <button
      v-show="showBackToTop"
      @click="scrollToTop"
      class="fixed bottom-8 right-8 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-30"
      title="返回顶部"
    >
      <ArrowUpIcon class="h-6 w-6" />
    </button>
  </footer>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ArrowUpIcon
} from '@heroicons/vue/24/outline'

// 快速链接
const quickLinks = ref([
  { name: '关于我们', href: '/about' },
  { name: '企业文化', href: '/about/culture' },
  { name: '发展历程', href: '/about/history' },
  { name: '荣誉资质', href: '/about/honors' },
  { name: '加入我们', href: '/careers' },
  { name: '新闻动态', href: '/news' }
])

// 产品服务
const services = ref([
  { name: '检测设备', href: '/products/equipment' },
  { name: '技术方法', href: '/products/methods' },
  { name: '耗材试剂', href: '/products/materials' },
  { name: '技术培训', href: '/services/training' },
  { name: '技术支持', href: '/services/support' },
  { name: '解决方案', href: '/solutions' }
])

// 社交媒体链接
const socialLinks = ref([
  {
    name: '微信',
    href: '#',
    icon: 'WeChatIcon' // 需要添加微信图标组件
  },
  {
    name: '微博',
    href: '#',
    icon: 'WeiboIcon' // 需要添加微博图标组件
  },
  {
    name: 'LinkedIn',
    href: '#',
    icon: 'LinkedInIcon' // 需要添加LinkedIn图标组件
  }
])

// 返回顶部功能
const showBackToTop = ref(false)

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 500
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>