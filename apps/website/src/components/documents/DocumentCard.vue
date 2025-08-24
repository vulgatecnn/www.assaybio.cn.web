<template>
  <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
    <!-- 文档类型图标 -->
    <div class="relative h-32 bg-gradient-to-br from-primary-50 to-secondary-50 overflow-hidden flex items-center justify-center">
      <div class="text-primary-600">
        <svg v-if="document.type === 'manual'" class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <svg v-else-if="document.type === 'specification'" class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <svg v-else-if="document.type === 'guide'" class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <svg v-else class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      
      <!-- 文档类型标签 -->
      <div class="absolute top-3 left-3">
        <span class="bg-primary-600 text-white text-xs font-medium px-2 py-1 rounded">
          {{ getTypeLabel(document.type) }}
        </span>
      </div>
    </div>

    <!-- 文档信息 -->
    <div class="p-6">
      <div class="mb-3">
        <h3 class="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
          {{ document.title }}
        </h3>
      </div>
      
      <div class="mb-3">
        <span class="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
          {{ document.category }}
        </span>
      </div>
      
      <p class="text-gray-600 text-sm mb-4 line-clamp-3">
        {{ document.description }}
      </p>

      <!-- 标签 -->
      <div v-if="document.tags.length > 0" class="mb-4">
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="tag in document.tags.slice(0, 3)" 
            :key="tag"
            class="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- 底部信息 -->
      <div class="flex items-center justify-between pt-4 border-t border-gray-100">
        <div class="flex items-center space-x-4 text-sm text-gray-500">
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ formatDate(document.publishDate) }}
          </div>
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {{ document.downloadCount }} 次下载
          </div>
        </div>
        
        <button
          @click="downloadDocument"
          :disabled="!document.fileUrl"
          class="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          下载
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Document } from '@/types'

interface Props {
  document: Document
}

interface Emits {
  (e: 'download', document: Document): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 获取文档类型标签
function getTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    manual: '使用手册',
    specification: '技术规范',
    guide: '应用指南',
    report: '报告文档'
  }
  return typeLabels[type] || '文档'
}

// 格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 下载文档
function downloadDocument() {
  if (props.document.fileUrl) {
    emit('download', props.document)
  } else {
    // TODO: 显示文件不可用提示
    console.log('File not available for download')
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>