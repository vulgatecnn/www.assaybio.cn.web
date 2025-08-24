import type { 
  Product, 
  NewsArticle, 
  Document, 
  Company, 
  Page,
  MigratedData,
  PaginatedResponse,
  SearchFilters,
  PaginationParams
} from '@/types'

// 导入迁移的数据
import migratedData from '@/data/migrated-data.json'

// 模拟API延迟
const simulateDelay = (ms: number = 300) => 
  new Promise(resolve => setTimeout(resolve, ms))

// 数据API服务
export class DataService {
  private static data: MigratedData = migratedData as MigratedData

  // 公司信息
  static async getCompanyInfo(): Promise<Company> {
    await simulateDelay()
    return this.data.company
  }

  // 产品相关API
  static async getProducts(params?: PaginationParams & SearchFilters): Promise<PaginatedResponse<Product>> {
    await simulateDelay()
    
    let filteredProducts = [...this.data.products]

    // 应用搜索过滤
    if (params?.keyword) {
      const keyword = params.keyword.toLowerCase()
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(keyword) ||
        product.description.toLowerCase().includes(keyword) ||
        product.features.some(feature => feature.toLowerCase().includes(keyword))
      )
    }

    // 应用分类过滤
    if (params?.category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category.slug === params.category
      )
    }

    // 应用标签过滤
    if (params?.tags && params.tags.length > 0) {
      filteredProducts = filteredProducts.filter(product =>
        params.tags!.some(tag => 
          product.seo.keywords.some(keyword => 
            keyword.toLowerCase().includes(tag.toLowerCase())
          )
        )
      )
    }

    // 分页处理
    const page = params?.page || 1
    const limit = params?.limit || 12
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

    return {
      items: paginatedProducts,
      total: filteredProducts.length,
      page,
      limit,
      totalPages: Math.ceil(filteredProducts.length / limit)
    }
  }

  static async getProductBySlug(slug: string): Promise<Product | null> {
    await simulateDelay()
    return this.data.products.find(product => product.slug === slug) || null
  }

  static async getProductCategories(): Promise<Array<{ id: string; name: string; slug: string; count: number }>> {
    await simulateDelay()
    const categoryMap = new Map()
    
    this.data.products.forEach(product => {
      const cat = product.category
      if (categoryMap.has(cat.id)) {
        categoryMap.get(cat.id).count++
      } else {
        categoryMap.set(cat.id, { ...cat, count: 1 })
      }
    })

    return Array.from(categoryMap.values())
  }

  static async getFeaturedProducts(limit: number = 6): Promise<Product[]> {
    await simulateDelay()
    // 返回前几个产品作为特色产品
    return this.data.products.slice(0, limit)
  }

  // 新闻相关API
  static async getNews(params?: PaginationParams & SearchFilters): Promise<PaginatedResponse<NewsArticle>> {
    await simulateDelay()
    
    let filteredNews = [...this.data.news]

    // 应用搜索过滤
    if (params?.keyword) {
      const keyword = params.keyword.toLowerCase()
      filteredNews = filteredNews.filter(article => 
        article.title.toLowerCase().includes(keyword) ||
        article.excerpt.toLowerCase().includes(keyword) ||
        article.content.toLowerCase().includes(keyword)
      )
    }

    // 应用分类过滤
    if (params?.category) {
      filteredNews = filteredNews.filter(article => 
        article.category === params.category
      )
    }

    // 按发布日期排序（最新优先）
    filteredNews.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())

    // 分页处理
    const page = params?.page || 1
    const limit = params?.limit || 10
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedNews = filteredNews.slice(startIndex, endIndex)

    return {
      items: paginatedNews,
      total: filteredNews.length,
      page,
      limit,
      totalPages: Math.ceil(filteredNews.length / limit)
    }
  }

  static async getNewsBySlug(slug: string): Promise<NewsArticle | null> {
    await simulateDelay()
    return this.data.news.find(article => article.slug === slug) || null
  }

  static async getFeaturedNews(limit: number = 3): Promise<NewsArticle[]> {
    await simulateDelay()
    return this.data.news
      .filter(article => article.featured)
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
      .slice(0, limit)
  }

  static async getNewsCategories(): Promise<Array<{ name: string; count: number }>> {
    await simulateDelay()
    const categoryMap = new Map()
    
    this.data.news.forEach(article => {
      if (categoryMap.has(article.category)) {
        categoryMap.get(article.category).count++
      } else {
        categoryMap.set(article.category, { name: article.category, count: 1 })
      }
    })

    return Array.from(categoryMap.values())
  }

  // 文档相关API
  static async getDocuments(params?: PaginationParams & SearchFilters): Promise<PaginatedResponse<Document>> {
    await simulateDelay()
    
    let filteredDocs = [...this.data.documents]

    // 应用搜索过滤
    if (params?.keyword) {
      const keyword = params.keyword.toLowerCase()
      filteredDocs = filteredDocs.filter(doc => 
        doc.title.toLowerCase().includes(keyword) ||
        doc.description.toLowerCase().includes(keyword)
      )
    }

    // 应用分类过滤
    if (params?.category) {
      filteredDocs = filteredDocs.filter(doc => 
        doc.category === params.category
      )
    }

    // 按发布日期排序（最新优先）
    filteredDocs.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())

    // 分页处理
    const page = params?.page || 1
    const limit = params?.limit || 10
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedDocs = filteredDocs.slice(startIndex, endIndex)

    return {
      items: paginatedDocs,
      total: filteredDocs.length,
      page,
      limit,
      totalPages: Math.ceil(filteredDocs.length / limit)
    }
  }

  static async getDocumentById(id: string): Promise<Document | null> {
    await simulateDelay()
    return this.data.documents.find(doc => doc.id === id) || null
  }

  static async getDocumentCategories(): Promise<Array<{ name: string; count: number }>> {
    await simulateDelay()
    const categoryMap = new Map()
    
    this.data.documents.forEach(doc => {
      if (categoryMap.has(doc.category)) {
        categoryMap.get(doc.category).count++
      } else {
        categoryMap.set(doc.category, { name: doc.category, count: 1 })
      }
    })

    return Array.from(categoryMap.values())
  }

  // 页面相关API
  static async getPageBySlug(slug: string): Promise<Page | null> {
    await simulateDelay()
    return this.data.pages.find(page => page.slug === slug) || null
  }

  // 搜索API
  static async globalSearch(keyword: string, limit: number = 20): Promise<{
    products: Product[]
    news: NewsArticle[]
    documents: Document[]
    total: number
  }> {
    await simulateDelay()
    
    const lowerKeyword = keyword.toLowerCase()
    
    // 搜索产品
    const products = this.data.products.filter(product =>
      product.name.toLowerCase().includes(lowerKeyword) ||
      product.description.toLowerCase().includes(lowerKeyword)
    ).slice(0, Math.floor(limit / 3))

    // 搜索新闻
    const news = this.data.news.filter(article =>
      article.title.toLowerCase().includes(lowerKeyword) ||
      article.excerpt.toLowerCase().includes(lowerKeyword)
    ).slice(0, Math.floor(limit / 3))

    // 搜索文档
    const documents = this.data.documents.filter(doc =>
      doc.title.toLowerCase().includes(lowerKeyword) ||
      doc.description.toLowerCase().includes(lowerKeyword)
    ).slice(0, Math.floor(limit / 3))

    return {
      products,
      news,
      documents,
      total: products.length + news.length + documents.length
    }
  }
}