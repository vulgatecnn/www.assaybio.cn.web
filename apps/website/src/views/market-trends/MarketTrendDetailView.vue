<template>
  <div class="market-trend-detail-page">
    <!-- 页面头部 -->
    <AppHeader />
    
    <main>
      <!-- 面包屑导航 -->
      <section class="bg-gray-50 py-4">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav class="flex items-center space-x-2 text-sm text-gray-600">
            <router-link to="/" class="hover:text-primary-600 transition-colors">首页</router-link>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <router-link to="/market-trends" class="hover:text-primary-600 transition-colors">市场动向</router-link>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <span class="text-gray-900">详情</span>
          </nav>
        </div>
      </section>

      <!-- 动向详情 -->
      <section v-if="trendDetail" class="py-16">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- 动向头部信息 -->
          <div class="mb-8">
            <div class="flex flex-wrap items-center gap-3 mb-4">
              <span :class="getCategoryClass(trendDetail.category)" class="text-sm font-medium px-4 py-1 rounded-full">
                {{ trendDetail.category }}
              </span>
              <span v-if="trendDetail.important" class="bg-red-100 text-red-600 text-sm font-medium px-4 py-1 rounded-full">
                重要
              </span>
            </div>
            
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {{ trendDetail.title }}
            </h1>
            
            <div class="flex items-center text-gray-600 space-x-6">
              <div class="flex items-center">
                <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <time>{{ formatDate(trendDetail.date) }}</time>
              </div>
              
              <div class="flex items-center">
                <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{{ trendDetail.views || '128' }} 浏览</span>
              </div>
            </div>
          </div>

          <!-- 动向封面图 -->
          <div class="mb-8 rounded-xl overflow-hidden">
            <div v-if="trendDetail.image" class="h-64 md:h-80 relative">
              <img 
                :src="trendDetail.image" 
                :alt="trendDetail.title" 
                class="w-full h-full object-cover"
                @error="handleImageError"
              />
              <div class="absolute inset-0 bg-black bg-opacity-20 flex items-end">
                <div class="p-6 text-white">
                  <p class="text-sm font-medium opacity-90">{{ trendDetail.category }}</p>
                </div>
              </div>
            </div>
            <div v-else class="h-64 md:h-80 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
              <div class="text-center">
                <div class="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <p class="text-gray-600">{{ trendDetail.category }}</p>
              </div>
            </div>
          </div>

          <!-- 动向内容 -->
          <div class="prose prose-lg max-w-none">
            <div class="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-r-lg">
              <h3 class="text-lg font-semibold text-blue-900 mb-2">概述</h3>
              <p class="text-blue-800 leading-relaxed">{{ trendDetail.description }}</p>
            </div>

            <!-- 详细内容 -->
            <div class="space-y-6 text-gray-700 leading-relaxed">
              <div v-html="trendDetail.content"></div>
            </div>

            <!-- 相关信息 -->
            <div v-if="trendDetail.details" class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div v-if="trendDetail.details.organizer" class="bg-gray-50 p-6 rounded-lg">
                <h4 class="font-semibold text-gray-900 mb-2">主办方</h4>
                <p class="text-gray-600">{{ trendDetail.details.organizer }}</p>
              </div>
              
              <div v-if="trendDetail.details.location" class="bg-gray-50 p-6 rounded-lg">
                <h4 class="font-semibold text-gray-900 mb-2">地点</h4>
                <p class="text-gray-600">{{ trendDetail.details.location }}</p>
              </div>
              
              <div v-if="trendDetail.details.participants" class="bg-gray-50 p-6 rounded-lg">
                <h4 class="font-semibold text-gray-900 mb-2">参与对象</h4>
                <p class="text-gray-600">{{ trendDetail.details.participants }}</p>
              </div>
              
              <div v-if="trendDetail.details.contact" class="bg-gray-50 p-6 rounded-lg">
                <h4 class="font-semibold text-gray-900 mb-2">联系方式</h4>
                <p class="text-gray-600">{{ trendDetail.details.contact }}</p>
              </div>
            </div>

            <!-- 关键信息点 -->
            <div v-if="trendDetail.keyPoints" class="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl">
              <h3 class="text-xl font-semibold text-gray-900 mb-4">关键信息</h3>
              <ul class="space-y-3">
                <li v-for="point in trendDetail.keyPoints" :key="point" class="flex items-start">
                  <svg class="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-gray-700">{{ point }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              @click="goBack"
              class="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              ← 返回列表
            </button>
            
            <button 
              @click="shareContent"
              class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              分享内容
            </button>
          </div>
        </div>
      </section>

      <!-- 加载状态 -->
      <section v-else-if="isLoading" class="py-20">
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p class="mt-4 text-gray-600">正在加载动向详情...</p>
        </div>
      </section>

      <!-- 错误状态 -->
      <section v-else class="py-20">
        <div class="text-center">
          <div class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">动向未找到</h2>
          <p class="text-gray-600 mb-6">抱歉，您访问的市场动向不存在或已被删除</p>
          <router-link 
            to="/market-trends"
            class="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            返回动向列表
          </router-link>
        </div>
      </section>
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

interface MarketTrendDetail {
  id: string
  title: string
  description: string
  content: string
  date: string
  category: string
  important?: boolean
  views?: number
  image?: string
  details?: {
    organizer?: string
    location?: string
    participants?: string
    contact?: string
  }
  keyPoints?: string[]
}

const route = useRoute()
const router = useRouter()

const trendDetail = ref<MarketTrendDetail | null>(null)
const isLoading = ref(true)

// 模拟数据存储
const marketTrendsData: Record<string, MarketTrendDetail> = {
  '1': {
    id: '1',
    title: 'HJ1001-2018 标准方法宣贯会',
    description: '针对新发布的HJ1001-2018标准方法进行详细解读和培训，帮助实验室更好地理解和执行新标准要求。',
    image: '/images/market-trends/20200103084118_7482.png',
    content: `
      <h3>标准背景</h3>
      <p>HJ1001-2018《水质 细菌总数的测定 平皿计数法》是环境保护行业标准，于2018年正式发布实施，替代了之前的相关标准。该标准的发布标志着我国水质微生物检测技术的进一步规范化和标准化。</p>
      
      <h3>标准要点</h3>
      <p>新标准在以下几个方面进行了重要更新和完善：</p>
      
      <h4>1. 检测方法优化</h4>
      <p>对平皿计数法的操作程序进行了细化，明确了样品处理、稀释倍数、培养条件等关键技术参数，确保检测结果的准确性和重现性。</p>
      
      <h4>2. 质量控制要求</h4>
      <p>强化了质量控制措施，包括空白对照、平行样品、标准菌株验证等，建立了完整的质量保证体系。</p>
      
      <h4>3. 结果计算与表示</h4>
      <p>统一了计算公式和结果表示方法，规范了数据处理流程，提高了结果的可比性。</p>
      
      <h3>实施意义</h3>
      <p>HJ1001-2018标准的实施对于规范水质微生物检测工作、提高检测质量、保障水环境安全具有重要意义。各检测机构应严格按照标准要求开展检测工作，确保检测结果的科学性和可靠性。</p>
    `,
    date: '2019-06-05',
    category: '标准规范',
    important: true,
    views: 1256,
    details: {
      organizer: '国家环境保护部',
      location: '北京·环保部会议中心',
      participants: '各级环保部门、检测机构技术人员',
      contact: '010-66556677'
    },
    keyPoints: [
      '标准实施时间：2019年7月1日起正式实施',
      '适用范围：地表水、地下水、生活污水等水质细菌总数检测',
      '检测周期：培养48小时±2小时',
      '报告限值：≥300 CFU/mL时需要稀释检测'
    ]
  },
  '2': {
    id: '2',
    title: '《认监委关于开展2019年国家级检验检测能力验证工作的通知》',
    description: '国家认监委发布2019年能力验证工作通知，涉及水质微生物检测等多个领域的能力验证计划。',
    image: '/images/market-trends/20190417011809368.png',
    content: `
      <h3>通知概况</h3>
      <p>根据《检验检测机构资质认定管理办法》和《检验检测机构资质认定能力评价检验检测机构通用要求》，国家认证认可监督管理委员会决定开展2019年国家级检验检测能力验证工作。</p>
      
      <h3>验证领域</h3>
      <p>2019年能力验证计划覆盖多个重要领域：</p>
      
      <h4>1. 环境检测领域</h4>
      <p>包括水质检测、空气质量检测、土壤检测等环境监测相关项目，其中水质微生物检测是重点验证项目之一。</p>
      
      <h4>2. 食品检测领域</h4>
      <p>涵盖食品安全、营养成分、添加剂、农药残留等检测项目。</p>
      
      <h4>3. 建材检测领域</h4>
      <p>包括建筑材料的物理性能、化学成分等检测项目。</p>
      
      <h3>参与要求</h3>
      <p>具有相应检测能力和资质的检验检测机构均可自愿参与能力验证活动。参与机构需要：</p>
      <ul>
        <li>具有相应的资质认定证书</li>
        <li>具备相应的检测能力和设备</li>
        <li>严格按照验证方案要求执行</li>
        <li>及时提交检测结果和相关资料</li>
      </ul>
      
      <h3>验证意义</h3>
      <p>通过能力验证活动，可以客观评价实验室的检测能力，发现和改进检测工作中存在的问题，提高检测结果的准确性和可靠性，增强实验室的技术水平和管理水平。</p>
    `,
    date: '2019-04-17',
    category: '能力验证',
    important: true,
    views: 892,
    details: {
      organizer: '国家认证认可监督管理委员会',
      location: '全国范围',
      participants: '具有相应资质的检验检测机构',
      contact: '010-82260666'
    },
    keyPoints: [
      '报名截止时间：2019年5月31日',
      '验证周期：6个月',
      '验证费用：根据项目不同收取相应费用',
      '结果评价：统计分析法和专家评议相结合'
    ]
  },
  '3': {
    id: '3',
    title: '2019 HJ1001及CJT51标准宣贯会—5月6日北京',
    description: '在北京举办HJ1001和CJT51标准宣贯会，邀请行业专家进行标准解读和技术交流。',
    image: '/images/market-trends/20190415035916890.jpg',
    content: `
      <h3>会议背景</h3>
      <p>为了帮助各检测机构准确理解和执行HJ1001-2018《水质 细菌总数的测定 平皿计数法》和CJT51-2018《城市供水水质标准》，特举办此次标准宣贯会。</p>
      
      <h3>会议议程</h3>
      
      <h4>上午议程（9:00-12:00）</h4>
      <ul>
        <li><strong>9:00-9:30</strong> 会议开幕及领导致辞</li>
        <li><strong>9:30-10:30</strong> HJ1001-2018标准详细解读</li>
        <li><strong>10:30-10:45</strong> 茶歇</li>
        <li><strong>10:45-12:00</strong> CJT51-2018标准要点分析</li>
      </ul>
      
      <h4>下午议程（14:00-17:00）</h4>
      <ul>
        <li><strong>14:00-15:00</strong> 实验室操作技术要点</li>
        <li><strong>15:00-16:00</strong> 质量控制与管理经验分享</li>
        <li><strong>16:00-17:00</strong> 互动交流与答疑</li>
      </ul>
      
      <h3>专家阵容</h3>
      <ul>
        <li>中国环境科学研究院 水环境研究所 专家团队</li>
        <li>住建部给排水产品标准化技术委员会 专家</li>
        <li>各省市环境监测中心站 技术负责人</li>
        <li>知名检测设备厂商 技术专家</li>
      </ul>
      
      <h3>参会收益</h3>
      <p>通过参加本次宣贯会，与会代表将获得：</p>
      <ul>
        <li>标准的权威解读和实施指导</li>
        <li>实验室操作的技术要点和注意事项</li>
        <li>质量控制的最佳实践经验</li>
        <li>与行业专家和同行的交流机会</li>
        <li>最新的行业动态和发展趋势信息</li>
      </ul>
    `,
    date: '2019-04-17',
    category: '培训会议',
    views: 645,
    details: {
      organizer: '中国环境科学学会',
      location: '北京·国际会议中心',
      participants: '检测机构技术人员、实验室管理人员',
      contact: '会务组 010-62849685'
    },
    keyPoints: [
      '会议时间：2019年5月6日 9:00-17:00',
      '会议费用：800元/人（含资料、午餐）',
      '报名截止：2019年4月30日',
      '会议资料：标准文件、技术指南、操作手册等'
    ]
  },
  '4': {
    id: '4',
    title: '2017年 美国爱德士公司水中微生物 能力验证全年计划',
    description: 'IDEXX公司发布2017年水中微生物检测能力验证计划，为实验室提供权威的能力验证服务。该计划覆盖多个水质检测项目，有助于实验室提升技术水平和管理质量。',
    content: `
      <h3>计划背景</h3>
      <p>IDEXX作为全球领先的水质检测技术提供商，为了帮助实验室提升检测能力和管理水平，特制定了2017年度水中微生物能力验证全年计划。</p>
      
      <h3>验证项目</h3>
      <p>本次能力验证计划涵盖以下主要项目：</p>
      
      <h4>1. 大肠菌群检测</h4>
      <p>采用IDEXX DST固定底物技术，提供准确、快速的大肠菌群检测能力验证样品。</p>
      
      <h4>2. 菌落总数检测</h4>
      <p>通过标准化的菌落总数检测能力验证，确保实验室检测结果的准确性和可靠性。</p>
      
      <h4>3. 两虫检测</h4>
      <p>隐孢子虫和贾第鞭毛虫检测能力验证，采用国际先进的检测方法和标准。</p>
      
      <h3>参与优势</h3>
      <ul>
        <li>获得国际权威机构的能力验证证书</li>
        <li>提升实验室检测技术水平</li>
        <li>增强检测结果的可信度</li>
        <li>满足质量管理体系要求</li>
      </ul>
      
      <h3>技术支持</h3>
      <p>IDEXX公司将为参与实验室提供全程技术支持，包括操作培训、技术咨询和结果分析等服务。</p>
    `,
    date: '2017-02-09',
    category: '能力验证',
    views: 523,
    details: {
      organizer: '美国IDEXX公司',
      location: '全球范围',
      participants: '水质检测实验室、第三方检测机构',
      contact: 'idexx@assaybio.cn'
    },
    keyPoints: [
      '计划周期：2017年全年',
      '验证频次：季度验证',
      '证书有效期：3年',
      '技术支持：全程技术指导'
    ]
  },
  '5': {
    id: '5',
    title: '两虫操作培训班——第3期开始报名',
    description: '针对水中隐孢子虫和贾第鞭毛虫检测的专业培训班开始报名，提供实操指导和技术支持。培训内容包括样品处理、显微镜观察、结果判定等关键技术环节。',
    image: '/images/market-trends/20150810032141374.png',
    content: `
      <h3>培训背景</h3>
      <p>隐孢子虫和贾第鞭毛虫（简称"两虫"）是水质检测中的重要指标，其检测技术要求较高，需要专业的操作技能和丰富的实践经验。为满足行业需求，我们特举办第3期两虫操作培训班。</p>
      
      <h3>培训内容</h3>
      
      <h4>理论培训（第1天）</h4>
      <ul>
        <li>两虫检测的重要性和法规要求</li>
        <li>国内外检测标准对比分析</li>
        <li>IDEXX Filta-Max检测系统原理</li>
        <li>质量控制与质量保证要点</li>
      </ul>
      
      <h4>实操培训（第2-3天）</h4>
      <ul>
        <li>样品采集与预处理技术</li>
        <li>浓缩和纯化操作流程</li>
        <li>显微镜观察与识别技巧</li>
        <li>结果计算与报告编写</li>
        <li>设备维护与故障处理</li>
      </ul>
      
      <h3>培训特色</h3>
      <ul>
        <li>小班授课，每期限20人</li>
        <li>理论与实践相结合</li>
        <li>一对一操作指导</li>
        <li>提供培训证书</li>
        <li>后续技术支持</li>
      </ul>
      
      <h3>适用对象</h3>
      <p>水质检测实验室技术人员、质量管理人员、新入职检测人员等。</p>
    `,
    date: '2015-08-24',
    category: '培训会议',
    views: 456,
    details: {
      organizer: '上海安净生物技术有限公司',
      location: '上海·安净生物培训中心',
      participants: '实验室技术人员、质量管理人员',
      contact: '培训部 021-6449-3336'
    },
    keyPoints: [
      '培训时间：3天（理论1天+实操2天）',
      '培训费用：2800元/人',
      '报名截止：2015年9月10日',
      '培训人数：每期限20人'
    ]
  },
  '6': {
    id: '6',
    title: '恭贺2015年山东省水中微生物检测培训大篷车',
    description: '山东省水中微生物检测培训大篷车项目圆满成功，为当地实验室技术人员提供了专业培训和技术指导，有效提升了区域检测能力。',
    image: '/images/market-trends/20150729032203219.jpg',
    content: `
      <h3>项目背景</h3>
      <p>为响应国家关于提升基层检测能力的号召，上海安净生物技术有限公司与山东省环境保护厅合作，开展了为期一个月的水中微生物检测培训大篷车活动。</p>
      
      <h3>活动概况</h3>
      <p>培训大篷车历时30天，走访了山东省16个地市的检测机构，为500多名技术人员提供了现场培训和技术指导。</p>
      
      <h4>培训路线</h4>
      <ul>
        <li><strong>济南站</strong>：省环境监测中心站及周边机构</li>
        <li><strong>青岛站</strong>：青岛市环境监测站等</li>
        <li><strong>烟台站</strong>：烟台市及周边县市检测机构</li>
        <li><strong>潍坊站</strong>：潍坊市环境监测站等</li>
        <li><strong>临沂站</strong>：临沂市及周边地区</li>
        <li><strong>其他地市</strong>：淄博、东营、济宁、泰安、威海、日照等</li>
      </ul>
      
      <h3>培训内容</h3>
      <ul>
        <li>水中微生物检测新技术新方法</li>
        <li>IDEXX DST技术实操培训</li>
        <li>质量控制与管理经验分享</li>
        <li>疑难问题现场解答</li>
        <li>设备演示与技术咨询</li>
      </ul>
      
      <h3>活动成果</h3>
      <ul>
        <li>培训技术人员500+人次</li>
        <li>走访检测机构80+家</li>
        <li>解决技术问题200+个</li>
        <li>建立长期合作关系50+家</li>
      </ul>
      
      <h3>社会影响</h3>
      <p>此次培训大篷车活动得到了山东省环保系统的高度评价，被誉为"送技术到基层"的典型案例，为提升区域检测能力发挥了重要作用。</p>
    `,
    date: '2015-06-24',
    category: '培训会议',
    views: 689,
    details: {
      organizer: '上海安净生物技术有限公司、山东省环境保护厅',
      location: '山东省16个地市',
      participants: '各级环境监测站、第三方检测机构技术人员',
      contact: '项目组 021-6449-3336'
    },
    keyPoints: [
      '活动时间：2015年6月-7月',
      '培训人次：500+人',
      '覆盖机构：80+家',
      '活动周期：30天'
    ]
  },
  '7': {
    id: '7',
    title: 'IDEXX 两虫检测培训中心',
    description: 'IDEXX公司建立两虫检测培训中心，为水质检测行业提供专业的隐孢子虫和贾第鞭毛虫检测技术培训，推动行业技术水平提升。',
    image: '/images/market-trends/20150729094915375.png',
    content: `
      <h3>培训中心简介</h3>
      <p>IDEXX两虫检测培训中心是由美国IDEXX公司与上海安净生物技术有限公司联合建立的专业培训机构，致力于推广先进的两虫检测技术。</p>
      
      <h3>培训设施</h3>
      
      <h4>硬件设施</h4>
      <ul>
        <li>标准化实验室300平米</li>
        <li>多媒体教学教室50座</li>
        <li>Filta-Max检测设备10套</li>
        <li>高倍显微镜20台</li>
        <li>完整的样品处理设备</li>
      </ul>
      
      <h4>教学资源</h4>
      <ul>
        <li>中英文对照教材</li>
        <li>标准样品库</li>
        <li>视频教学资料</li>
        <li>在线学习平台</li>
      </ul>
      
      <h3>培训课程</h3>
      
      <h4>基础课程</h4>
      <ul>
        <li>两虫检测基础理论（1天）</li>
        <li>标准操作流程培训（2天）</li>
        <li>质量控制与管理（1天）</li>
      </ul>
      
      <h4>高级课程</h4>
      <ul>
        <li>疑难样品处理技巧（2天）</li>
        <li>方法验证与确认（1天）</li>
        <li>实验室管理与认证（1天）</li>
      </ul>
      
      <h3>师资力量</h3>
      <ul>
        <li>美国IDEXX公司技术专家</li>
        <li>国内知名院校教授</li>
        <li>行业资深技术专家</li>
        <li>一线实验室技术骨干</li>
      </ul>
      
      <h3>培训特色</h3>
      <ul>
        <li>国际先进技术</li>
        <li>理论实践并重</li>
        <li>小班精品教学</li>
        <li>持续技术支持</li>
        <li>就业推荐服务</li>
      </ul>
    `,
    date: '2015-03-27',
    category: '培训会议',
    views: 378,
    details: {
      organizer: '美国IDEXX公司、上海安净生物技术有限公司',
      location: '上海·张江高科技园区',
      participants: '实验室技术人员、在校学生、行业从业者',
      contact: '培训中心 021-6449-3336'
    },
    keyPoints: [
      '培训周期：常年开班',
      '培训方式：理论+实操',
      '证书认证：IDEXX官方证书',
      '后续服务：终身技术支持'
    ]
  },
  '8': {
    id: '8',
    title: 'IDEXX 水中微生物国标6项实验室间比对通知函',
    description: 'IDEXX公司组织开展水中微生物检测国标6项指标的实验室间比对验证活动，旨在验证实验室检测能力，确保检测结果的一致性和准确性。',
    image: '/images/market-trends/20150730032542203.jpg',
    content: `
      <h3>比对通知</h3>
      <p>为了验证各实验室在水中微生物检测方面的技术能力，确保检测结果的准确性和一致性，IDEXX公司决定组织开展水中微生物国标6项指标的实验室间比对验证活动。</p>
      
      <h3>比对项目</h3>
      <p>本次比对活动涵盖国家标准规定的6项水中微生物检测指标：</p>
      
      <h4>1. 总大肠菌群</h4>
      <p>采用GB/T 5750.12-2006标准方法，使用IDEXX DST固定底物技术。</p>
      
      <h4>2. 耐热大肠菌群</h4>
      <p>按照国标要求，在44.5℃条件下进行培养检测。</p>
      
      <h4>3. 大肠埃希氏菌</h4>
      <p>使用特异性检测方法，确保结果的准确性。</p>
      
      <h4>4. 菌落总数</h4>
      <p>采用平皿计数法，严格按照标准操作程序执行。</p>
      
      <h4>5. 隐孢子虫</h4>
      <p>使用Filta-Max检测系统，按照EPA方法1623执行。</p>
      
      <h4>6. 贾第鞭毛虫</h4>
      <p>同隐孢子虫检测，确保两虫检测的准确性。</p>
      
      <h3>比对要求</h3>
      <ul>
        <li>严格按照标准操作程序执行</li>
        <li>做好质量控制和记录</li>
        <li>按时提交检测结果</li>
        <li>参与结果讨论和分析</li>
      </ul>
      
      <h3>比对意义</h3>
      <ul>
        <li>验证实验室检测能力</li>
        <li>发现和改进检测方法</li>
        <li>提高检测结果可信度</li>
        <li>促进行业技术交流</li>
        <li>满足质量管理体系要求</li>
      </ul>
      
      <h3>参与条件</h3>
      <ul>
        <li>具备相应检测资质</li>
        <li>拥有合格的检测设备</li>
        <li>技术人员经过专业培训</li>
        <li>建立完善的质量管理体系</li>
      </ul>
    `,
    date: '2015-03-27',
    category: '能力验证',
    views: 567,
    details: {
      organizer: '美国IDEXX公司',
      location: '各参与实验室',
      participants: '具备相应资质的检测实验室',
      contact: 'pt@assaybio.cn'
    },
    keyPoints: [
      '比对周期：6个月',
      '参与费用：根据项目收费',
      '结果评价：统计学方法',
      '证书颁发：合格实验室获得证书'
    ]
  },
  '9': {
    id: '9',
    title: '微信平台上线',
    description: '公司正式推出微信服务平台，为客户提供更加便捷的技术咨询、产品信息查询和服务支持，实现移动端一站式服务体验。',
    image: '/images/market-trends/20140728035056056.jpg',
    content: `
      <h3>平台介绍</h3>
      <p>上海安净生物技术有限公司微信服务平台正式上线！我们致力于为客户提供更加便捷、高效的服务体验。</p>
      
      <h3>服务功能</h3>
      
      <h4>产品信息查询</h4>
      <ul>
        <li>产品型号和规格查询</li>
        <li>价格和库存实时查看</li>
        <li>产品使用说明下载</li>
        <li>技术参数详细介绍</li>
      </ul>
      
      <h4>技术咨询服务</h4>
      <ul>
        <li>在线技术专家咨询</li>
        <li>疑难问题快速解答</li>
        <li>方法选择建议</li>
        <li>故障诊断和处理</li>
      </ul>
      
      <h4>订单管理</h4>
      <ul>
        <li>订单状态实时跟踪</li>
        <li>发货信息及时通知</li>
        <li>售后服务申请</li>
        <li>客户反馈收集</li>
      </ul>
      
      <h4>学习资源</h4>
      <ul>
        <li>技术培训资料</li>
        <li>操作视频教程</li>
        <li>行业动态资讯</li>
        <li>标准法规更新</li>
      </ul>
      
      <h3>使用指南</h3>
      
      <h4>关注方式</h4>
      <ol>
        <li>微信扫描二维码</li>
        <li>搜索公众号"安净生物"</li>
        <li>点击关注即可使用</li>
      </ol>
      
      <h4>功能使用</h4>
      <ol>
        <li>点击菜单栏选择服务</li>
        <li>输入关键词快速查询</li>
        <li>与客服在线沟通</li>
        <li>享受专业服务支持</li>
      </ol>
      
      <h3>服务承诺</h3>
      <ul>
        <li>7×24小时在线服务</li>
        <li>专业技术支持团队</li>
        <li>快速响应客户需求</li>
        <li>持续优化用户体验</li>
      </ul>
      
      <h3>联系我们</h3>
      <p>欢迎关注我们的微信平台，体验更加便捷的服务。如有任何问题或建议，请随时通过微信与我们联系。</p>
    `,
    date: '2014-08-12',
    category: '产品发布',
    views: 892,
    details: {
      organizer: '上海安净生物技术有限公司',
      location: '线上平台',
      participants: '所有客户和合作伙伴',
      contact: '微信客服'
    },
    keyPoints: [
      '上线时间：2014年8月12日',
      '服务时间：7×24小时',
      '功能特色：一站式服务',
      '使用方式：微信关注即可'
    ]
  }
}

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
    month: 'long',
    day: 'numeric'
  })
}

// 返回列表
function goBack() {
  router.push('/market-trends')
}

// 分享内容
function shareContent() {
  if (navigator.share) {
    navigator.share({
      title: trendDetail.value?.title,
      text: trendDetail.value?.description,
      url: window.location.href
    })
  } else {
    // 复制链接到剪贴板
    navigator.clipboard.writeText(window.location.href)
    alert('链接已复制到剪贴板')
  }
}

// 处理图片加载错误
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  // 隐藏图片，显示默认的图标布局
  if (trendDetail.value) {
    trendDetail.value.image = undefined
  }
}

// 加载动向详情
function loadTrendDetail() {
  const id = route.params.id as string
  
  // 模拟API请求延迟
  setTimeout(() => {
    trendDetail.value = marketTrendsData[id] || null
    isLoading.value = false
    
    // 更新页面标题
    if (trendDetail.value) {
      document.title = `${trendDetail.value.title} - 市场动向详情 - 上海安净生物技术有限公司`
    }
  }, 500)
}

onMounted(() => {
  loadTrendDetail()
})
</script>

<style scoped>
.market-trend-detail-page {
  min-height: 100vh;
}

.prose h3 {
  @apply text-xl font-semibold text-gray-900 mt-8 mb-4;
}

.prose h4 {
  @apply text-lg font-semibold text-gray-900 mt-6 mb-3;
}

.prose p {
  @apply text-gray-700 leading-relaxed mb-4;
}

.prose ul {
  @apply list-disc list-inside space-y-2 text-gray-700 mb-4;
}

.prose li {
  @apply leading-relaxed;
}

.prose strong {
  @apply font-semibold text-gray-900;
}
</style>