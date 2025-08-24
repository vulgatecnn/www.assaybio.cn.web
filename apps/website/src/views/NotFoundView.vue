<template>
  <div class="not-found-page min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="max-w-md mx-auto text-center px-4">
      <div class="mb-8">
        <ExclamationTriangleIcon class="h-24 w-24 text-primary-400 mx-auto mb-4" />
        <h1 class="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 class="text-2xl font-semibold text-gray-700 mb-2">页面未找到</h2>
        <p class="text-gray-600">
          抱歉，您访问的页面不存在或已被移动。
        </p>
      </div>
      
      <div class="space-y-4">
        <router-link
          to="/"
          class="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
        >
          返回首页
        </router-link>
        
        <div class="text-sm text-gray-500">
          或者您可以
          <router-link to="/contact" class="text-primary-600 hover:text-primary-700">
            联系我们
          </router-link>
          获取帮助
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
</script>