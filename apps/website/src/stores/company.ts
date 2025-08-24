import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Company } from '@/types'
import { DataService } from '@/api/data'

export const useCompanyStore = defineStore('company', () => {
  // State
  const companyInfo = ref<Company | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchCompanyInfo() {
    if (companyInfo.value) {
      return companyInfo.value // 已经加载过，直接返回
    }

    isLoading.value = true
    error.value = null
    
    try {
      companyInfo.value = await DataService.getCompanyInfo()
      return companyInfo.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取公司信息失败'
      return null
    } finally {
      isLoading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    companyInfo,
    isLoading,
    error,
    
    // Actions
    fetchCompanyInfo,
    clearError
  }
})