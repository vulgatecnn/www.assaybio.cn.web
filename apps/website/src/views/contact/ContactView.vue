<template>
  <div class="contact-page">
    <AppHeader />
    
    <main>
      <!-- 页面头部 -->
      <section class="bg-primary-900 text-white py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-6">联系我们</h1>
          <p class="text-xl text-primary-200 max-w-3xl mx-auto">
            与我们的专业团队取得联系，获取专业的水质检测解决方案
          </p>
        </div>
      </section>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="py-20 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p class="mt-4 text-gray-600">正在加载联系信息...</p>
      </div>

      <!-- 联系信息 -->
      <section v-else class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- 快速联系卡片 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div class="text-center bg-gray-50 rounded-lg p-8 hover:shadow-lg transition-shadow duration-300">
              <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">电子邮箱</h3>
              <p class="text-gray-600 mb-2">快速响应您的需求</p>
              <a :href="`mailto:${companyInfo?.contact.email || 'info@assaybio.cn'}`" class="text-primary-600 font-semibold hover:text-primary-700">
                {{ companyInfo?.contact.email || 'info@assaybio.cn' }}
              </a>
            </div>

            <div class="text-center bg-gray-50 rounded-lg p-8 hover:shadow-lg transition-shadow duration-300">
              <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">总部地址</h3>
              <p class="text-gray-600 mb-2">欢迎实地考察交流</p>
              <p class="text-gray-700 text-sm">{{ companyInfo?.contact.address || '上海市闵行区紫秀路100号' }}</p>
            </div>
          </div>

          <!-- 各地技术服务部 -->
          <div v-if="companyInfo?.contact?.offices" class="mb-16">
            <div class="text-center mb-12">
              <h2 class="text-3xl font-bold text-gray-900 mb-4">技术服务部</h2>
              <div class="w-24 h-1 bg-primary-600 mx-auto mb-6"></div>
              <p class="text-xl text-gray-600">全国多地设有技术服务部，为您提供就近服务</p>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div
                v-for="(office, index) in companyInfo.contact.offices"
                :key="index"
                class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div class="flex items-center mb-4">
                  <div class="w-3 h-3 bg-primary-600 rounded-full mr-3"></div>
                  <h3 class="text-xl font-bold text-gray-900">{{ office.name }}</h3>
                </div>
                
                <div class="space-y-3">
                  <div class="flex items-start">
                    <svg class="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p class="text-sm text-gray-500">地址</p>
                      <p class="text-gray-700 text-sm leading-relaxed">{{ office.address }}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-center">
                    <svg class="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p class="text-sm text-gray-500">电话</p>
                      <a :href="`tel:${office.phone.split('、')[0]}`" class="text-primary-600 hover:text-primary-700 font-medium">
                        {{ office.phone }}
                      </a>
                    </div>
                  </div>
                  
                  <div v-if="office.fax" class="flex items-center">
                    <svg class="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 14h14L17 4M9 9v6M15 9v6" />
                    </svg>
                    <div>
                      <p class="text-sm text-gray-500">传真</p>
                      <p class="text-gray-700">{{ office.fax }}</p>
                    </div>
                  </div>
                  
                  <div v-if="office.qq" class="flex items-center">
                    <svg class="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <div>
                      <p class="text-sm text-gray-500">客服QQ</p>
                      <p class="text-primary-600">{{ office.qq }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 服务特色 -->
          <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold text-gray-900 mb-8">为什么选择我们</h2>
            
            <div class="space-y-8">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <h3 class="text-lg font-semibold text-gray-900">快速响应</h3>
                  <p class="text-gray-600">24小时内专业团队响应，快速为您提供解决方案</p>
                </div>
              </div>

              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <h3 class="text-lg font-semibold text-gray-900">专业技术</h3>
                  <p class="text-gray-600">掌握世界先进的微生物检测技术，提供专业建议</p>
                </div>
              </div>

              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <h3 class="text-lg font-semibold text-gray-900">贴心服务</h3>
                  <p class="text-gray-600">从售前咨询到售后服务，全程贴心跟进服务</p>
                </div>
              </div>
            </div>

            <!-- 联系方式总结 -->
            <div class="mt-12 p-6 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">其他联系方式</h3>
                <div class="space-y-3 text-sm">
                  <p class="flex items-center text-gray-700">
                    <svg class="w-4 h-4 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    工作时间：周一至周五 9:00-18:00
                  </p>
                  <p class="flex items-center text-gray-700">
                    <svg class="w-4 h-4 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                    紧急联系：24小时技术支持热线
                  </p>
                </div>
            </div>
          </div>
        </div>
      </section>
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { useCompanyStore } from '@/stores'
import { storeToRefs } from 'pinia'
import type { ContactForm } from '@/types'

const route = useRoute()
const companyStore = useCompanyStore()
const { companyInfo, isLoading } = storeToRefs(companyStore)

// 表单状态
const isSubmitting = ref(false)
const isSubmitSuccess = ref(false)
const submitError = ref<string | null>(null)

// 表单数据
const form = reactive<ContactForm>({
  name: '',
  email: '',
  phone: '',
  company: '',
  subject: '',
  message: ''
})

// 表单验证错误
const errors = reactive({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: ''
})

// 验证表单
function validateForm(): boolean {
  let isValid = true
  
  // 清除之前的错误
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })
  
  // 验证姓名
  if (!form.name.trim()) {
    errors.name = '请输入您的姓名'
    isValid = false
  } else if (form.name.trim().length < 2) {
    errors.name = '姓名至少需要2个字符'
    isValid = false
  }
  
  // 验证邮箱
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email.trim()) {
    errors.email = '请输入您的邮箱'
    isValid = false
  } else if (!emailRegex.test(form.email)) {
    errors.email = '请输入有效的邮箱地址'
    isValid = false
  }
  
  // 验证电话
  const phoneRegex = /^[1][3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$|^400-?\d{3}-?\d{4}$/
  if (!form.phone.trim()) {
    errors.phone = '请输入您的联系电话'
    isValid = false
  } else if (!phoneRegex.test(form.phone.replace(/[-\s]/g, ''))) {
    errors.phone = '请输入有效的联系电话'
    isValid = false
  }
  
  // 验证主题
  if (!form.subject) {
    errors.subject = '请选择咨询主题'
    isValid = false
  }
  
  // 验证消息
  if (!form.message.trim()) {
    errors.message = '请输入咨询内容'
    isValid = false
  } else if (form.message.trim().length < 10) {
    errors.message = '咨询内容至少需要10个字符'
    isValid = false
  } else if (form.message.length > 500) {
    errors.message = '咨询内容不能超过500个字符'
    isValid = false
  }
  
  return isValid
}

// 提交表单
async function submitForm() {
  if (!validateForm()) {
    return
  }
  
  isSubmitting.value = true
  submitError.value = null
  
  try {
    // 模拟提交延迟
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 这里应该调用实际的API提交表单
    console.log('提交表单数据:', form)
    
    // 模拟成功
    isSubmitSuccess.value = true
    
    // 重置表单
    Object.keys(form).forEach(key => {
      form[key as keyof ContactForm] = ''
    })
    
    // 3秒后隐藏成功消息
    setTimeout(() => {
      isSubmitSuccess.value = false
    }, 5000)
    
  } catch (err) {
    submitError.value = '提交失败，请稍后重试或直接联系我们'
    console.error('表单提交失败:', err)
  } finally {
    isSubmitting.value = false
  }
}

// 组件挂载时获取公司信息并处理URL参数
onMounted(() => {
  companyStore.fetchCompanyInfo()
  
  // 如果URL中有产品参数，自动填充到表单中
  if (route.query.product) {
    form.subject = '产品咨询'
    form.message = `我对产品「${route.query.product}」感兴趣，希望了解更多详细信息。`
  }
})
</script>