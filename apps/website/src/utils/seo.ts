/**
 * SEO优化工具函数
 */

interface SEOData {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  author?: string
  publishDate?: string
}

/**
 * 更新页面SEO信息
 */
export function updateSEO(data: SEOData) {
  // 更新页面标题
  if (data.title) {
    document.title = data.title
  }

  // 更新或创建meta标签
  const updateMetaTag = (name: string, content: string, property?: boolean) => {
    if (!content) return
    
    const attribute = property ? 'property' : 'name'
    const selector = `meta[${attribute}="${name}"]`
    let meta = document.querySelector(selector) as HTMLMetaElement
    
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute(attribute, name)
      document.head.appendChild(meta)
    }
    
    meta.setAttribute('content', content)
  }

  // 基础SEO标签
  updateMetaTag('description', data.description || '')
  updateMetaTag('keywords', data.keywords?.join(', ') || '')
  updateMetaTag('author', data.author || 'Assay Biotechnology')

  // Open Graph标签
  updateMetaTag('og:title', data.title || '', true)
  updateMetaTag('og:description', data.description || '', true)
  updateMetaTag('og:type', data.type || 'website', true)
  updateMetaTag('og:url', data.url || window.location.href, true)
  updateMetaTag('og:site_name', 'Assay Biotechnology - 上海安净生物技术有限公司', true)
  
  if (data.image) {
    updateMetaTag('og:image', data.image, true)
    updateMetaTag('og:image:width', '1200', true)
    updateMetaTag('og:image:height', '630', true)
  }

  // Twitter Card标签
  updateMetaTag('twitter:card', 'summary_large_image')
  updateMetaTag('twitter:title', data.title || '')
  updateMetaTag('twitter:description', data.description || '')
  
  if (data.image) {
    updateMetaTag('twitter:image', data.image)
  }

  // 文章特定标签
  if (data.type === 'article' && data.publishDate) {
    updateMetaTag('article:published_time', data.publishDate, true)
    updateMetaTag('article:author', data.author || 'Assay Bio Team', true)
  }

  // 结构化数据
  updateStructuredData(data)
}

/**
 * 更新结构化数据 (JSON-LD)
 */
function updateStructuredData(data: SEOData) {
  // 移除旧的结构化数据
  const existingScript = document.querySelector('script[type="application/ld+json"]')
  if (existingScript) {
    existingScript.remove()
  }

  let structuredData: any = {}

  // 基础组织信息
  if (data.type === 'website' || !data.type) {
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Assay Biotechnology',
      alternateName: '上海安净生物技术有限公司',
      description: '专注于水中微生物检测技术及方法的研发、引进和推广',
      url: window.location.origin,
      logo: `${window.location.origin}/images/logo.svg`,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '021-XXXXXXXX',
        contactType: 'customer service',
        email: 'info@assaybio.cn',
        availableLanguage: ['Chinese', 'English']
      },
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'CN',
        addressRegion: '上海市',
        addressLocality: '上海市'
      },
      foundingDate: '2009',
      industry: '生物技术',
      keywords: '水质检测,微生物检测,生物技术,检测设备'
    }
  }

  // 产品页面结构化数据
  if (data.type === 'product') {
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: data.title,
      description: data.description,
      url: data.url || window.location.href,
      manufacturer: {
        '@type': 'Organization',
        name: 'Assay Biotechnology'
      },
      category: '检测设备'
    }
  }

  // 文章页面结构化数据
  if (data.type === 'article') {
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.title,
      description: data.description,
      url: data.url || window.location.href,
      datePublished: data.publishDate,
      author: {
        '@type': 'Organization',
        name: data.author || 'Assay Bio Team'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Assay Biotechnology',
        logo: {
          '@type': 'ImageObject',
          url: `${window.location.origin}/images/logo.svg`
        }
      }
    }
  }

  // 插入新的结构化数据
  if (Object.keys(structuredData).length > 0) {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(structuredData)
    document.head.appendChild(script)
  }
}

/**
 * 生成面包屑导航结构化数据
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }

  // 移除旧的面包屑结构化数据
  const existingBreadcrumb = document.querySelector('script[data-schema="breadcrumb"]')
  if (existingBreadcrumb) {
    existingBreadcrumb.remove()
  }

  // 插入新的面包屑结构化数据
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.setAttribute('data-schema', 'breadcrumb')
  script.textContent = JSON.stringify(breadcrumbList)
  document.head.appendChild(script)
}

/**
 * 为搜索引擎生成站点地图数据
 */
export function generateSitemap() {
  const routes = [
    { url: '/', priority: 1.0, changefreq: 'weekly' },
    { url: '/about', priority: 0.8, changefreq: 'monthly' },
    { url: '/products', priority: 0.9, changefreq: 'weekly' },
    { url: '/news', priority: 0.7, changefreq: 'daily' },
    { url: '/documents', priority: 0.6, changefreq: 'weekly' },
    { url: '/contact', priority: 0.5, changefreq: 'monthly' }
  ]

  return routes.map(route => ({
    ...route,
    url: `${window.location.origin}${route.url}`,
    lastmod: new Date().toISOString().split('T')[0]
  }))
}

/**
 * 预加载关键页面资源
 */
export function preloadCriticalResources() {
  const criticalResources = [
    '/images/logo.svg',
    '/images/hero-bg.jpg'
  ]

  criticalResources.forEach(resource => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = resource.endsWith('.svg') ? 'image' : 'image'
    link.href = resource
    document.head.appendChild(link)
  })
}

/**
 * 设置页面语言属性
 */
export function setPageLanguage(lang: string = 'zh-CN') {
  document.documentElement.lang = lang
}

/**
 * 优化页面加载性能
 */
export function optimizePageLoad() {
  // 预连接到外部域名
  const domains = ['fonts.googleapis.com', 'fonts.gstatic.com']
  domains.forEach(domain => {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = `https://${domain}`
    document.head.appendChild(link)
  })

  // 设置viewport
  let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement
  if (!viewport) {
    viewport = document.createElement('meta')
    viewport.name = 'viewport'
    document.head.appendChild(viewport)
  }
  viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0'

  // 设置字符编码
  let charset = document.querySelector('meta[charset]')
  if (!charset) {
    charset = document.createElement('meta')
    charset.setAttribute('charset', 'UTF-8')
    document.head.insertBefore(charset, document.head.firstChild)
  }
}

/**
 * 默认SEO配置
 */
export const defaultSEO: SEOData = {
  title: 'Assay Biotechnology - 专业水质微生物检测解决方案',
  description: 'Assay Biotechnology成立于2009年，专注于水中微生物检测技术及方法的研发、引进和推广。为企事业单位提供专业的水质检测解决方案，包括检测设备、试剂产品和技术服务。',
  keywords: [
    '水质检测',
    '微生物检测', 
    'Assay Biotechnology',
    '安净生物',
    '检测设备',
    '生物技术',
    '水质分析',
    'IDEXX',
    '大肠菌群检测',
    '上海生物技术公司'
  ],
  author: 'Assay Biotechnology',
  type: 'website'
}