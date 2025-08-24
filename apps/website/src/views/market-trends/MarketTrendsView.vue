<template>
  <div class="market-trends-page">
    <!-- 页面头部 -->
    <AppHeader />
    
    <main>
      <!-- 页面标题区 -->
      <section class="bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            市场动向
          </h1>
          <div class="w-32 h-1 bg-blue-600 mx-auto mb-8"></div>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            掌握水质检测行业最新动态，洞察市场变化趋势，为您的业务决策提供有力支持
          </p>
        </div>
      </section>

      <!-- 市场动向列表 -->
      <section class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- 筛选和搜索 -->
          <div class="mb-12 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div class="flex items-center space-x-4">
              <select 
                v-model="selectedCategory"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部分类</option>
                <option value="标准规范">标准规范</option>
                <option value="培训会议">培训会议</option>
                <option value="能力验证">能力验证</option>
                <option value="产品发布">产品发布</option>
              </select>
            </div>
            
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索市场动向..."
                class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              >
              <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <!-- 动向列表 -->
          <div class="grid gap-8">
            <article
              v-for="trend in filteredTrends"
              :key="trend.id"
              class="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer"
              @click="viewTrendDetail(trend)"
            >
              <div class="flex flex-col lg:flex-row lg:items-center gap-6">
                <!-- 动向图标或图片 -->
                <div class="flex-shrink-0">
                  <div v-if="trend.image" class="w-20 h-20 rounded-full overflow-hidden">
                    <img 
                      :src="trend.image" 
                      :alt="trend.title" 
                      class="w-full h-full object-cover"
                      @error="(e) => handleImageError(e, trend)"
                    />
                  </div>
                  <div v-else class="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                    <svg class="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                </div>

                <!-- 动向内容 -->
                <div class="flex-grow">
                  <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div class="flex-grow">
                      <div class="flex items-center gap-3 mb-3">
                        <span :class="getCategoryClass(trend.category)" class="text-xs font-medium px-3 py-1 rounded-full">
                          {{ trend.category }}
                        </span>
                        <span v-if="trend.important" class="bg-red-100 text-red-600 text-xs font-medium px-3 py-1 rounded-full">
                          重要
                        </span>
                      </div>
                      
                      <h2 class="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {{ trend.title }}
                      </h2>
                      
                      <p class="text-gray-600 line-clamp-3 mb-4">
                        {{ trend.description }}
                      </p>
                      
                      <div class="flex items-center text-sm text-gray-500">
                        <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <time>{{ formatDate(trend.date) }}</time>
                      </div>
                    </div>
                    
                    <div class="flex-shrink-0">
                      <span class="text-blue-600 hover:text-blue-700 font-medium group-hover:translate-x-1 transition-transform duration-300">
                        查看详情 →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <!-- 分页 -->
          <div class="mt-16">
            <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @page-change="handlePageChange"
            />
          </div>
        </div>
      </section>
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import Pagination from '@/components/ui/Pagination.vue'

interface MarketTrend {
  id: string
  title: string
  description: string
  date: string
  category: string
  important?: boolean
  image?: string
}

const router = useRouter()

const searchQuery = ref('')
const selectedCategory = ref('')
const currentPage = ref(1)
const itemsPerPage = 6

// 市场动向数据
const marketTrends = ref<MarketTrend[]>([
  {
    id: '1',
    title: 'HJ1001-2018 标准方法宣贯会',
    description: '针对新发布的HJ1001-2018标准方法进行详细解读和培训，帮助实验室更好地理解和执行新标准要求。该标准对水中微生物检测方法进行了重要更新，涉及检测流程、质量控制、结果判定等多个关键环节。',
    date: '2019-06-05',
    category: '标准规范',
    important: true,
    image: '/images/market-trends/20200103084118_7482.png'
  },
  {
    id: '2',
    title: '《认监委关于开展2019年国家级检验检测能力验证工作的通知》',
    description: '国家认监委发布2019年能力验证工作通知，涉及水质微生物检测等多个领域的能力验证计划。此次能力验证旨在提高实验室检测能力，确保检测结果的准确性和可靠性。',
    date: '2019-04-17',
    category: '能力验证',
    important: true,
    image: '/images/market-trends/20190417011809368.png'
  },
  {
    id: '3',
    title: '2019 HJ1001及CJT51标准宣贯会—5月6日北京',
    description: '在北京举办HJ1001和CJT51标准宣贯会，邀请行业专家进行标准解读和技术交流。会议将深入解析新标准的技术要点，分享实施经验，为实验室标准化操作提供指导。',
    date: '2019-04-17',
    category: '培训会议',
    image: '/images/market-trends/20190415035916890.jpg'
  },
  {
    id: '4',
    title: '2017年 美国爱德士公司水中微生物 能力验证全年计划',
    description: 'IDEXX公司发布2017年水中微生物检测能力验证计划，为实验室提供权威的能力验证服务。该计划覆盖多个水质检测项目，有助于实验室提升技术水平和管理质量。',
    date: '2017-02-09',
    category: '能力验证'
  },
  {
    id: '5',
    title: '两虫操作培训班——第3期开始报名',
    description: '针对水中隐孢子虫和贾第鞭毛虫检测的专业培训班开始报名，提供实操指导和技术支持。培训内容包括样品处理、显微镜观察、结果判定等关键技术环节。',
    date: '2015-08-24',
    category: '培训会议',
    image: '/images/market-trends/20150810032141374.png'
  },
  {
    id: '6',
    title: '恭贺2015年山东省水中微生物检测培训大篷车',
    description: '山东省水中微生物检测培训大篷车项目圆满成功，为当地实验室技术人员提供了专业培训和技术指导，有效提升了区域检测能力。',
    date: '2015-06-24',
    category: '培训会议',
    image: '/images/market-trends/20150729032203219.jpg'
  },
  {
    id: '7',
    title: 'IDEXX 两虫检测培训中心',
    description: 'IDEXX公司建立两虫检测培训中心，为水质检测行业提供专业的隐孢子虫和贾第鞭毛虫检测技术培训，推动行业技术水平提升。',
    date: '2015-03-27',
    category: '培训会议',
    image: '/images/market-trends/20150729094915375.png'
  },
  {
    id: '8',
    title: 'IDEXX 水中微生物国标6项实验室间比对通知函',
    description: 'IDEXX公司组织开展水中微生物检测国标6项指标的实验室间比对验证活动，旨在验证实验室检测能力，确保检测结果的一致性和准确性。',
    date: '2015-03-27',
    category: '能力验证',
    image: '/images/market-trends/20150730032542203.jpg'
  },
  {
    id: '9',
    title: '微信平台上线',
    description: '公司正式推出微信服务平台，为客户提供更加便捷的技术咨询、产品信息查询和服务支持，实现移动端一站式服务体验。',
    date: '2014-08-12',
    category: '产品发布',
    image: '/images/market-trends/20140728035056056.jpg'
  }
])

// 筛选后的动向
const filteredTrends = computed(() => {
  let trends = marketTrends.value

  // 按分类筛选
  if (selectedCategory.value) {
    trends = trends.filter(trend => trend.category === selectedCategory.value)
  }

  // 按搜索关键词筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    trends = trends.filter(trend => 
      trend.title.toLowerCase().includes(query) ||
      trend.description.toLowerCase().includes(query)
    )
  }

  // 分页
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return trends.slice(start, end)
})

// 总页数
const totalPages = computed(() => {
  let trends = marketTrends.value

  if (selectedCategory.value) {
    trends = trends.filter(trend => trend.category === selectedCategory.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    trends = trends.filter(trend => 
      trend.title.toLowerCase().includes(query) ||
      trend.description.toLowerCase().includes(query)
    )
  }

  return Math.ceil(trends.length / itemsPerPage)
})

// 获取分类样式
function getCategoryClass(category: string): string {
  const categoryClasses = {
    '标准规范': 'bg-green-100 text-green-600',
    '培训会议': 'bg-blue-100 text-blue-600',
    '能力验证': 'bg-purple-100 text-purple-600',
    '产品发布': 'bg-orange-100 text-orange-600'
  }
  return categoryClasses[category as keyof typeof categoryClasses] || 'bg-gray-100 text-gray-600'
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

// 查看动向详情
function viewTrendDetail(trend: MarketTrend) {
  router.push({
    name: 'market-trend-detail',
    params: { id: trend.id }
  })
}

// 处理分页
function handlePageChange(page: number) {
  currentPage.value = page
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 处理图片加载错误
function handleImageError(event: Event, trend: MarketTrend) {
  // 从数组中找到对应的趋势并清除图片
  const trendIndex = marketTrends.value.findIndex(t => t.id === trend.id)
  if (trendIndex !== -1) {
    marketTrends.value[trendIndex].image = undefined
  }
}

onMounted(() => {
  console.log('市场动向页面已加载')
})
</script>

<style scoped>
.market-trends-page {
  min-height: 100vh;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>