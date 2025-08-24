<template>
  <div class="about-page">
    <AppHeader />
    
    <main>
      <!-- 页面头部 -->
      <section class="bg-primary-900 text-white py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-6">关于我们</h1>
          <p class="text-xl text-primary-200 max-w-3xl mx-auto">
            专注于水中微生物检测技术及方法的研发、引进和推广
          </p>
        </div>
      </section>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="py-20 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p class="mt-4 text-gray-600">正在加载公司信息...</p>
      </div>

      <!-- 公司信息 -->
      <div v-else-if="companyInfo">
        <!-- 公司简介 -->
        <section class="py-20 bg-white">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
              <!-- 公司描述 -->
              <div>
                <div class="mb-8">
                  <h2 class="text-3xl font-bold text-gray-900 mb-6">公司简介</h2>
                  <div class="prose prose-lg max-w-none">
                    <p class="text-gray-700 leading-relaxed text-lg">
                      <span class="font-semibold text-primary-600">{{ companyInfo.name }}</span> 
                      成立于<span class="font-semibold">{{ companyInfo.established }}年</span>，是一家专业的技术服务公司。
                    </p>
                    
                    <p class="text-gray-700 leading-relaxed text-lg mt-6">
                      {{ companyInfo.description }}
                    </p>
                  </div>
                </div>

                <!-- 联系信息 -->
                <div class="bg-gray-50 rounded-lg p-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">联系信息</h3>
                  <div class="space-y-3">
                    <div class="flex items-center">
                      <svg class="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span class="text-gray-700">{{ companyInfo.contact.address }}</span>
                    </div>
                    <div class="flex items-center">
                      <svg class="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span class="text-gray-700">{{ companyInfo.contact.phone }}</span>
                    </div>
                    <div class="flex items-center">
                      <svg class="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a :href="`mailto:${companyInfo.contact.email}`" class="text-primary-600 hover:text-primary-700">
                        {{ companyInfo.contact.email }}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 公司图片占位符 -->
              <div class="mt-12 lg:mt-0">
                <div class="h-96 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg flex items-center justify-center">
                  <div class="text-center text-gray-400">
                    <svg class="w-24 h-24 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p>公司办公环境</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 服务范围 -->
        <section class="py-20 bg-gray-50">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
              <h2 class="text-3xl font-bold text-gray-900 mb-4">服务范围</h2>
              <div class="w-24 h-1 bg-primary-600 mx-auto mb-6"></div>
              <p class="text-xl text-gray-600">为客户提供全方位的专业服务</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div
                v-for="(service, index) in companyInfo.services"
                :key="index"
                class="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ service }}</h3>
                <p class="text-gray-600 text-sm">为客户提供专业的{{ service.includes('技术') ? '技术支持' : '优质服务' }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 企业优势 -->
        <section class="py-20 bg-white">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
              <h2 class="text-3xl font-bold text-gray-900 mb-4">企业优势</h2>
              <div class="w-24 h-1 bg-primary-600 mx-auto mb-6"></div>
              <p class="text-xl text-gray-600">专业技术，卓越服务</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div class="text-center">
                <div class="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg class="w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-4">专业技术</h3>
                <p class="text-gray-600">掌握世界先进的水质微生物检测技术，为客户提供精准的检测服务</p>
              </div>

              <div class="text-center">
                <div class="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg class="w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-4">专业团队</h3>
                <p class="text-gray-600">拥有经验丰富的技术团队，为客户提供全方位的技术支持和培训</p>
              </div>

              <div class="text-center">
                <div class="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg class="w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-4">用心服务</h3>
                <p class="text-gray-600">始终以客户为中心，提供贴心周到的售前售后服务</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { useCompanyStore } from '@/stores'
import { storeToRefs } from 'pinia'

const companyStore = useCompanyStore()
const { companyInfo, isLoading, error } = storeToRefs(companyStore)

// 组件挂载时加载公司信息
onMounted(() => {
  companyStore.fetchCompanyInfo()
})
</script>