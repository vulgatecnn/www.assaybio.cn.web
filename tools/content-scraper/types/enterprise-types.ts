/**
 * 企业级抓取器类型定义
 * 扩展基础类型，支持更复杂的数据结构和元数据
 */

// 扩展基础类型
export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  htmlContent: string;
  metadata: PageMetadata;
  timestamp: string;
  discoveryInfo?: {
    type: string;
    depth: number;
    discoveredFrom: string;
  };
}

export interface PageMetadata {
  description?: string;
  keywords?: string[];
  author?: string;
  publishDate?: string;
  category?: string;
  language?: string;
  wordCount?: number;
  images?: number;
  links?: number;
  structuredData?: any;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  features: string[];
  specifications?: Record<string, any>;
  images: string[];
  documents: string[];
  price?: string;
  url: string;
  detectedSpecs?: Record<string, string>;
  relatedProducts?: string[];
}

export interface Company {
  name: string;
  description: string;
  established?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  businessScope: string[];
  certifications?: string[];
  leadership?: Array<{
    name: string;
    position: string;
    description?: string;
  }>;
}

export interface TechnicalDocument {
  title: string;
  type: 'manual' | 'specification' | 'research' | 'case-study' | 'datasheet' | 'whitepaper';
  category: string;
  description: string;
  downloadUrl?: string;
  publishDate?: string;
  tags: string[];
  fileSize?: number;
  fileFormat?: string;
  downloadPath?: string;
}

export interface NewsArticle {
  title: string;
  content: string;
  publishDate: string;
  category: string;
  author?: string;
  tags: string[];
  url: string;
  summary?: string;
  imageUrl?: string;
}

// 企业级特有的类型定义

/**
 * URL发现信息
 */
export interface DiscoveredURL {
  url: string;
  depth: number;
  type: string; // homepage, product, about, news, literature, contact, detail, general
  discoveredFrom?: string;
  timestamp: string;
  priority?: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * 资源文件信息
 */
export interface ResourceFile {
  url: string;
  type: string; // image, document, media
  filename: string;
  size: number;
  downloadPath: string;
  timestamp: string;
  mimeType?: string;
  checksum?: string;
  downloadStatus?: 'pending' | 'downloading' | 'completed' | 'failed';
  error?: string;
}

/**
 * 站点地图条目
 */
export interface SiteMapEntry {
  url: string;
  title: string;
  type: string;
  depth: number;
  lastModified: string;
  size: number;
  priority?: number;
  changeFreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

/**
 * 抓取统计信息
 */
export interface ScrapingStats {
  startTime: number;
  pagesProcessed: number;
  resourcesDownloaded: number;
  totalDataSize: number;
  errors: number;
  warnings: number;
}

/**
 * URL模式信息
 */
export interface URLPattern {
  pattern: string;
  type: string;
  description: string;
  examples: string[];
  isActive: boolean;
}

/**
 * 内容分析结果
 */
export interface ContentAnalysis {
  contentType: 'product' | 'news' | 'company' | 'technical' | 'general';
  confidence: number;
  extractedEntities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  keyTopics: string[];
  language: string;
  readabilityScore?: number;
}

/**
 * 质量检查结果
 */
export interface QualityCheck {
  completeness: number; // 0-1
  accuracy: number; // 0-1
  freshness: number; // 0-1
  issues: Array<{
    type: 'missing_data' | 'broken_link' | 'low_quality' | 'duplicate';
    severity: 'low' | 'medium' | 'high';
    description: string;
    url?: string;
  }>;
}

/**
 * 企业级抓取配置
 */
export interface EnterpriseScrapingConfig {
  baseUrl: string;
  maxPages?: number;
  delay?: number;
  outputDir?: string;
  downloadResources?: boolean;
  maxResourceSize?: number; // bytes
  enableJavaScript?: boolean;
  followExternalLinks?: boolean;
  maxDepth?: number;
  retryAttempts?: number;
  concurrency?: number;
  userAgent?: string;
  
  // 高级配置
  respectRobotsTxt?: boolean;
  useProxies?: boolean;
  proxyList?: string[];
  customHeaders?: Record<string, string>;
  cookieJar?: boolean;
  sessionPersistence?: boolean;
  
  // 内容过滤
  includePatterns?: string[];
  excludePatterns?: string[];
  minPageSize?: number;
  maxPageSize?: number;
  
  // 质量控制
  enableQualityCheck?: boolean;
  minQualityScore?: number;
  duplicateThreshold?: number;
  
  // 高级功能
  enableAI?: boolean;
  aiModel?: string;
  enableScreenshot?: boolean;
  screenshotQuality?: number;
}

/**
 * 企业级抓取结果
 */
export interface EnterpriseScrapingResult {
  company: Company;
  products: Product[];
  technicalDocs: TechnicalDocument[];
  news: NewsArticle[];
  pages: ScrapedPage[];
  resources: ResourceFile[];
  siteMap: SiteMapEntry[];
  metadata: {
    totalPages: number;
    totalResources: number;
    totalSize: number;
    scrapedAt: string;
    duration: string;
    errors: string[];
    coverage: {
      discoveredUrls: number;
      processedUrls: number;
      failedUrls: number;
      skippedUrls: number;
    };
    qualityMetrics?: {
      averageQualityScore: number;
      completenessRate: number;
      duplicateRate: number;
      errorRate: number;
    };
  };
  analysis?: {
    urlPatterns: URLPattern[];
    contentDistribution: Record<string, number>;
    technologyStack: string[];
    seoAnalysis?: {
      totalPages: number;
      pagesWithTitles: number;
      pagesWithDescriptions: number;
      averageTitleLength: number;
      averageDescriptionLength: number;
    };
  };
}

/**
 * 抓取任务配置
 */
export interface ScrapingTask {
  id: string;
  name: string;
  config: EnterpriseScrapingConfig;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress: {
    phase: string;
    percentage: number;
    currentUrl?: string;
    processedPages: number;
    totalPages: number;
  };
  startTime?: string;
  endTime?: string;
  result?: EnterpriseScrapingResult;
  error?: string;
}

/**
 * 批量任务管理
 */
export interface BatchScrapingConfig {
  tasks: ScrapingTask[];
  parallelTasks: number;
  globalConfig: Partial<EnterpriseScrapingConfig>;
  notifications: {
    email?: string;
    webhook?: string;
    onComplete: boolean;
    onError: boolean;
  };
}

/**
 * 缓存项
 */
export interface CacheItem {
  key: string;
  url: string;
  content: any;
  timestamp: number;
  ttl: number; // Time to live in seconds
  checksum: string;
  compressionType?: 'gzip' | 'br';
  size: number;
}

/**
 * 抓取会话
 */
export interface ScrapingSession {
  id: string;
  startTime: string;
  endTime?: string;
  config: EnterpriseScrapingConfig;
  stats: ScrapingStats;
  visitedUrls: Set<string>;
  failedUrls: Set<string>;
  cache: Map<string, CacheItem>;
  checkpoints: Array<{
    timestamp: string;
    pagesProcessed: number;
    dataSize: number;
  }>;
}

/**
 * 监控指标
 */
export interface MonitoringMetrics {
  timestamp: string;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
  networkTraffic: number;
  requestsPerSecond: number;
  errorRate: number;
  averageResponseTime: number;
}

/**
 * 导出格式配置
 */
export interface ExportConfig {
  formats: Array<'json' | 'csv' | 'xml' | 'sql' | 'xlsx' | 'markdown'>;
  splitFiles?: boolean;
  compression?: 'zip' | 'gzip' | 'tar';
  includeImages?: boolean;
  includeRawHtml?: boolean;
  customSchema?: Record<string, any>;
}