<template>
  <div class="literature-page">
    <AppHeader />
    
    <main>
      <!-- 页面头部 -->
      <section class="bg-primary-900 text-white py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-6">文献资料</h1>
          <p class="text-xl text-primary-200 max-w-3xl mx-auto">
            水质检测技术相关资料、标准文件及应用指南
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
                  placeholder="搜索文献标题或关键词..."
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
                <option value="标准文件">标准文件</option>
                <option value="技术指南">技术指南</option>
                <option value="应用案例">应用案例</option>
                <option value="研究报告">研究报告</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <!-- 文献列表 -->
      <section class="py-16 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- 加载状态 -->
          <div v-if="isLoading" class="text-center py-12">
            <div class="inline-flex items-center justify-center w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <p class="mt-4 text-gray-600">正在加载文献资料...</p>
          </div>

          <!-- 文献列表 -->
          <div v-else-if="filteredLiterature.length > 0" class="space-y-6">
            <div class="mb-8">
              <p class="text-gray-600">
                找到 <span class="font-semibold">{{ filteredLiterature.length }}</span> 份文献资料
              </p>
            </div>

            <!-- 列表式布局 -->
            <div class="space-y-6">
              <article 
                v-for="item in filteredLiterature" 
                :key="item.id" 
                class="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div class="p-6">
                  <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <!-- 左侧内容 -->
                    <div class="flex-1">
                      <!-- 分类和类型 -->
                      <div class="flex items-center gap-3 mb-3">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {{ item.category }}
                        </span>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {{ item.type }}
                        </span>
                        <span class="text-sm text-gray-500">{{ item.publishDate }}</span>
                      </div>

                      <!-- 标题 -->
                      <h2 class="text-xl font-bold text-gray-900 mb-3">
                        {{ item.title }}
                      </h2>

                      <!-- 描述 -->
                      <p class="text-gray-600 mb-4 leading-relaxed">
                        {{ item.description }}
                      </p>

                      <!-- 标签和信息 -->
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                          <span class="text-sm text-gray-500">文件大小: {{ item.fileSize }}</span>
                          <span class="text-sm text-gray-500">格式: {{ item.format }}</span>
                        </div>
                        <div class="flex flex-wrap gap-2">
                          <span 
                            v-for="tag in item.tags.slice(0, 3)" 
                            :key="tag"
                            class="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600"
                          >
                            #{{ tag }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- 右侧操作 -->
                    <div class="flex items-center lg:flex-col lg:items-end gap-3">
                      <a 
                        :href="item.downloadUrl"
                        :download="item.filename"
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                      >
                        <svg class="mr-2 -ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                        下载
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="text-center py-12">
            <div class="text-gray-400 mb-4">
              <svg class="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">暂无文献资料</h3>
            <p class="text-gray-600">没有找到符合条件的文献资料，请调整搜索条件</p>
          </div>
        </div>
      </section>

      <!-- 相关信息 -->
      <section class="py-16 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">技术支持</h2>
            <div class="w-24 h-1 bg-primary-600 mx-auto mb-6"></div>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto">
              如需更多技术文献或专业咨询，请联系我们的技术团队
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="text-center bg-white p-8 rounded-lg shadow-sm">
              <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">邮件咨询</h3>
              <p class="text-gray-600 text-sm mb-4">技术问题专业解答</p>
              <a href="mailto:info@assaybio.cn" class="text-primary-600 font-medium hover:text-primary-700">
                info@assaybio.cn
              </a>
            </div>

            <div class="text-center bg-white p-8 rounded-lg shadow-sm">
              <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">电话咨询</h3>
              <p class="text-gray-600 text-sm mb-4">即时技术支持</p>
              <a href="tel:021-6449-3336" class="text-primary-600 font-medium hover:text-primary-700">
                021-6449-3336
              </a>
            </div>

            <div class="text-center bg-white p-8 rounded-lg shadow-sm">
              <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">定制文献</h3>
              <p class="text-gray-600 text-sm mb-4">按需提供专业资料</p>
              <span class="text-primary-600 font-medium">专业定制服务</span>
            </div>
          </div>
        </div>
      </section>
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { debounce } from '@/utils/debounce'

// 响应式状态
const isLoading = ref(false)
const searchKeyword = ref('')
const selectedCategory = ref('')

// 模拟文献数据
const literature = ref([
  {
    id: 'lit-001',
    title: '水质微生物检测国家标准 GB/T 5750.12-2006',
    description: '生活饮用水标准检验方法 微生物指标检测标准，包括总大肠菌群、耐热大肠菌群、大肠埃希氏菌、菌落总数等检测方法。',
    category: '标准文件',
    type: 'PDF',
    format: 'PDF',
    fileSize: '2.3MB',
    filename: 'GB_T_5750.12-2006.pdf',
    downloadUrl: '/documents/GB_T_5750.12-2006.pdf',
    publishDate: '2006-12-01',
    tags: ['国标', '微生物', '水质检测', '标准方法']
  },
  {
    id: 'lit-002',
    title: 'IDEXX DST固定底物技术应用指南',
    description: '详细介绍IDEXX DST（定义底物技术）在大肠菌群和菌落总数检测中的应用原理、操作步骤及质量控制要点。',
    category: '技术指南',
    type: 'PDF',
    format: 'PDF',
    fileSize: '1.8MB',
    filename: 'IDEXX_DST_Guide.pdf',
    downloadUrl: '/documents/IDEXX_DST_Guide.pdf',
    publishDate: '2023-05-15',
    tags: ['IDEXX', 'DST技术', '大肠菌群', '操作指南']
  },
  {
    id: 'lit-003',
    title: '隐孢子虫和贾第鞭毛虫检测技术规范',
    description: '基于美国IDEXX Filta-Max xpress检测系统的两虫检测技术规范，包括样品处理、检测流程和结果判定标准。',
    category: '技术指南',
    type: 'PDF',
    format: 'PDF',
    fileSize: '3.1MB',
    filename: 'Crypto_Giardia_Detection.pdf',
    downloadUrl: '/documents/Crypto_Giardia_Detection.pdf',
    publishDate: '2023-08-20',
    tags: ['隐孢子虫', '贾第鞭毛虫', 'Filta-Max', '检测技术']
  },
  {
    id: 'lit-004',
    title: '水厂微生物检测实验室建设方案',
    description: '针对自来水厂、污水处理厂等水处理设施的微生物检测实验室设计、设备配置和人员配置的综合方案。',
    category: '应用案例',
    type: 'DOC',
    format: 'DOCX',
    fileSize: '4.2MB',
    filename: 'Lab_Construction_Plan.docx',
    downloadUrl: '/documents/Lab_Construction_Plan.docx',
    publishDate: '2023-10-12',
    tags: ['实验室建设', '设备配置', '水厂', '微生物检测']
  },
  {
    id: 'lit-005',
    title: '2023年水质微生物检测技术发展报告',
    description: '总结分析2023年国内外水质微生物检测技术的最新发展趋势、技术创新和应用前景。',
    category: '研究报告',
    type: 'PDF',
    format: 'PDF',
    fileSize: '5.7MB',
    filename: 'Tech_Development_Report_2023.pdf',
    downloadUrl: '/documents/Tech_Development_Report_2023.pdf',
    publishDate: '2024-01-10',
    tags: ['技术发展', '行业报告', '创新技术', '发展趋势']
  }
])

// 计算过滤后的文献
const filteredLiterature = computed(() => {
  let filtered = literature.value

  // 按分类过滤
  if (selectedCategory.value) {
    filtered = filtered.filter(item => item.category === selectedCategory.value)
  }

  // 按搜索关键词过滤
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.title.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword) ||
      item.tags.some(tag => tag.toLowerCase().includes(keyword))
    )
  }

  return filtered
})

// 防抖搜索
const debounceSearch = debounce(() => {
  // 搜索逻辑已在计算属性中处理
}, 500)

// 处理过滤变化
function handleFilterChange() {
  // 过滤逻辑已在计算属性中处理
}

// 组件挂载
onMounted(() => {
  // 模拟加载延迟
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
  }, 800)
})
</script>