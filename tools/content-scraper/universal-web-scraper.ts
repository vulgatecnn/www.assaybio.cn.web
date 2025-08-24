/**
 * 通用网站抓取器
 * Playwright + jsdom 混合方案
 * 智能选择最优抓取策略
 */

import { JSDOM } from 'jsdom';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import {
  ScrapingConfig,
  ScrapingResult,
  BatchScrapingResult,
  ScrapingFailure,
  ScrapingSummary,
  WebScraper,
  StrategyAnalysis,
  ScrapingStrategy,
  PageMetadata,
  AssetInfo,
  ScrapingError,
  TimeoutError,
  NetworkError,
  ContentError,
  ScrapingPresets
} from './types/universal-scraper-types';

export class UniversalWebScraper implements WebScraper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: Required<ScrapingConfig>;
  
  // 性能统计
  private stats = {
    totalRequests: 0,
    jsDomRequests: 0,
    playwrightRequests: 0,
    successfulRequests: 0,
    failedRequests: 0
  };

  constructor(config: ScrapingConfig) {
    this.config = this.mergeWithDefaults(config);
  }

  // === 公共接口 ===

  /**
   * 抓取单个网页
   */
  async scrape(url: string, config?: Partial<ScrapingConfig>): Promise<ScrapingResult> {
    const mergedConfig = { ...this.config, ...config };
    const startTime = Date.now();
    
    try {
      console.log(`🔍 开始抓取: ${url}`);
      
      // 1. 策略分析和选择
      const strategy = await this.selectOptimalStrategy(url, mergedConfig);
      console.log(`📊 选择策略: ${strategy.name} (得分: ${strategy.score})`);
      
      // 2. 执行抓取
      let result: ScrapingResult;
      if (strategy.name === 'jsdom') {
        result = await this.scrapeWithJsdom(url, mergedConfig);
      } else {
        result = await this.scrapeWithPlaywright(url, mergedConfig);
      }
      
      result.processingTime = Date.now() - startTime;
      result.strategy = strategy.name;
      
      this.updateStats('success', strategy.name);
      console.log(`✅ 抓取成功: ${url} (${result.processingTime}ms)`);
      
      return result;
      
    } catch (error) {
      this.updateStats('failure');
      console.error(`❌ 抓取失败: ${url}`, error);
      throw new ScrapingError(`Failed to scrape ${url}: ${error}`, url);
    }
  }

  /**
   * 批量抓取多个网页
   */
  async scrapeMultiple(urls: string[], config?: Partial<ScrapingConfig>): Promise<BatchScrapingResult> {
    const mergedConfig = { ...this.config, ...config };
    const startTime = Date.now();
    
    console.log(`🚀 开始批量抓取 ${urls.length} 个URL`);
    
    const results: ScrapingResult[] = [];
    const failures: ScrapingFailure[] = [];
    
    // 并发控制 - 分批处理
    const batches = this.chunkArray(urls, mergedConfig.batchSize);
    
    for (const batch of batches) {
      const promises = batch.map(async (url) => {
        let retryCount = 0;
        
        while (retryCount < mergedConfig.retryAttempts) {
          try {
            const result = await this.scrape(url, mergedConfig);
            results.push(result);
            return;
          } catch (error) {
            retryCount++;
            
            if (retryCount >= mergedConfig.retryAttempts) {
              failures.push({
                url,
                error: error instanceof Error ? error.message : String(error),
                retryCount,
                timestamp: new Date().toISOString()
              });
            } else {
              console.log(`⏳ 重试 ${url} (${retryCount}/${mergedConfig.retryAttempts})`);
              await this.delay(mergedConfig.delay * retryCount);
            }
          }
        }
      });
      
      // 限制并发数
      await this.limitConcurrency(promises, mergedConfig.concurrency);
      
      // 批次间延迟
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.delay(mergedConfig.delay);
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const summary = this.generateSummary(results);
    
    console.log(`📊 批量抓取完成: ${results.length}成功, ${failures.length}失败, 耗时${Math.round(duration/1000)}秒`);
    
    return {
      totalPages: urls.length,
      successCount: results.length,
      failureCount: failures.length,
      results,
      failures,
      summary,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration
    };
  }

  /**
   * 检查是否支持抓取指定URL
   */
  async isSupported(url: string): Promise<boolean> {
    try {
      new URL(url); // 验证URL格式
      const protocol = new URL(url).protocol;
      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    console.log('🧹 抓取器资源清理完成');
  }

  // === 策略选择 ===

  /**
   * 智能选择最优抓取策略
   */
  private async selectOptimalStrategy(url: string, config: Required<ScrapingConfig>): Promise<ScrapingStrategy> {
    if (config.strategy !== 'auto') {
      return {
        name: config.strategy,
        score: 100,
        reasons: ['用户指定策略']
      };
    }

    try {
      const analysis = await this.analyzePageRequirements(url);
      return this.calculateOptimalStrategy(analysis);
    } catch (error) {
      console.warn(`策略分析失败，使用jsdom: ${error}`);
      return {
        name: 'jsdom',
        score: 60,
        reasons: ['默认策略(分析失败)']
      };
    }
  }

  /**
   * 分析页面抓取需求
   */
  private async analyzePageRequirements(url: string): Promise<StrategyAnalysis['factors']> {
    try {
      // 快速HEAD请求获取基本信息
      const headResponse = await axios.head(url, {
        timeout: 5000,
        headers: { 'User-Agent': this.config.userAgent }
      });

      const contentType = headResponse.headers['content-type'] || '';
      const isHtml = contentType.includes('text/html');
      
      if (!isHtml) {
        return {
          hasJavaScript: false,
          hasDynamicContent: false,
          isSimpleHtml: true,
          responseTime: 0,
          contentComplexity: 'low'
        };
      }

      // 快速GET请求分析内容
      const response = await axios.get(url, {
        timeout: 10000,
        headers: { 'User-Agent': this.config.userAgent }
      });

      const html = response.data;
      const responseTime = parseInt(response.headers['x-response-time'] || '0');
      
      return {
        hasJavaScript: this.detectJavaScript(html),
        hasDynamicContent: this.detectDynamicContent(html),
        isSimpleHtml: this.isSimpleHtml(html),
        responseTime,
        contentComplexity: this.analyzeContentComplexity(html)
      };
      
    } catch (error) {
      // 网络错误时的保守估计
      return {
        hasJavaScript: true,
        hasDynamicContent: true,
        isSimpleHtml: false,
        responseTime: 1000,
        contentComplexity: 'medium'
      };
    }
  }

  /**
   * 计算最优策略
   */
  private calculateOptimalStrategy(factors: StrategyAnalysis['factors']): ScrapingStrategy {
    let jsDomScore = 100;
    let playwrightScore = 40;
    
    const jsDomReasons: string[] = ['轻量快速'];
    const playwrightReasons: string[] = ['全功能支持'];

    // JavaScript因素 (关键)
    if (factors.hasJavaScript) {
      jsDomScore -= 40;
      playwrightScore += 30;
      playwrightReasons.push('检测到JavaScript');
    } else {
      jsDomReasons.push('无JavaScript需求');
    }

    // 动态内容因素
    if (factors.hasDynamicContent) {
      jsDomScore -= 30;
      playwrightScore += 25;
      playwrightReasons.push('检测到动态内容');
    } else {
      jsDomReasons.push('静态内容');
    }

    // 内容复杂度因素
    switch (factors.contentComplexity) {
      case 'low':
        jsDomScore += 20;
        jsDomReasons.push('低复杂度内容');
        break;
      case 'high':
        jsDomScore -= 20;
        playwrightScore += 20;
        playwrightReasons.push('高复杂度内容');
        break;
    }

    // 响应时间因素
    if (factors.responseTime > 2000) {
      playwrightScore += 10;
      playwrightReasons.push('响应较慢，适合等待');
    } else {
      jsDomScore += 10;
      jsDomReasons.push('响应快速');
    }

    // 简单HTML优势
    if (factors.isSimpleHtml) {
      jsDomScore += 15;
      jsDomReasons.push('简单HTML结构');
    }

    // 确保分数在合理范围内
    jsDomScore = Math.max(0, Math.min(100, jsDomScore));
    playwrightScore = Math.max(0, Math.min(100, playwrightScore));

    if (jsDomScore >= playwrightScore) {
      return {
        name: 'jsdom',
        score: jsDomScore,
        reasons: jsDomReasons
      };
    } else {
      return {
        name: 'playwright',
        score: playwrightScore,
        reasons: playwrightReasons
      };
    }
  }

  // === 内容检测方法 ===

  private detectJavaScript(html: string): boolean {
    const indicators = [
      /<script/i,
      /document\.addEventListener/i,
      /window\.onload/i,
      /@click=/i,
      /v-if=/i,
      /ng-/i,
      /react/i,
      /vue/i,
      /angular/i
    ];
    
    return indicators.some(pattern => pattern.test(html));
  }

  private detectDynamicContent(html: string): boolean {
    const indicators = [
      /loading/i,
      /spinner/i,
      /skeleton/i,
      /lazy.*load/i,
      /data-src=/i,
      /fetch.*api/i,
      /XMLHttpRequest/i,
      /$.ajax/i
    ];
    
    return indicators.some(pattern => pattern.test(html));
  }

  private isSimpleHtml(html: string): boolean {
    const scriptTags = (html.match(/<script/gi) || []).length;
    const styleTags = (html.match(/<style/gi) || []).length;
    const totalLength = html.length;
    
    return scriptTags < 3 && styleTags < 3 && totalLength < 100000;
  }

  private analyzeContentComplexity(html: string): 'low' | 'medium' | 'high' {
    const domNodes = (html.match(/</g) || []).length;
    const scripts = (html.match(/<script/gi) || []).length;
    const iframes = (html.match(/<iframe/gi) || []).length;
    
    if (domNodes > 1000 || scripts > 10 || iframes > 2) {
      return 'high';
    } else if (domNodes > 300 || scripts > 3) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  // === jsdom 抓取实现 ===

  private async scrapeWithJsdom(url: string, config: Required<ScrapingConfig>): Promise<ScrapingResult> {
    const startTime = Date.now();
    
    try {
      // HTTP请求获取页面内容
      const response = await axios.get(url, {
        timeout: config.timeout,
        headers: {
          'User-Agent': config.userAgent,
          ...config.headers
        },
        maxContentLength: config.maxContentLength,
        validateStatus: (status) => status < 400
      });

      // 使用jsdom解析HTML
      const dom = new JSDOM(response.data, {
        url,
        pretendToBeVisual: true,
        resources: 'usable'
      });

      const document = dom.window.document;
      const window = dom.window;

      // 等待一下让可能的脚本执行
      if (config.enableJavaScript) {
        await this.delay(1000);
      }

      // 提取内容
      const title = document.title || '';
      const textContent = this.extractTextContent(document);
      const htmlContent = config.saveRawHtml ? response.data : undefined;
      const metadata = await this.extractMetadataFromDocument(document, response, Date.now() - startTime);
      const assets = config.downloadAssets ? this.extractAssetsFromDocument(document, url) : undefined;

      // 清理DOM
      dom.window.close();

      return {
        success: true,
        url,
        title,
        content: textContent,
        htmlContent,
        metadata,
        assets,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        strategy: 'jsdom'
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new TimeoutError(url, 'jsdom');
        } else if (error.response) {
          throw new NetworkError(url, error.response.status, 'jsdom');
        }
      }
      throw new ContentError(url, error instanceof Error ? error.message : String(error), 'jsdom');
    }
  }

  // === Playwright 抓取实现 ===

  private async scrapeWithPlaywright(url: string, config: Required<ScrapingConfig>): Promise<ScrapingResult> {
    const startTime = Date.now();
    
    try {
      await this.ensureBrowserContext(config);
      const page = await this.context!.newPage();
      
      // 页面导航
      const response = await page.goto(url, {
        waitUntil: config.waitForNetworkIdle ? 'networkidle' : 'domcontentloaded',
        timeout: config.timeout
      });

      if (!response || !response.ok()) {
        throw new NetworkError(url, response?.status(), 'playwright');
      }

      // 等待页面稳定
      await this.delay(config.delay);

      // 提取内容
      const title = await page.title();
      const textContent = await page.textContent('body') || '';
      const htmlContent = config.saveRawHtml ? await page.content() : undefined;
      const metadata = await this.extractMetadataFromPage(page, response, Date.now() - startTime);
      const assets = config.downloadAssets ? await this.extractAssetsFromPage(page, url) : undefined;

      await page.close();

      return {
        success: true,
        url,
        title,
        content: textContent,
        htmlContent,
        metadata,
        assets,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        strategy: 'playwright'
      };

    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new TimeoutError(url, 'playwright');
      }
      throw new ContentError(url, error instanceof Error ? error.message : String(error), 'playwright');
    }
  }

  // === 工具方法 ===

  private mergeWithDefaults(config: ScrapingConfig): Required<ScrapingConfig> {
    return {
      baseUrl: config.baseUrl,
      maxPages: config.maxPages ?? 10,
      delay: config.delay ?? 1000,
      timeout: config.timeout ?? 30000,
      retryAttempts: config.retryAttempts ?? 2,
      
      strategy: config.strategy ?? 'auto',
      enableJavaScript: config.enableJavaScript ?? true,
      waitForNetworkIdle: config.waitForNetworkIdle ?? false,
      
      outputDir: config.outputDir ?? './scraped-data',
      saveRawHtml: config.saveRawHtml ?? false,
      saveProcessedText: config.saveProcessedText ?? true,
      downloadAssets: config.downloadAssets ?? false,
      
      userAgent: config.userAgent ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      headers: config.headers ?? {},
      cookies: config.cookies ?? [],
      
      includePatterns: config.includePatterns ?? [],
      excludePatterns: config.excludePatterns ?? [],
      maxContentLength: config.maxContentLength ?? 10 * 1024 * 1024, // 10MB
      
      concurrency: config.concurrency ?? 3,
      batchSize: config.batchSize ?? 5
    };
  }

  private async ensureBrowserContext(config: Required<ScrapingConfig>): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true
      });
    }

    if (!this.context) {
      this.context = await this.browser.newContext({
        userAgent: config.userAgent,
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
        javaScriptEnabled: config.enableJavaScript
      });

      // 设置cookies
      if (config.cookies.length > 0) {
        await this.context.addCookies(config.cookies.map(c => ({
          name: c.name,
          value: c.value,
          domain: c.domain || new URL(config.baseUrl).hostname,
          path: '/'
        })));
      }
    }
  }

  private extractTextContent(document: Document): string {
    // 移除script和style标签
    const scripts = document.querySelectorAll('script, style');
    scripts.forEach(el => el.remove());
    
    // 获取body文本，如果没有body则获取整个文档
    const body = document.body || document.documentElement;
    return body.textContent?.trim() || '';
  }

  private async extractMetadataFromDocument(document: Document, response: any, loadTime: number): Promise<PageMetadata> {
    const metaTags: Record<string, string> = {};
    const metas = document.querySelectorAll('meta');
    metas.forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property') || meta.getAttribute('http-equiv');
      const content = meta.getAttribute('content');
      if (name && content) {
        metaTags[name] = content;
      }
    });

    return {
      description: metaTags['description'],
      keywords: metaTags['keywords']?.split(',').map(k => k.trim()) || [],
      author: metaTags['author'],
      language: document.documentElement.getAttribute('lang') || 'unknown',
      charset: document.characterSet || 'unknown',
      
      wordCount: this.extractTextContent(document).split(/\s+/).length,
      imageCount: document.querySelectorAll('img').length,
      linkCount: document.querySelectorAll('a[href]').length,
      
      responseStatus: response.status || 200,
      contentType: response.headers['content-type'] || 'text/html',
      loadTime,
      
      metaTags,
      headings: {
        h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent || ''),
        h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent || ''),
        h3: Array.from(document.querySelectorAll('h3')).map(h => h.textContent || '')
      }
    };
  }

  private async extractMetadataFromPage(page: Page, response: any, loadTime: number): Promise<PageMetadata> {
    const metaTags = await page.$$eval('meta', metas => 
      Object.fromEntries(
        metas.map(meta => {
          const name = meta.getAttribute('name') || meta.getAttribute('property') || meta.getAttribute('http-equiv');
          const content = meta.getAttribute('content');
          return name && content ? [name, content] : null;
        }).filter(Boolean) as [string, string][]
      )
    );

    const textContent = await page.textContent('body') || '';
    const imageCount = await page.$$eval('img', imgs => imgs.length);
    const linkCount = await page.$$eval('a[href]', links => links.length);
    const language = await page.getAttribute('html', 'lang') || 'unknown';

    return {
      description: metaTags['description'],
      keywords: metaTags['keywords']?.split(',').map(k => k.trim()) || [],
      author: metaTags['author'],
      language,
      charset: 'UTF-8',
      
      wordCount: textContent.split(/\s+/).length,
      imageCount,
      linkCount,
      
      responseStatus: response.status(),
      contentType: response.headers()['content-type'] || 'text/html',
      loadTime,
      
      metaTags,
      headings: {
        h1: await page.$$eval('h1', headings => headings.map(h => h.textContent || '')),
        h2: await page.$$eval('h2', headings => headings.map(h => h.textContent || '')),
        h3: await page.$$eval('h3', headings => headings.map(h => h.textContent || ''))
      }
    };
  }

  private extractAssetsFromDocument(document: Document, baseUrl: string): AssetInfo[] {
    const assets: AssetInfo[] = [];
    
    // 图片
    document.querySelectorAll('img[src]').forEach(img => {
      const src = img.getAttribute('src');
      if (src) {
        assets.push({
          type: 'image',
          url: new URL(src, baseUrl).toString()
        });
      }
    });
    
    // 样式表
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        assets.push({
          type: 'stylesheet',
          url: new URL(href, baseUrl).toString()
        });
      }
    });
    
    // 脚本
    document.querySelectorAll('script[src]').forEach(script => {
      const src = script.getAttribute('src');
      if (src) {
        assets.push({
          type: 'script',
          url: new URL(src, baseUrl).toString()
        });
      }
    });
    
    return assets;
  }

  private async extractAssetsFromPage(page: Page, baseUrl: string): Promise<AssetInfo[]> {
    const assets = await page.$$eval('img[src], link[rel="stylesheet"], script[src]', (elements, baseUrl) => {
      return elements.map(el => {
        const src = el.getAttribute('src') || el.getAttribute('href');
        if (!src) return null;
        
        let type: AssetInfo['type'] = 'image';
        if (el.tagName === 'LINK') type = 'stylesheet';
        else if (el.tagName === 'SCRIPT') type = 'script';
        
        return {
          type,
          url: new URL(src, baseUrl).toString()
        };
      }).filter(Boolean);
    }, baseUrl);
    
    return assets as AssetInfo[];
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async limitConcurrency<T>(promises: Promise<T>[], limit: number): Promise<T[]> {
    const results: T[] = [];
    for (let i = 0; i < promises.length; i += limit) {
      const batch = promises.slice(i, i + limit);
      const batchResults = await Promise.allSettled(batch);
      results.push(...batchResults.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<T>).value));
    }
    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateStats(type: 'success' | 'failure', strategy?: 'jsdom' | 'playwright'): void {
    this.stats.totalRequests++;
    
    if (type === 'success') {
      this.stats.successfulRequests++;
      if (strategy === 'jsdom') this.stats.jsDomRequests++;
      else if (strategy === 'playwright') this.stats.playwrightRequests++;
    } else {
      this.stats.failedRequests++;
    }
  }

  private generateSummary(results: ScrapingResult[]): ScrapingSummary {
    const totalWords = results.reduce((sum, r) => sum + r.metadata.wordCount, 0);
    const totalImages = results.reduce((sum, r) => sum + r.metadata.imageCount, 0);
    const totalLinks = results.reduce((sum, r) => sum + r.metadata.linkCount, 0);
    const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
    
    const strategyCounts = results.reduce((counts, r) => {
      counts[r.strategy]++;
      return counts;
    }, { jsdom: 0, playwright: 0 });
    
    const contentTypes = results.reduce((types, r) => {
      const type = r.metadata.contentType;
      types[type] = (types[type] || 0) + 1;
      return types;
    }, {} as Record<string, number>);
    
    const statusCodes = results.reduce((codes, r) => {
      const code = r.metadata.responseStatus;
      codes[code] = (codes[code] || 0) + 1;
      return codes;
    }, {} as Record<number, number>);
    
    return {
      totalWords,
      totalImages,
      totalLinks,
      avgProcessingTime,
      strategyCounts,
      contentTypes,
      statusCodes
    };
  }

  // === 静态工厂方法 ===

  /**
   * 使用预设配置创建抓取器
   */
  static withPreset(baseUrl: string, preset: keyof typeof ScrapingPresets, overrides?: Partial<ScrapingConfig>): UniversalWebScraper {
    const presetConfig = ScrapingPresets[preset];
    const config = {
      baseUrl,
      ...presetConfig,
      ...overrides
    };
    
    return new UniversalWebScraper(config);
  }

  /**
   * 获取性能统计
   */
  getStats() {
    return { ...this.stats };
  }
}

// === 便捷导出 ===

export { ScrapingPresets } from './types/universal-scraper-types';
export type { ScrapingConfig, ScrapingResult, BatchScrapingResult } from './types/universal-scraper-types';