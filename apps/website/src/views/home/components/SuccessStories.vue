<template>
  <section class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          成功案例
        </h2>
        <div class="w-24 h-1 bg-primary-600 mx-auto mb-6"></div>
        <p class="text-xl text-gray-600">
          服务3000+企事业单位的成功经验
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="(story, index) in stories"
          :key="index"
          class="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
        >
          <div class="p-6">
            <div class="flex items-center mb-4">
              <component :is="story.icon" class="h-8 w-8 text-primary-600 mr-3" />
              <h3 class="text-lg font-semibold text-gray-900">{{ story.category }}</h3>
            </div>
            <h4 class="text-xl font-bold text-gray-900 mb-3">{{ story.title }}</h4>
            <p class="text-gray-600 mb-4">{{ story.description }}</p>
            <div class="flex items-center text-sm text-gray-500">
              <MapPinIcon class="h-4 w-4 mr-1" />
              <span>{{ story.location }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center mt-12">
        <router-link
          to="/cases"
          class="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          查看更多案例
          <ArrowRightIcon class="ml-2 h-4 w-4" />
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  BuildingOfficeIcon,
  BeakerIcon,
  AcademicCapIcon,
  MapPinIcon,
  ArrowRightIcon
} from '@heroicons/vue/24/outline'

const stories = ref([
  {
    icon: BuildingOfficeIcon,
    category: '自来水公司',
    title: '城市供水质量监测',
    description: '为大型自来水公司提供全面的水质微生物检测服务，确保供水安全。',
    location: '华东地区'
  },
  {
    icon: BeakerIcon,
    category: '检测机构',
    title: '第三方检测实验室',
    description: '帮助建立标准化的水质检测实验室，提供设备和技术培训。',
    location: '华北地区'
  },
  {
    icon: AcademicCapIcon,
    category: '科研院所',
    title: '水质研究项目',
    description: '为科研院所的水质研究项目提供先进检测技术和设备支持。',
    location: '西北地区'
  }
])
</script>