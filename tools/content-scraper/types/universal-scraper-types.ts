/**
 * 通用网站抓取器类型定义
 * 支持任意网站的内容抓取
 */

// === 基础类型 ===
export interface ScrapingConfig {
  // 基础配置
  baseUrl: string;
  maxPages?: number;
  delay?: number;
  timeout?: number;
  retryAttempts?: number;
  
  // 抓取策略
  strategy?: 'jsdom' | 'playwright' | 'auto'; // auto = 智能选择
  enableJavaScript?: boolean;
  waitForNetworkIdle?: boolean;
  
  // 输出配置
  outputDir?: string;
  saveRawHtml?: boolean;
  saveProcessedText?: boolean;
  downloadAssets?: boolean;
  
  // 请求配置
  userAgent?: string;
  headers?: Record<string, string>;
  cookies?: Array<{name: string, value: string, domain?: string}>;
  
  // 内容过滤
  includePatterns?: string[];
  excludePatterns?: string[];
  maxContentLength?: number;
  
  // 并发控制
  concurrency?: number;
  batchSize?: number;
}

// === 抓取结果类型 ===
export interface ScrapingResult {
  success: boolean;
  url: string;
  title: string;
  content: string;
  htmlContent?: string;
  metadata: PageMetadata;
  assets?: AssetInfo[];
  timestamp: string;
  processingTime: number;
  strategy: 'jsdom' | 'playwright';
}

export interface PageMetadata {
  description?: string;
  keywords?: string[];
  author?: string;
  publishDate?: string;
  language?: string;
  charset?: string;
  
  // 页面统计
  wordCount: number;
  imageCount: number;
  linkCount: number;
  
  // 技术信息
  responseStatus: number;
  contentType: string;
  loadTime: number;
  
  // SEO信息
  metaTags: Record<string, string>;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
}

export interface AssetInfo {
  type: 'image' | 'stylesheet' | 'script' | 'document' | 'media';
  url: string;
  localPath?: string;
  size?: number;
  mimeType?: string;
}

// === 批量抓取结果 ===
export interface BatchScrapingResult {
  totalPages: number;
  successCount: number;
  failureCount: number;
  results: ScrapingResult[];
  failures: ScrapingFailure[];
  summary: ScrapingSummary;
  startTime: string;
  endTime: string;
  duration: number;
}

export interface ScrapingFailure {
  url: string;
  error: string;
  retryCount: number;
  timestamp: string;
  strategy?: 'jsdom' | 'playwright';
}

export interface ScrapingSummary {
  totalWords: number;
  totalImages: number;
  totalLinks: number;
  avgProcessingTime: number;
  strategyCounts: {
    jsdom: number;
    playwright: number;
  };
  contentTypes: Record<string, number>;
  statusCodes: Record<number, number>;
}

// === 抓取器接口 ===
export interface WebScraper {
  scrape(url: string, config?: Partial<ScrapingConfig>): Promise<ScrapingResult>;
  scrapeMultiple(urls: string[], config?: Partial<ScrapingConfig>): Promise<BatchScrapingResult>;
  isSupported(url: string, config?: Partial<ScrapingConfig>): Promise<boolean>;
  cleanup?(): Promise<void>;
}

// === 策略选择器 ===
export interface ScrapingStrategy {
  name: 'jsdom' | 'playwright';
  score: number; // 0-100, 越高越适合
  reasons: string[];
}

export interface StrategyAnalysis {
  recommended: ScrapingStrategy;
  alternatives: ScrapingStrategy[];
  factors: {
    hasJavaScript: boolean;
    hasDynamicContent: boolean;
    isSimpleHtml: boolean;
    responseTime: number;
    contentComplexity: 'low' | 'medium' | 'high';
  };
}

// === 错误类型 ===
export class ScrapingError extends Error {
  constructor(
    message: string,
    public url: string,
    public strategy?: 'jsdom' | 'playwright',
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'ScrapingError';
  }
}

export class TimeoutError extends ScrapingError {
  constructor(url: string, strategy?: 'jsdom' | 'playwright') {
    super(`Scraping timeout for ${url}`, url, strategy, true);
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends ScrapingError {
  constructor(url: string, statusCode?: number, strategy?: 'jsdom' | 'playwright') {
    super(`Network error for ${url}${statusCode ? ` (${statusCode})` : ''}`, url, strategy, true);
    this.name = 'NetworkError';
  }
}

export class ContentError extends ScrapingError {
  constructor(url: string, reason: string, strategy?: 'jsdom' | 'playwright') {
    super(`Content extraction error for ${url}: ${reason}`, url, strategy, false);
    this.name = 'ContentError';
  }
}

// === 工具类型 ===
export interface UrlValidator {
  isValid(url: string): boolean;
  normalize(url: string): string;
  isSameDomain(url1: string, url2: string): boolean;
}

export interface ContentExtractor {
  extractText(html: string): string;
  extractMetadata(html: string): PageMetadata;
  extractAssets(html: string, baseUrl: string): AssetInfo[];
  extractLinks(html: string, baseUrl: string): string[];
}

// === 配置预设 ===
export const ScrapingPresets = {
  FAST: {
    strategy: 'jsdom' as const,
    enableJavaScript: false,
    timeout: 5000,
    retryAttempts: 1,
    concurrency: 5
  },
  
  BALANCED: {
    strategy: 'auto' as const,
    enableJavaScript: true,
    timeout: 15000,
    retryAttempts: 2,
    concurrency: 3
  },
  
  THOROUGH: {
    strategy: 'playwright' as const,
    enableJavaScript: true,
    waitForNetworkIdle: true,
    timeout: 30000,
    retryAttempts: 3,
    concurrency: 2,
    saveRawHtml: true,
    downloadAssets: true
  }
} as const;

export type ScrapingPresetName = keyof typeof ScrapingPresets;