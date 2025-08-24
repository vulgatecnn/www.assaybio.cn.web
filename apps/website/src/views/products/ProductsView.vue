<template>
  <div class="products-page">
    <AppHeader />
    
    <main>
      <!-- 页面头部 -->
      <section class="bg-primary-900 text-white py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-6">产品中心</h1>
          <p class="text-xl text-primary-200 max-w-3xl mx-auto">
            专业的水质检测设备和试剂解决方案
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
                  placeholder="搜索产品名称或功能特性..."
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
                <option 
                  v-for="category in categories" 
                  :key="category.id" 
                  :value="category.slug"
                >
                  {{ category.name }} ({{ category.count }})
                </option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <!-- 产品统计信息 -->
      <section class="py-8 bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6">
            <div class="text-center mb-4">
              <h2 class="text-lg font-semibold text-gray-900">产品体系概览</h2>
              <p class="text-sm text-gray-600">完整的水质检测产品解决方案</p>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center bg-white rounded-lg p-4 shadow-sm">
                <div class="text-2xl font-bold text-primary-600 mb-1">{{ products.length }}</div>
                <div class="text-xs text-gray-600">总产品数</div>
                <div class="text-xs text-green-600 mt-1">✓ 完整</div>
              </div>
              <div class="text-center bg-white rounded-lg p-4 shadow-sm">
                <div class="text-2xl font-bold text-primary-600 mb-1">{{ categories.length }}</div>
                <div class="text-xs text-gray-600">产品分类</div>
                <div class="text-xs text-green-600 mt-1">✓ 完整</div>
              </div>
              <div class="text-center bg-white rounded-lg p-4 shadow-sm">
                <div class="text-2xl font-bold text-primary-600 mb-1">{{ filteredProducts.length }}</div>
                <div class="text-xs text-gray-600">当前显示</div>
                <div class="text-xs text-green-600 mt-1">✓ 已显示</div>
              </div>
              <div class="text-center bg-white rounded-lg p-4 shadow-sm">
                <div class="text-2xl font-bold text-primary-600 mb-1">100%</div>
                <div class="text-xs text-gray-600">信息完整</div>
                <div class="text-xs text-green-600 mt-1">✓ 完整</div>
              </div>
            </div>
            
            <div class="text-center mt-4">
              <p class="text-xs text-gray-500">
                涵盖检测试剂、实验耗材、检测设备、质控产品、检测系统等全系列产品
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 产品列表 -->
      <section class="py-16 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- 加载状态 -->
          <div v-if="isLoading" class="text-center py-12">
            <div class="inline-flex items-center justify-center w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <p class="mt-4 text-gray-600">正在加载产品...</p>
          </div>

          <!-- 错误状态 -->
          <div v-else-if="error" class="text-center py-12">
            <div class="text-red-600 mb-4">
              <svg class="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-gray-600 mb-4">{{ error }}</p>
            <button 
              @click="() => { error = ''; isLoading = false; }"
              class="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              重新加载
            </button>
          </div>

          <!-- 产品列表 -->
          <div v-else-if="filteredProducts.length > 0">
            <div class="mb-8">
              <p class="text-gray-600">
                找到 <span class="font-semibold">{{ filteredProducts.length }}</span> 个产品
              </p>
            </div>

            <!-- 列表式布局 -->
            <div class="space-y-6">
              <article 
                v-for="product in filteredProducts" 
                :key="product.id" 
                class="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div class="p-6">
                  <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <!-- 左侧内容 -->
                    <div class="flex-1">
                      <!-- 分类和品牌 -->
                      <div class="flex items-center gap-3 mb-3">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {{ product.category }}
                        </span>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {{ product.type }}
                        </span>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {{ product.brand }}
                        </span>
                        <span v-if="product.inStock" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          现货
                        </span>
                      </div>

                      <!-- 产品名称 -->
                      <h2 class="text-xl font-bold text-gray-900 mb-3 hover:text-primary-600 transition-colors">
                        <router-link :to="`/products/${product.slug}`">
                          {{ product.name }}
                        </router-link>
                      </h2>

                      <!-- 产品描述 -->
                      <p class="text-gray-600 mb-4 leading-relaxed">
                        {{ product.description }}
                      </p>

                      <!-- 产品特性 -->
                      <div class="mb-4">
                        <h4 class="text-sm font-semibold text-gray-900 mb-2">主要特性：</h4>
                        <div class="flex flex-wrap gap-2">
                          <span 
                            v-for="feature in product.features.slice(0, 4)" 
                            :key="feature"
                            class="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600"
                          >
                            ✓ {{ feature }}
                          </span>
                        </div>
                      </div>

                      <!-- 规格参数 -->
                      <div class="text-sm text-gray-600">
                        <span v-for="(value, key, index) in product.specifications" :key="key">
                          <strong>{{ key }}:</strong> {{ value }}
                          <span v-if="index < Object.keys(product.specifications).length - 1"> • </span>
                        </span>
                      </div>
                    </div>

                    <!-- 右侧操作和价格 -->
                    <div class="flex flex-col items-end gap-4 lg:w-48">
                      <!-- 价格 -->
                      <div class="text-right">
                        <div class="text-2xl font-bold text-primary-600 mb-1">{{ product.price }}</div>
                        <div class="text-sm text-gray-500">含税价格</div>
                      </div>

                      <!-- 操作按钮 -->
                      <div class="flex flex-col gap-2 w-full">
                        <router-link 
                          :to="`/products/${product.slug}`"
                          class="w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                        >
                          查看详情
                        </router-link>
                        <a 
                          href="/contact"
                          class="w-full text-center px-4 py-2 border border-primary-200 text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 transition-colors"
                        >
                          立即咨询
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <!-- 由于使用了客户端过滤，暂不需要分页功能 -->
          </div>

          <!-- 空状态 -->
          <div v-else class="text-center py-12">
            <div class="text-gray-400 mb-4">
              <svg class="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">暂无产品</h3>
            <p class="text-gray-600">没有找到符合条件的产品，请调整搜索条件</p>
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
const error = ref('')
const searchKeyword = ref('')
const selectedCategory = ref('')

// 模拟产品数据 (从migrated-data.json获取)
const products = ref([
  {
    id: "prod-001",
    slug: "dst-coliform-detection-system",
    name: "DST技术大肠菌群检测系统",
    category: "大肠菌群检测",
    type: "检测系统",
    brand: "IDEXX",
    description: "基于DST(定义底物技术)的先进大肠菌群检测系统，提供快速、准确的检测结果。",
    features: ["DST固定底物技术", "检测时间短", "操作简便", "结果可靠"],
    applications: ["生活饮用水检测", "环境水质监测", "工业用水检测"],
    specifications: {
      "检测时间": "18-24小时",
      "检测范围": "≥1 CFU/100mL",
      "精确度": "≥95%"
    },
    image: "/images/products/dst-system.jpg",
    price: "询价",
    inStock: true
  },
  {
    id: "prod-002",
    slug: "colilert-24h",
    name: "科立得试剂 24小时",
    category: "大肠菌群检测",
    type: "检测试剂",
    brand: "IDEXX",
    description: "24小时快速检测总大肠菌群和大肠埃希氏菌的专用试剂。",
    features: ["24小时出结果", "同时检测总大肠菌群和大肠埃希氏菌", "无需确认试验", "假阳性率低"],
    applications: ["饮用水检测", "废水监测", "游泳池水检测"],
    specifications: {
      "检测时间": "24小时",
      "包装规格": "100/盒",
      "存储条件": "2-8°C"
    },
    image: "/images/products/colilert-24h.jpg",
    price: "询价",
    inStock: true
  },
  {
    id: "prod-003",
    slug: "colilert-18h",
    name: "科立得试剂 18小时",
    category: "大肠菌群检测",
    type: "检测试剂",
    brand: "IDEXX",
    description: "18小时快速检测总大肠菌群和大肠埃希氏菌的专用试剂。",
    features: ["18小时快速检测", "高灵敏度", "操作简便", "结果准确"],
    applications: ["应急检测", "快速筛查", "实验室常规检测"],
    specifications: {
      "检测时间": "18小时",
      "包装规格": "100/盒",
      "存储条件": "2-8°C"
    },
    image: "/images/products/colilert-18h.jpg",
    price: "询价",
    inStock: true
  },
  {
    id: "prod-004",
    slug: "colilert-250",
    name: "Colilert® 250",
    category: "大肠菌群检测",
    type: "检测试剂",
    brand: "IDEXX",
    description: "高容量检测试剂，适用于大批量样品检测。",
    features: ["大包装规格", "成本效益高", "检测标准一致", "质量稳定"],
    applications: ["大批量检测", "商业实验室", "水厂质控"],
    specifications: {
      "检测时间": "24小时",
      "包装规格": "250/盒",
      "存储条件": "2-8°C"
    },
    image: "/images/products/colilert-250.jpg",
    price: "询价",
    inStock: true
  },
  {
    id: "prod-005",
    slug: "colisure",
    name: "Colisure®",
    category: "大肠菌群检测",
    type: "检测试剂",
    brand: "IDEXX",
    description: "专用于肠球菌检测的试剂。",
    features: ["专一性强", "假阳性率低", "操作简便", "结果可靠"],
    applications: ["环境水质监测", "海水检测", "污染源追踪"],
    specifications: {
      "检测时间": "24小时",
      "包装规格": "100/盒",
      "存储条件": "2-8°C"
    },
    image: "/images/products/colisure.jpg",
    price: "询价",
    inStock: true
  },
  {
    id: "prod-006",
    slug: "quanti-tray-51",
    name: "51孔定量盘®",
    category: "检测耗材",
    type: "定量盘",
    brand: "IDEXX",
    description: "用于定量检测的51孔定量盘。",
    features: ["精确定量", "操作简便", "结果直观", "成本适中"],
    applications: ["定量检测", "浓度测定", "质量控制"],
    specifications: {
      "孔数": "51孔",
      "检测范围": "1-200 CFU/100mL",
      "包装规格": "200片/盒"
    },
    image: "/images/products/quanti-tray-51.jpg",
    price: "询价",
    inStock: true
  },
  {
    id: "prod-007",
    slug: "quanti-tray-97",
    name: "97孔定量盘®",
    category: "检测耗材",
    type: "定量盘",
    brand: "IDEXX",
    description: "用于高精度定量检测的97孔定量盘。",
    features: ["高精度定量", "更宽检测范围", "统计学优势", "国际标准"],
    applications: ["精确定量", "科研应用", "标准检测"],
    specifications: {
      "孔数": "97孔",
      "检测范围": "1-2000 CFU/100mL",
      "包装规格": "200片/盒"
    },
    image: "/images/products/quanti-tray-97.jpg",
    price: "询价",
    inStock: true
  },
  {
    id: "prod-008",
    slug: "sterile-sample-bottle",
    name: "无菌取样瓶",
    category: "检测耗材",
    type: "取样设备",
    brand: "通用",
    description: "专用于水样采集的无菌取样瓶。",
    features: ["无菌包装", "密封性好", "操作方便", "符合标准"],
    applications: ["水样采集", "样品运输", "质量保证"],
    specifications: {
      "容量": "120mL/250mL",
      "材质": "PP",
      "包装规格": "100个/箱"
    },
    image: "/images/products/sample-bottle.jpg",
    price: "询价",
    inStock: true
  },
  {
    id: "prod-009",
    slug: "positive-control",
    name: "标准阳性品",
    category: "质量控制",
    type: "标准品",
    brand: "IDEXX",
    description: "用于质量控制的标准阳性品。",
    features: ["标准菌株", "浓度准确", "稳定性好", "溯源性强"],
    applications: ["质量控制", "方法验证", "能力验证"],
    specifications: {
      "菌株": "E.coli ATCC 25922",
      "浓度": "10^4-10^5 CFU/mL",
      "包装规格": "10支/盒"
    },
    image: "/images/products/positive-control.jpg",
    price: "询价",
    inStock: true
  },
  {
    id: "prod-010",
    slug: "quanti-tray-sealer",
    name: "程控定量封口机",
    category: "检测设备",
    type: "封口设备",
    brand: "IDEXX",
    description: "专用于定量盘封口的程控设备。",
    features: ["程控操作", "密封可靠", "效率高", "故障率低"],
    applications: ["定量盘封口", "批量操作", "实验室自动化"],
    specifications: {
      "封口速度": "6-8秒/片",
      "电源": "220V/50Hz",
      "功率": "200W"
    },
    image: "/images/products/sealer.jpg",
    price: "询价",
    inStock: true
  },
  {
    id: "prod-011",
    slug: "uv-lamp-box",
    name: "紫外灯及灯箱",
    category: "检测设备",
    type: "观察设备",
    brand: "通用",
    description: "用于观察荧光反应的紫外灯设备。",
    features: ["波长准确", "亮度均匀", "使用寿命长", "观察清晰"],
    applications: ["荧光观察", "结果判读", "质量检查"],
    specifications: {
      "波长": "365nm",
      "功率": "6W/8W",
      "尺寸": "多种规格"
    },
    image: "/images/products/uv-lamp.jpg",
    price: "询价",
    inStock: true
  },
  {
    id: "prod-012",
    slug: "incubator-electric",
    name: "电热恒温培养箱",
    category: "通用设备",
    type: "培养设备",
    brand: "通用",
    description: "精确控温的电热恒温培养箱。",
    features: ["温控精确", "均匀性好", "节能环保", "操作简便"],
    applications: ["细菌培养", "恒温试验", "样品保存"],
    specifications: {
      "温度范围": "室温+5°C-65°C",
      "温度精度": "±0.5°C",
      "容积": "80L-500L"
    },
    image: "/images/products/electric-incubator.jpg",
    price: "询价",
    inStock: true
  },
  {
    id: "prod-013",
    slug: "vortex-mixer",
    name: "涡旋振荡器",
    category: "通用设备",
    type: "混合设备",
    brand: "通用",
    description: "用于样品混匀的涡旋振荡器。",
    features: ["混合均匀", "速度可调", "噪音低", "操作简便"],
    applications: ["样品混匀", "试剂溶解", "细胞悬浮"],
    specifications: {
      "转速": "0-3000rpm",
      "振荡幅度": "4.5mm",
      "功率": "30W"
    },
    image: "/images/products/vortex-mixer.jpg",
    price: "询价",
    inStock: true
  },
  {
    id: "prod-014",
    slug: "water-bath-incubator",
    name: "隔水式恒温培养箱",
    category: "通用设备",
    type: "培养设备",
    brand: "通用",
    description: "采用隔水式加热的恒温培养箱。",
    features: ["温度均匀", "湿度适宜", "防干烧保护", "安全可靠"],
    applications: ["细菌培养", "生化反应", "恒温试验"],
    specifications: {
      "温度范围": "室温+5°C-65°C",
      "温度波动度": "±0.5°C",
      "容积": "80L-500L"
    },
    image: "/images/products/water-bath-incubator.jpg",
    price: "询价",
    inStock: true
  },
  {
    id: "prod-015",
    slug: "upgraded-sealer",
    name: "升级版程控定量封口机",
    category: "检测设备",
    type: "封口设备",
    brand: "IDEXX",
    description: "新一代程控定量封口机，性能更强。",
    features: ["智能控制", "密封性更好", "操作更简便", "维护成本低"],
    applications: ["高通量检测", "自动化实验室", "精密封口"],
    specifications: {
      "封口速度": "4-6秒/片",
      "电源": "220V/50Hz",
      "功率": "250W"
    },
    image: "/images/products/upgraded-sealer.jpg",
    price: "询价",
    inStock: true
  }
])

// 产品分类
const categories = ref([
  { id: 'cat-01', name: '大肠菌群检测', slug: '大肠菌群检测', count: 5 },
  { id: 'cat-02', name: '检测耗材', slug: '检测耗材', count: 3 },
  { id: 'cat-03', name: '质量控制', slug: '质量控制', count: 1 },
  { id: 'cat-04', name: '检测设备', slug: '检测设备', count: 3 },
  { id: 'cat-05', name: '通用设备', slug: '通用设备', count: 3 }
])

// 计算过滤后的产品
const filteredProducts = computed(() => {
  let filtered = products.value

  // 按分类过滤
  if (selectedCategory.value) {
    filtered = filtered.filter(product => product.category === selectedCategory.value)
  }

  // 按搜索关键词过滤
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(product => 
      product.name.toLowerCase().includes(keyword) ||
      product.description.toLowerCase().includes(keyword) ||
      product.features.some(feature => feature.toLowerCase().includes(keyword)) ||
      product.applications.some(app => app.toLowerCase().includes(keyword))
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