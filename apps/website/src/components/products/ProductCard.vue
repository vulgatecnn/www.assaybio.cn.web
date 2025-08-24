<template>
  <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
    <!-- 产品图片 -->
    <div class="relative h-48 bg-gradient-to-br from-primary-50 to-secondary-50 overflow-hidden">
      <img
        v-if="product.images.main"
        :src="product.images.main"
        :alt="product.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
        @error="handleImageError"
      />
      <div v-else class="flex items-center justify-center h-full">
        <div class="text-center text-gray-400">
          <svg class="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2" />
          </svg>
          <p class="text-sm">暂无图片</p>
        </div>
      </div>
      
      <!-- 产品分类标签 -->
      <div class="absolute top-4 left-4">
        <span class="bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded-full">
          {{ product.category.name }}
        </span>
      </div>
      
      <!-- 状态标签 -->
      <div v-if="product.status !== 'active'" class="absolute top-4 right-4">
        <span class="bg-gray-500 text-white text-xs font-medium px-3 py-1 rounded-full">
          暂停销售
        </span>
      </div>
    </div>

    <!-- 产品信息 -->
    <div class="p-6">
      <div class="mb-3">
        <h3 class="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
          {{ product.name }}
        </h3>
      </div>
      
      <p class="text-gray-600 text-sm mb-4 line-clamp-3">
        {{ product.description }}
      </p>

      <!-- 产品特性 -->
      <div v-if="product.features.length > 0" class="mb-4">
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="feature in product.features.slice(0, 3)" 
            :key="feature"
            class="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
          >
            {{ feature }}
          </span>
          <span 
            v-if="product.features.length > 3" 
            class="inline-block text-gray-500 text-xs"
          >
            +{{ product.features.length - 3 }} 项特性
          </span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center justify-between">
        <button
          @click="viewDetails"
          class="flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          查看详情
          <svg class="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        <div class="flex items-center space-x-2">
          <button
            @click="addToInquiry"
            class="p-2 text-gray-400 hover:text-primary-600 transition-colors"
            title="加入收藏"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Product } from '@/types'

interface Props {
  product: Product
}

const props = defineProps<Props>()
const router = useRouter()

// 查看产品详情
function viewDetails() {
  router.push({
    name: 'product-detail',
    params: { slug: props.product.slug }
  })
}

// 加入收藏（待实现）
function addToInquiry() {
  // TODO: 实现收藏功能
  console.log('Add to favorites:', props.product.name)
}

// 处理图片加载错误
function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>