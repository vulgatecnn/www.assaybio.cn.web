<template>
  <div class="services-page">
    <AppHeader />
    
    <main>
      <!-- 页面头部 -->
      <section class="bg-primary-900 text-white py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-6">技术服务</h1>
          <p class="text-xl text-primary-200 max-w-3xl mx-auto">
            专业的技术支持和培训服务
          </p>
        </div>
      </section>

      <!-- 服务内容 -->
      <section class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">我们的服务</h2>
            <p class="text-xl text-gray-600">全方位的技术支持体系</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="bg-gray-50 rounded-lg p-8">
              <h3 class="text-2xl font-semibold mb-4">技术培训</h3>
              <p class="text-gray-600 mb-4">每年举办6+场技术交流培训会，为用户提供专业的学习平台</p>
              <ul class="text-gray-600 space-y-2">
                <li>• 检测方法培训</li>
                <li>• 设备操作指导</li>
                <li>• 质量控制体系</li>
              </ul>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-8">
              <h3 class="text-2xl font-semibold mb-4">技术支持</h3>
              <p class="text-gray-600 mb-4">专业的技术团队提供全方位支持</p>
              <ul class="text-gray-600 space-y-2">
                <li>• 24小时技术咨询</li>
                <li>• 设备维护服务</li>
                <li>• 解决方案定制</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
</script>