<template>
  <section class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          核心产品
        </h2>
        <div class="w-24 h-1 bg-primary-600 mx-auto mb-6"></div>
        <p class="text-xl text-gray-600">
          专业的水质检测设备和解决方案
        </p>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="inline-flex items-center justify-center w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p class="mt-4 text-gray-600">正在加载产品...</p>
      </div>

      <!-- 产品网格 -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="product in featuredProducts"
          :key="product.id"
          class="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 group cursor-pointer"
          @click="viewProduct(product)"
        >
          <!-- 产品图片或图标 -->
          <div class="h-32 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
            <img
              v-if="product.images.main"
              :src="product.images.main"
              :alt="product.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              @error="handleImageError"
            />
            <div v-else class="text-primary-600">
              <svg class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2" />
              </svg>
            </div>
          </div>

          <!-- 产品分类标签 -->
          <div class="mb-3">
            <span class="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
              {{ product.category.name }}
            </span>
          </div>

          <!-- 产品信息 -->
          <h3 class="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
            {{ product.name }}
          </h3>
          <p class="text-gray-600 mb-4 line-clamp-3">
            {{ product.description }}
          </p>

          <!-- 产品特性 -->
          <div v-if="product.features.length > 0" class="mb-4">
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="feature in product.features.slice(0, 2)" 
                :key="feature"
                class="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
              >
                {{ feature }}
              </span>
            </div>
          </div>

          <!-- 查看详情按钮 -->
          <div class="flex items-center justify-between mt-auto pt-4">
            <span class="text-sm text-gray-500">了解更多</span>
            <svg class="w-5 h-5 text-primary-600 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      <!-- 查看更多按钮 -->
      <div class="text-center mt-12">
        <router-link
          to="/products"
          class="inline-flex items-center px-8 py-3 border border-primary-600 text-primary-600 font-medium rounded-lg hover:bg-primary-600 hover:text-white transition-colors duration-300"
        >
          查看全部产品
          <svg class="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores'
import { storeToRefs } from 'pinia'
import type { Product } from '@/types'

const router = useRouter()
const productStore = useProductStore()
const { featuredProducts, isLoading } = storeToRefs(productStore)

// 查看产品详情
function viewProduct(product: Product) {
  router.push({
    name: 'product-detail',
    params: { slug: product.slug }
  })
}

// 处理图片加载错误
function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

// 组件挂载时加载特色产品
onMounted(() => {
  productStore.fetchFeaturedProducts(6)
})
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>