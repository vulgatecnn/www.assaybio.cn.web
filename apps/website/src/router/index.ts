import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 导入视图组件
import HomePage from '@/views/home/HomePage.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
    meta: {
      title: '首页 - 上海安净生物技术有限公司',
      description: '专业的水中微生物检测技术服务商，为3000+企事业单位提供高质量检测服务',
      transition: 'fade',
    },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/about/AboutView.vue'),
    meta: {
      title: '关于我们 - 上海安净生物技术有限公司',
      description: '了解上海安净生物技术有限公司的企业历程、技术实力和服务理念',
      transition: 'fade',
    },
  },
  {
    path: '/services',
    name: 'services',
    component: () => import('@/views/services/ServicesView.vue'),
    meta: {
      title: '服务项目 - 上海安净生物技术有限公司',
      description: '提供专业的微生物检测、水质分析等多项检测服务',
      transition: 'fade',
    },
  },
  {
    path: '/products',
    name: 'products',
    component: () => import('@/views/products/ProductsView.vue'),
    meta: {
      title: '产品中心 - 上海安净生物技术有限公司',
      description: '展示我们的检测设备、试剂产品和解决方案',
      transition: 'fade',
    },
  },
  {
    path: '/products/:slug',
    name: 'product-detail',
    component: () => import('@/views/products/ProductDetailView.vue'),
    meta: {
      title: '产品详情 - 上海安净生物技术有限公司',
      description: '查看产品的详细信息和技术规格',
      transition: 'fade',
    },
  },
  {
    path: '/news',
    name: 'news',
    component: () => import('@/views/news/NewsView.vue'),
    meta: {
      title: '新闻动态 - 上海安净生物技术有限公司',
      description: '了解公司最新动态和行业资讯',
      transition: 'fade',
    },
  },
  {
    path: '/news/:slug',
    name: 'news-detail',
    component: () => import('@/views/news/NewsDetailView.vue'),
    meta: {
      title: '新闻详情 - 上海安净生物技术有限公司',
      description: '阅读新闻的完整内容',
      transition: 'fade',
    },
  },
  {
    path: '/literature',
    name: 'literature',
    component: () => import('@/views/literature/LiteratureView.vue'),
    meta: {
      title: '文献资料 - 上海安净生物技术有限公司',
      description: '水质检测技术相关资料、标准文件及应用指南',
      transition: 'fade',
    },
  },
  {
    path: '/documents',
    name: 'documents',
    component: () => import('@/views/documents/DocumentsView.vue'),
    meta: {
      title: '技术文献 - 上海安净生物技术有限公司',
      description: '下载技术手册、规范文件和应用指南',
      transition: 'fade',
    },
  },
  {
    path: '/market-trends',
    name: 'market-trends',
    component: () => import('@/views/market-trends/MarketTrendsView.vue'),
    meta: {
      title: '市场动向 - 上海安净生物技术有限公司',
      description: '了解水质检测行业的最新动态和市场趋势',
      transition: 'fade',
    },
  },
  {
    path: '/market-trends/:id',
    name: 'market-trend-detail',
    component: () => import('@/views/market-trends/MarketTrendDetailView.vue'),
    meta: {
      title: '市场动向详情 - 上海安净生物技术有限公司',
      description: '查看市场动向的详细信息',
      transition: 'fade',
    },
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('@/views/contact/ContactView.vue'),
    meta: {
      title: '联系我们 - 上海安净生物技术有限公司',
      description: '获取联系方式，与我们的专业团队取得联系',
      transition: 'fade',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      title: '页面未找到 - 上海安净生物技术有限公司',
      description: '抱歉，您访问的页面不存在',
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    } else {
      return { top: 0 }
    }
  },
})

// 全局路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
  
  // 设置页面描述
  if (to.meta.description) {
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', to.meta.description as string)
  }
  
  next()
})

export default router