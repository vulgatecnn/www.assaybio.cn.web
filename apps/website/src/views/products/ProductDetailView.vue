<template>
  <div class="product-detail-page">
    <AppHeader />
    
    <main>
      <!-- 加载状态 -->
      <div v-if="isLoading" class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p class="mt-4 text-gray-600">正在加载产品详情...</p>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <div class="text-red-600 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-4">产品未找到</h1>
          <p class="text-gray-600 mb-6">{{ error }}</p>
          <router-link 
            to="/products"
            class="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            返回产品列表
          </router-link>
        </div>
      </div>

      <!-- 产品详情内容 -->
      <div v-else-if="product" class="py-8">
        <!-- 面包屑导航 -->
        <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <ol class="flex items-center space-x-2 text-sm">
            <li>
              <router-link to="/" class="text-gray-500 hover:text-gray-700">首页</router-link>
            </li>
            <li class="text-gray-400">/</li>
            <li>
              <router-link to="/products" class="text-gray-500 hover:text-gray-700">产品中心</router-link>
            </li>
            <li class="text-gray-400">/</li>
            <li>
              <router-link 
                :to="{ name: 'products', query: { category: product.category.slug } }"
                class="text-gray-500 hover:text-gray-700"
              >
                {{ product.category.name }}
              </router-link>
            </li>
            <li class="text-gray-400">/</li>
            <li class="text-gray-900 font-medium">{{ product.name }}</li>
          </ol>
        </nav>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
            <!-- 产品图片 -->
            <div class="flex flex-col-reverse">
              <!-- 缩略图 -->
              <div v-if="product.images.gallery.length > 0" class="hidden mt-6 w-full max-w-2xl mx-auto sm:block lg:max-w-none">
                <div class="grid grid-cols-4 gap-6">
                  <button
                    v-for="(image, index) in product.images.gallery"
                    :key="index"
                    @click="currentImageIndex = index"
                    :class="[
                      'relative h-24 bg-white rounded-md flex items-center justify-center text-sm font-medium uppercase text-gray-900 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring focus:ring-offset-4 focus:ring-primary-500',
                      currentImageIndex === index ? 'ring-2 ring-primary-500' : 'ring-1 ring-gray-300'
                    ]"
                  >
                    <img :src="image" :alt="`${product.name} 图片 ${index + 1}`" class="w-full h-full object-cover rounded-md" />
                  </button>
                </div>
              </div>

              <!-- 主图片 -->
              <div class="w-full aspect-w-1 aspect-h-1">
                <div class="h-96 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg overflow-hidden">
                  <img
                    v-if="currentImage"
                    :src="currentImage"
                    :alt="product.name"
                    class="w-full h-full object-cover"
                    @error="handleImageError"
                  />
                  <div v-else class="flex items-center justify-center h-full">
                    <div class="text-center text-gray-400">
                      <svg class="w-24 h-24 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2" />
                      </svg>
                      <p>暂无图片</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 产品信息 -->
            <div class="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
              <div class="mb-4">
                <span class="inline-block bg-primary-100 text-primary-800 text-sm font-medium px-3 py-1 rounded-full">
                  {{ product.category.name }}
                </span>
              </div>
              
              <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-6">
                {{ product.name }}
              </h1>

              <div class="space-y-6">
                <!-- 产品描述 -->
                <div>
                  <h3 class="text-lg font-medium text-gray-900 mb-3">产品描述</h3>
                  <p class="text-gray-700 leading-relaxed">
                    {{ product.description }}
                  </p>
                </div>

                <!-- 产品特性 -->
                <div v-if="product.features.length > 0">
                  <h3 class="text-lg font-medium text-gray-900 mb-3">产品特性</h3>
                  <ul class="space-y-2">
                    <li 
                      v-for="feature in product.features" 
                      :key="feature"
                      class="flex items-start"
                    >
                      <svg class="h-5 w-5 text-primary-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                      <span class="text-gray-700">{{ feature }}</span>
                    </li>
                  </ul>
                </div>

                <!-- 技术规格 -->
                <div v-if="hasSpecifications">
                  <h3 class="text-lg font-medium text-gray-900 mb-3">技术规格</h3>
                  <div class="bg-gray-50 rounded-lg p-4">
                    <dl class="space-y-2">
                      <div 
                        v-for="(value, key) in product.specifications" 
                        :key="key"
                        class="flex justify-between"
                      >
                        <dt class="font-medium text-gray-900">{{ key }}:</dt>
                        <dd class="text-gray-700">{{ value }}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <!-- 操作按钮 -->
                <div class="space-y-3">
                  <button
                    @click="addToInquiry"
                    class="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    收藏
                  </button>
                </div>

                <!-- SEO信息 -->
                <div class="border-t pt-6">
                  <h3 class="text-lg font-medium text-gray-900 mb-3">关键词</h3>
                  <div class="flex flex-wrap gap-2">
                    <span 
                      v-for="keyword in product.seo.keywords" 
                      :key="keyword"
                      class="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
                    >
                      {{ keyword }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 相关产品 -->
        <section class="mt-16 py-16 bg-gray-50">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-8">相关产品</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <ProductCard 
                v-for="relatedProduct in relatedProducts" 
                :key="relatedProduct.id" 
                :product="relatedProduct" 
              />
            </div>
          </div>
        </section>
      </div>
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import ProductCard from '@/components/products/ProductCard.vue'
import { useProductStore } from '@/stores'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()

const { currentProduct: product, isLoading, error } = storeToRefs(productStore)
const currentImageIndex = ref(0)
const relatedProducts = ref([])

// 计算属性
const currentImage = computed(() => {
  if (!product.value) return null
  if (product.value.images.gallery.length > 0) {
    return product.value.images.gallery[currentImageIndex.value]
  }
  return product.value.images.main
})

const hasSpecifications = computed(() => {
  return product.value && Object.keys(product.value.specifications).length > 0
})

// 方法
async function loadProduct() {
  const slug = route.params.slug as string
  if (!slug) {
    router.push('/products')
    return
  }

  const result = await productStore.fetchProductBySlug(slug)
  if (result) {
    // 更新页面SEO信息
    document.title = result.seo.title
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', result.seo.description)
    }
    
    // 加载相关产品
    await loadRelatedProducts(result.category.slug)
  }
}

async function loadRelatedProducts(categorySlug: string) {
  try {
    const response = await productStore.fetchProducts({
      category: categorySlug,
      limit: 3
    })
    // 排除当前产品
    relatedProducts.value = productStore.products.filter(p => p.id !== product.value?.id)
  } catch (err) {
    console.error('加载相关产品失败:', err)
  }
}

function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

function addToInquiry() {
  // TODO: 实现收藏功能
  console.log('Add to inquiry:', product.value?.name)
}

// 生命周期
onMounted(() => {
  loadProduct()
})

// 监听路由参数变化
watch(() => route.params.slug, (newSlug, oldSlug) => {
  if (newSlug && newSlug !== oldSlug) {
    productStore.resetCurrentProduct()
    loadProduct()
  }
})
</script>