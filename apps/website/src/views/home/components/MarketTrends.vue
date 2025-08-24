<template>
  <section class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          市场动向
        </h2>
        <div class="w-24 h-1 bg-primary-600 mx-auto mb-6"></div>
        <p class="text-xl text-gray-600">
          掌握行业趋势，洞察市场变化
        </p>
      </div>

      <!-- 市场动向列表 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <article
          v-for="trend in marketTrends"
          :key="trend.id"
          class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer"
          @click="viewTrend(trend)"
        >
          <!-- 动向图标 -->
          <div class="h-48 bg-gradient-to-br from-blue-50 to-indigo-50 relative flex items-center justify-center">
            <div class="text-blue-400">
              <svg class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div class="absolute top-4 left-4">
              <span class="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                市场动向
              </span>
            </div>
            <div v-if="trend.important" class="absolute top-4 right-4">
              <span class="bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                重要
              </span>
            </div>
          </div>
          
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
              {{ trend.title }}
            </h3>
            <p class="text-gray-600 text-sm mb-4 line-clamp-3">
              {{ trend.description }}
            </p>
            
            <div class="flex items-center justify-between">
              <div class="flex items-center text-sm text-gray-500">
                <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <time>{{ formatDate(trend.date) }}</time>
              </div>
              
              <span class="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:translate-x-1 transition-transform duration-300">
                了解详情 →
              </span>
            </div>
          </div>
        </article>
      </div>

      <div class="text-center mt-12">
        <a
          href="#"
          class="inline-flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          @click.prevent="viewAllTrends"
        >
          查看更多动向
          <svg class="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface MarketTrend {
  id: string
  title: string
  description: string
  date: string
  important?: boolean
}

const marketTrends = ref<MarketTrend[]>([
  {
    id: '1',
    title: 'HJ1001-2018 标准方法宣贯会',
    description: '针对新发布的HJ1001-2018标准方法进行详细解读和培训，帮助实验室更好地理解和执行新标准要求。',
    date: '2019-06-05',
    important: true
  },
  {
    id: '2',
    title: '《认监委关于开展2019年国家级检验检测能力验证工作的通知》',
    description: '国家认监委发布2019年能力验证工作通知，涉及水质微生物检测等多个领域的能力验证计划。',
    date: '2019-04-17',
    important: true
  },
  {
    id: '3',
    title: '2019 HJ1001及CJT51标准宣贯会—5月6日北京',
    description: '在北京举办HJ1001和CJT51标准宣贯会，邀请行业专家进行标准解读和技术交流。',
    date: '2019-04-17'
  },
  {
    id: '4',
    title: '2017年 美国爱德士公司水中微生物 能力验证全年计划',
    description: 'IDEXX公司发布2017年水中微生物检测能力验证计划，为实验室提供权威的能力验证服务。',
    date: '2017-02-09'
  },
  {
    id: '5',
    title: '两虫操作培训班——第3期开始报名',
    description: '针对水中隐孢子虫和贾第鞭毛虫检测的专业培训班开始报名，提供实操指导和技术支持。',
    date: '2015-08-24'
  },
  {
    id: '6',
    title: 'IDEXX 水中微生物国标6项实验室间比对通知函',
    description: 'IDEXX公司组织开展水中微生物检测国标6项指标的实验室间比对验证活动。',
    date: '2015-03-27'
  }
])

// 查看详情
function viewTrend(trend: MarketTrend) {
  console.log('查看市场动向详情:', trend.title)
  // 这里可以添加跳转到详情页面的逻辑
}

// 查看所有动向
function viewAllTrends() {
  console.log('查看所有市场动向')
  // 这里可以添加跳转到市场动向页面的逻辑
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

onMounted(() => {
  console.log('市场动向组件已加载')
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