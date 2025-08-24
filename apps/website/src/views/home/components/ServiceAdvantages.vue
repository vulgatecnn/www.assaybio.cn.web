<template>
  <section class="py-20 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          服务优势
        </h2>
        <div class="w-24 h-1 bg-primary-600 mx-auto mb-6"></div>
        <p class="text-xl text-gray-600">
          专业的技术团队，完善的服务体系
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div
          v-for="(advantage, index) in advantages"
          :key="index"
          class="text-center bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          <div class="bg-primary-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
            <component :is="advantage.icon" class="h-8 w-8 text-primary-600 mx-auto" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-3">{{ advantage.title }}</h3>
          <p class="text-gray-600">{{ advantage.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/vue/24/outline'

const advantages = ref([
  {
    icon: AcademicCapIcon,
    title: '专业培训',
    description: '每年举办6+场技术交流培训会，提供专业的学习平台'
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: '技术支持',
    description: '专业的销售团队和技术团队，提供全方位技术支持'
  },
  {
    icon: ClockIcon,
    title: '快速响应',
    description: '以快速的响应来满足客户的需求，确保服务质量'
  },
  {
    icon: UserGroupIcon,
    title: '服务导向',
    description: '"技术支持+销售服务"的组织架构，运营简单而高效'
  }
])
</script>