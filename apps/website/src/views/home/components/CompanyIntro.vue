<template>
  <section class="company-intro py-20 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 标题部分 -->
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          关于安净生物
        </h2>
        <div class="w-24 h-1 bg-primary-600 mx-auto mb-6"></div>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          成立于2009年，专注于水中微生物检测技术及方法的研发、引进和推广
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <!-- 左侧：公司介绍内容 -->
        <div class="space-y-6">
          <div class="prose prose-lg max-w-none">
            <p class="text-gray-700 leading-relaxed">
              <span class="font-semibold text-primary-600">Assay Biotechnology</span> 
              成立于<span class="font-semibold">2009年</span>，是一家新兴的专业技术服务公司。
            </p>
            
            <p class="text-gray-700 leading-relaxed">
              公司专注于<span class="font-semibold text-primary-600">水中微生物检测技术及方法</span>的研发、引进和推广。
              对于国标106项规定中，6项微生物指标：总大肠菌群、耐热大肠菌、大肠埃希氏菌、菌落总数、隐孢子虫、
              贾第鞭毛虫的检测技术，均掌握了目前世界上较为先进的检验方法、技术。
            </p>
            
            <p class="text-gray-700 leading-relaxed">
              从<span class="font-semibold">2009年</span>只有寥寥数十家用户，发展至今已超过
              <span class="font-semibold text-primary-600">300多家</span>企事业单位用户，
              服务区域涵盖<span class="font-semibold">华东区、华北区、西北区</span>。
            </p>
          </div>

          <!-- 核心数据展示 -->
          <div class="grid grid-cols-2 gap-6 mt-8">
            <div class="text-center p-6 bg-white rounded-lg shadow-md">
              <div class="text-3xl font-bold text-primary-600 mb-2">300+</div>
              <div class="text-gray-600">服务客户</div>
            </div>
            <div class="text-center p-6 bg-white rounded-lg shadow-md">
              <div class="text-3xl font-bold text-primary-600 mb-2">15+</div>
              <div class="text-gray-600">专业经验</div>
            </div>
          </div>

          <!-- 行动按钮 -->
          <div class="flex flex-col sm:flex-row gap-4 pt-6">
            <router-link
              to="/about"
              class="inline-flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              了解更多
              <ArrowRightIcon class="ml-2 h-4 w-4" />
            </router-link>
            
            <router-link
              to="/contact"
              class="inline-flex items-center justify-center px-6 py-3 bg-white border border-primary-600 text-primary-600 hover:bg-primary-50 font-medium rounded-lg transition-colors duration-200"
            >
              <PhoneIcon class="mr-2 h-4 w-4" />
              立即咨询
            </router-link>
          </div>
        </div>

        <!-- 右侧：图片和特色展示 -->
        <div class="space-y-6">
          <!-- 主要图片占位符 -->
          <div class="relative">
            <div class="w-full h-80 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg shadow-lg flex items-center justify-center">
              <div class="text-center text-primary-600">
                <BeakerIcon class="h-16 w-16 mx-auto mb-4" />
                <p class="text-lg font-medium">实验室环境</p>
              </div>
            </div>
          </div>

          <!-- 特色服务 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="(service, index) in services"
              :key="index"
              class="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              <component :is="service.icon" class="h-8 w-8 text-primary-600 mb-3" />
              <h4 class="font-semibold text-gray-900 mb-2">{{ service.title }}</h4>
              <p class="text-sm text-gray-600">{{ service.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 核心优势 -->
      <div class="mt-20">
        <h3 class="text-2xl font-bold text-center text-gray-900 mb-12">我们的核心优势</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div
            v-for="(advantage, index) in advantages"
            :key="index"
            class="text-center group"
          >
            <div class="bg-primary-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 group-hover:bg-primary-200 transition-colors duration-200">
              <component :is="advantage.icon" class="h-8 w-8 text-primary-600 mx-auto" />
            </div>
            <h4 class="font-semibold text-gray-900 mb-2">{{ advantage.title }}</h4>
            <p class="text-gray-600 text-sm">{{ advantage.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  ArrowRightIcon,
  PhoneIcon,
  BeakerIcon,
  AcademicCapIcon,
  CogIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon
} from '@heroicons/vue/24/outline'

// 特色服务
const services = ref([
  {
    icon: BeakerIcon,
    title: '检测设备',
    description: '美国IDEXX先进检测设备销售及技术支持'
  },
  {
    icon: AcademicCapIcon,
    title: '技术培训',
    description: '定期举办技术交流培训会，提升用户技能'
  },
  {
    icon: CogIcon,
    title: '技术服务',
    description: '提供全方位技术支持和售后服务'
  },
  {
    icon: DocumentTextIcon,
    title: '解决方案',
    description: '针对不同需求提供定制化解决方案'
  }
])

// 核心优势
const advantages = ref([
  {
    icon: BeakerIcon,
    title: '先进技术',
    description: '掌握国际领先的微生物检测技术'
  },
  {
    icon: UserGroupIcon,
    title: '专业团队',
    description: '拥有经验丰富的技术和服务团队'
  },
  {
    icon: ShieldCheckIcon,
    title: '质量保证',
    description: '严格的质量控制体系确保检测准确性'
  },
  {
    icon: ClockIcon,
    title: '快速响应',
    description: '24小时快速响应客户需求'
  }
])
</script>

<style scoped>
.prose p {
  margin-bottom: 1rem;
}

.prose p:last-child {
  margin-bottom: 0;
}
</style>