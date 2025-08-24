<template>
  <div class="home-page">
    <!-- 页面布局 -->
    <AppHeader />
    
    <main>
      <!-- Hero Section -->
      <HeroSection />
      
      <!-- 公司简介 -->
      <CompanyIntro />
      
      <!-- 核心产品 -->
      <CoreProducts />
      
      <!-- 服务优势 -->
      <ServiceAdvantages />
      
      <!-- 成功案例 -->
      <SuccessStories />
      
      <!-- 新闻资讯 -->
      <LatestNews />
      
      <!-- 市场动向 -->
      <MarketTrends />
      
      <!-- 合作伙伴 -->
      <Partners />
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
// import { useSeoMeta } from '@vueuse/head'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import HeroSection from './components/HeroSection.vue'
import CompanyIntro from './components/CompanyIntro.vue'
import CoreProducts from './components/CoreProducts.vue'
import ServiceAdvantages from './components/ServiceAdvantages.vue'
import SuccessStories from './components/SuccessStories.vue'
import LatestNews from './components/LatestNews.vue'
import MarketTrends from './components/MarketTrends.vue'
import Partners from './components/Partners.vue'

// SEO优化 - 暂时注释，后续添加
// useSeoMeta({
//   title: '上海安净生物技术有限公司 - 专业水质微生物检测解决方案',
//   description: '上海安净生物技术有限公司专注于水中微生物检测技术及方法的研发、引进和推广，为3000+企事业单位提供专业的水质检测解决方案。我们代理美国IDEXX先进检测设备，提供全方位技术支持。',
//   keywords: '水质检测,微生物检测,IDEXX,大肠菌群检测,隐孢子虫检测,贾第鞭毛虫检测,水质分析,安净生物',
//   author: '上海安净生物技术有限公司',
//   robots: 'index,follow',
//   ogTitle: '上海安净生物技术有限公司 - 专业水质微生物检测',
//   ogDescription: '专注水中微生物检测技术，为3000+企事业单位提供专业解决方案',
//   ogImage: '/images/og-image.jpg',
//   ogUrl: 'https://www.assaybio.cn',
//   twitterCard: 'summary_large_image'
// })

onMounted(() => {
  // 页面加载完成后的初始化逻辑
  console.log('首页加载完成')
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
}
</style>