<template>
  <section class="hero-section relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 overflow-hidden">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 bg-black bg-opacity-40"></div>
    <div class="absolute inset-0">
      <div class="absolute top-20 left-20 w-64 h-64 bg-primary-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div class="absolute top-40 right-20 w-72 h-72 bg-secondary-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div class="absolute bottom-20 left-40 w-56 h-56 bg-accent-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>

    <!-- 主要内容 -->
    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
      <!-- 主标题 -->
      <div class="animate-fade-in-up">
        <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span class="block">专业水质检测</span>
          <span class="block text-primary-300">守护生命之源</span>
        </h1>
        
        <p class="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed">
          上海安净生物技术有限公司专注于水中微生物检测技术及方法的研发、引进和推广，
          为<span class="text-primary-300 font-semibold">3000+</span>企事业单位提供专业解决方案
        </p>
      </div>

      <!-- 核心数据 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 animate-fade-in-up animation-delay-500">
        <div class="text-center">
          <div class="text-4xl md:text-5xl font-bold text-primary-300 mb-2">15+</div>
          <div class="text-lg text-gray-200">年专业经验</div>
        </div>
        <div class="text-center">
          <div class="text-4xl md:text-5xl font-bold text-primary-300 mb-2">3000+</div>
          <div class="text-lg text-gray-200">服务客户</div>
        </div>
        <div class="text-center">
          <div class="text-4xl md:text-5xl font-bold text-primary-300 mb-2">6+</div>
          <div class="text-lg text-gray-200">微生物指标</div>
        </div>
      </div>

      <!-- 行动按钮 -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-1000">
        <router-link
          to="/products"
          class="inline-flex items-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
        >
          <BeakerIcon class="w-5 h-5 mr-2" />
          探索产品
        </router-link>
        
        <router-link
          to="/contact"
          class="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary-900 font-semibold rounded-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
        >
          <PhoneIcon class="w-5 h-5 mr-2" />
          联系咨询
        </router-link>
      </div>

      <!-- 核心特点 -->
      <div class="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up animation-delay-1500">
        <div
          v-for="(feature, index) in features"
          :key="index"
          class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-opacity-20 transition-all duration-300"
        >
          <component :is="feature.icon" class="w-8 h-8 mx-auto mb-3 text-primary-300" />
          <h3 class="font-semibold mb-2">{{ feature.title }}</h3>
          <p class="text-sm text-gray-200">{{ feature.description }}</p>
        </div>
      </div>
    </div>

    <!-- 滚动指示器 -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
      <button @click="scrollToNext" class="text-white opacity-60 hover:opacity-100 transition-opacity">
        <ChevronDownIcon class="w-8 h-8" />
      </button>
    </div>

    <!-- 背景渐变 -->
    <div class="absolute inset-0 -z-10 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
      <!-- 未来可以添加背景图片 -->
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  BeakerIcon,
  PhoneIcon,
  ChevronDownIcon,
  CogIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'

// 核心特点数据
const features = ref([
  {
    icon: BeakerIcon,
    title: '先进技术',
    description: '美国IDEXX先进检测技术，准确可靠'
  },
  {
    icon: ShieldCheckIcon,
    title: '质量保证',
    description: '严格质控体系，确保检测结果准确性'
  },
  {
    icon: UserGroupIcon,
    title: '专业团队',
    description: '资深技术团队，提供专业技术支持'
  },
  {
    icon: ClockIcon,
    title: '快速响应',
    description: '24小时快速响应，及时解决问题'
  }
])

// 滚动到下一部分
const scrollToNext = () => {
  const nextSection = document.querySelector('.company-intro') || 
                      document.querySelector('main > section:nth-child(2)')
  if (nextSection) {
    nextSection.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style scoped>
/* 动画定义 */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.8s ease-out forwards;
}

.animation-delay-500 {
  animation-delay: 0.5s;
  opacity: 0;
}

.animation-delay-1000 {
  animation-delay: 1s;
  opacity: 0;
}

.animation-delay-1500 {
  animation-delay: 1.5s;
  opacity: 0;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

.animate-blob {
  animation: blob 7s infinite;
}

/* 确保动画在加载时执行 */
.hero-section * {
  animation-fill-mode: both;
}
</style>