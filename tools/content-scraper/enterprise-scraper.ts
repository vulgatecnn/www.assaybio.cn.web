/**
 * AssayBio 企业级全站抓取器
 * 100%内容覆盖，智能发现，资源完整下载
 * 
 * 核心特性：
 * - URL智能发现引擎
 * - 递归深度抓取
 * - 资源完整下载
 * - 内容智能分类
 * - 去重与缓存机制
 * - 并发控制与错误恢复
 * - 完整报告系统
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import { createWriteStream, createReadStream } from 'fs';
import { finished } from 'stream/promises';
import { 
  EnterpriseScrapingConfig, 
  EnterpriseScrapingResult, 
  ScrapedPage, 
  Product, 
  Company, 
  TechnicalDocument, 
  NewsArticle,
  DiscoveredURL,
  ResourceFile,
  SiteMapEntry,
  ScrapingStats
} from './types/enterprise-types';

export class AssayBioEnterpriseScraper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: EnterpriseScrapingConfig;
  
  // URL管理
  private discoveredUrls: Map<string, DiscoveredURL> = new Map();
  private processedUrls: Set<string> = new Set();
  private failedUrls: Set<string> = new Set();
  private urlQueue: string[] = [];
  
  // 内容存储
  private scrapedData: EnterpriseScrapingResult;
  private resources: Map<string, ResourceFile> = new Map();
  private siteMap: SiteMapEntry[] = [];
  
  // 统计信息
  private stats: ScrapingStats;
  
  // 并发控制
  private activeRequests = 0;
  private readonly maxConcurrency = 3;
  
  constructor(config: EnterpriseScrapingConfig) {
    this.config = {
      maxPages: 100,
      delay: 2000,
      outputDir: './enterprise-scraped-data',
      downloadResources: true,
      maxResourceSize: 50 * 1024 * 1024, // 50MB
      enableJavaScript: true,
      followExternalLinks: false,
      maxDepth: 5,
      retryAttempts: 3,
      concurrency: 3,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...config
    };

    this.scrapedData = {
      company: {} as Company,
      products: [],
      technicalDocs: [],
      news: [],
      pages: [],
      resources: [],
      siteMap: [],
      metadata: {
        totalPages: 0,
        totalResources: 0,
        totalSize: 0,
        scrapedAt: new Date().toISOString(),
        duration: '',
        errors: [],
        coverage: {
          discoveredUrls: 0,
          processedUrls: 0,
          failedUrls: 0,
          skippedUrls: 0
        }
      }
    };

    this.stats = {
      startTime: Date.now(),
      pagesProcessed: 0,
      resourcesDownloaded: 0,
      totalDataSize: 0,
      errors: 0,
      warnings: 0
    };
  }

  /**
   * 启动企业级抓取流程
   */
  async scrapeCompleteSite(): Promise<EnterpriseScrapingResult> {
    console.log('🚀 启动企业级全站抓取器...');
    console.log(`📊 目标网站: ${this.config.baseUrl}`);
    console.log(`⚙️ 最大页面数: ${this.config.maxPages}`);
    console.log(`🔗 最大深度: ${this.config.maxDepth}`);
    console.log(`💾 资源下载: ${this.config.downloadResources ? '启用' : '禁用'}`);

    try {
      // 1. 初始化浏览器环境
      await this.initializeBrowser();
      
      // 2. URL发现阶段
      console.log('\n🔍 阶段1: URL智能发现');
      await this.discoverAllUrls();
      
      // 3. 内容抓取阶段
      console.log('\n📄 阶段2: 内容全面抓取');
      await this.scrapeAllContent();
      
      // 4. 资源下载阶段
      if (this.config.downloadResources) {
        console.log('\n💾 阶段3: 资源完整下载');
        await this.downloadAllResources();
      }
      
      // 5. 内容分析与分类
      console.log('\n🤖 阶段4: 内容智能分析');
      await this.analyzeAndClassifyContent();
      
      // 6. 生成完整报告
      console.log('\n📋 阶段5: 生成完整报告');
      await this.generateComprehensiveReport();
      
      // 7. 保存所有数据
      await this.saveAllResults();
      
      console.log('\n✅ 企业级抓取任务完成！');
      this.printFinalStats();
      
      return this.scrapedData;
      
    } catch (error) {
      console.error('❌ 抓取过程发生严重错误:', error);
      this.stats.errors++;
      this.scrapedData.metadata.errors.push(`致命错误: ${error}`);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * 初始化浏览器环境
   */
  private async initializeBrowser(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: false,
        slowMo: 50,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      this.context = await this.browser.newContext({
        userAgent: this.config.userAgent,
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
        javaScriptEnabled: this.config.enableJavaScript
      });

      // 设置请求拦截器来记录资源
      await this.setupResourceInterception();
      
      console.log('✅ 浏览器环境初始化成功');
    } catch (error) {
      console.error('❌ 浏览器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 设置资源拦截器
   */
  private async setupResourceInterception(): Promise<void> {
    if (!this.context) return;

    await this.context.route('**/*', async (route, request) => {
      const url = request.url();
      const resourceType = request.resourceType();
      
      // 记录发现的资源
      if (this.shouldCaptureResource(resourceType, url)) {
        this.recordDiscoveredResource(url, resourceType);
      }
      
      await route.continue();
    });
  }

  /**
   * URL智能发现引擎
   */
  private async discoverAllUrls(): Promise<void> {
    // 添加初始URL
    this.addUrlToQueue(this.config.baseUrl, 0, 'homepage');
    
    const page = await this.context!.newPage();
    let currentDepth = 0;
    
    while (this.urlQueue.length > 0 && currentDepth < this.config.maxDepth!) {
      const currentBatch = this.urlQueue.splice(0, 10); // 批量处理
      
      console.log(`🔍 发现深度 ${currentDepth}: 处理 ${currentBatch.length} 个URL`);
      
      for (const url of currentBatch) {
        if (this.processedUrls.has(url)) continue;
        
        try {
          await this.discoverUrlsFromPage(page, url, currentDepth);
          await this.delay(this.config.delay! / 2); // 较短延迟用于发现
        } catch (error) {
          console.error(`⚠️ URL发现失败 ${url}:`, error);
          this.failedUrls.add(url);
        }
      }
      
      currentDepth++;
    }
    
    await page.close();
    
    console.log(`📊 URL发现完成:`);
    console.log(`   - 发现URL总数: ${this.discoveredUrls.size}`);
    console.log(`   - 待处理URL: ${Array.from(this.discoveredUrls.values()).filter(u => !this.processedUrls.has(u.url)).length}`);
    console.log(`   - 失败URL: ${this.failedUrls.size}`);
  }

  /**
   * 从页面发现新的URL
   */
  private async discoverUrlsFromPage(page: Page, url: string, depth: number): Promise<void> {
    try {
      console.log(`   🔗 分析页面: ${url}`);
      
      await page.goto(url, { waitUntil: 'networkidle' });
      await this.delay(1000);
      
      // 1. 提取所有链接
      const links = await page.$$eval('a[href]', anchors => 
        anchors.map(a => ({
          href: a.href,
          text: a.textContent?.trim() || '',
          title: a.title || ''
        }))
      );
      
      // 2. 分析表单和动态内容
      const forms = await page.$$eval('form', forms => 
        forms.map(form => ({
          action: form.action || '',
          method: form.method || 'GET'
        }))
      );
      
      // 3. 检查JavaScript生成的链接
      await this.delay(2000); // 等待JS执行
      const dynamicLinks = await page.$$eval('a[href]', anchors => 
        anchors.map(a => a.href).filter(href => href.includes('javascript:') === false)
      );
      
      // 4. 分析URL模式
      const allUrls = [...new Set([...links.map(l => l.href), ...dynamicLinks])];
      
      for (const discoveredUrl of allUrls) {
        if (this.shouldFollowUrl(discoveredUrl)) {
          const urlType = this.classifyUrl(discoveredUrl);
          this.addUrlToQueue(discoveredUrl, depth + 1, urlType);
        }
      }
      
      // 5. 尝试发现隐藏的URL模式
      await this.discoverHiddenUrlPatterns(page, url);
      
      this.processedUrls.add(url);
      
    } catch (error) {
      console.error(`❌ 页面URL发现失败 ${url}:`, error);
      throw error;
    }
  }

  /**
   * 发现隐藏的URL模式
   */
  private async discoverHiddenUrlPatterns(page: Page, baseUrl: string): Promise<void> {
    try {
      // ASP.NET 网站特有的模式发现
      const patterns = [
        // 基于ID的动态页面模式
        'info.aspx?id=00010001', // 关于我们
        'info.aspx?id=00020001', // 市场动向  
        'info.aspx?id=00050001', // 文献资料
        'info.aspx?id=00070001', // 产品
        // 可能的其他ID模式
        ...this.generateIdPatterns()
      ];
      
      for (const pattern of patterns) {
        const testUrl = new URL(pattern, baseUrl).toString();
        if (!this.discoveredUrls.has(testUrl)) {
          // 快速测试URL是否存在
          try {
            await page.goto(testUrl, { timeout: 10000 });
            const status = page.url() !== 'about:blank';
            if (status) {
              this.addUrlToQueue(testUrl, 1, 'pattern-discovered');
              console.log(`   ✨ 发现隐藏URL: ${testUrl}`);
            }
          } catch (e) {
            // URL不存在，忽略
          }
        }
      }
    } catch (error) {
      console.error('隐藏URL模式发现失败:', error);
    }
  }

  /**
   * 生成可能的ID模式
   */
  private generateIdPatterns(): string[] {
    const patterns: string[] = [];
    
    // 生成常见的ID模式
    const prefixes = ['00010', '00020', '00030', '00040', '00050', '00060', '00070', '00080'];
    const suffixes = ['001', '002', '003', '004', '005'];
    
    for (const prefix of prefixes) {
      for (const suffix of suffixes) {
        patterns.push(`info.aspx?id=${prefix}${suffix}`);
        patterns.push(`display.aspx?id=${prefix}${suffix}`);
        patterns.push(`product.aspx?id=${prefix}${suffix}`);
      }
    }
    
    return patterns;
  }

  /**
   * 全面内容抓取
   */
  private async scrapeAllContent(): Promise<void> {
    const urlsToProcess = Array.from(this.discoveredUrls.values())
      .filter(u => !this.processedUrls.has(u.url))
      .slice(0, this.config.maxPages!);
    
    console.log(`📄 开始抓取 ${urlsToProcess.length} 个页面的内容`);
    
    // 并发控制的页面抓取
    const batches = this.chunkArray(urlsToProcess, this.config.concurrency!);
    
    for (const batch of batches) {
      const promises = batch.map(urlInfo => this.scrapeSinglePage(urlInfo));
      await Promise.allSettled(promises);
      
      // 批次间延迟
      await this.delay(this.config.delay!);
    }
  }

  /**
   * 抓取单个页面
   */
  private async scrapeSinglePage(urlInfo: DiscoveredURL): Promise<void> {
    const page = await this.context!.newPage();
    let retryCount = 0;
    
    while (retryCount < this.config.retryAttempts!) {
      try {
        console.log(`   📖 抓取页面: ${urlInfo.url}`);
        
        await page.goto(urlInfo.url, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        // 等待动态内容加载
        await this.delay(2000);
        
        // 提取完整页面内容
        const pageData = await this.extractCompletePageContent(page, urlInfo);
        
        if (pageData) {
          this.scrapedData.pages.push(pageData);
          this.stats.pagesProcessed++;
          
          // 添加到站点地图
          this.siteMap.push({
            url: urlInfo.url,
            title: pageData.title,
            type: urlInfo.type,
            depth: urlInfo.depth,
            lastModified: new Date().toISOString(),
            size: pageData.content.length
          });
        }
        
        this.processedUrls.add(urlInfo.url);
        break; // 成功后跳出重试循环
        
      } catch (error) {
        retryCount++;
        console.error(`❌ 页面抓取失败 (尝试 ${retryCount}/${this.config.retryAttempts}): ${urlInfo.url}`, error);
        
        if (retryCount >= this.config.retryAttempts!) {
          this.failedUrls.add(urlInfo.url);
          this.stats.errors++;
          this.scrapedData.metadata.errors.push(`页面抓取最终失败: ${urlInfo.url} - ${error}`);
        } else {
          // 重试前等待
          await this.delay(this.config.delay! * retryCount);
        }
      }
    }
    
    await page.close();
  }

  /**
   * 提取完整页面内容
   */
  private async extractCompletePageContent(page: Page, urlInfo: DiscoveredURL): Promise<ScrapedPage | null> {
    try {
      const title = await page.title();
      const htmlContent = await page.content();
      const textContent = await page.textContent('body') || '';
      
      // 提取元数据
      const description = await page.getAttribute('meta[name="description"]', 'content') || '';
      const keywords = (await page.getAttribute('meta[name="keywords"]', 'content') || '').split(',').filter(k => k.trim());
      const author = await page.getAttribute('meta[name="author"]', 'content') || '';
      const publishDate = await this.extractPublishDate(page);
      
      // 提取结构化数据
      const structuredData = await this.extractStructuredData(page);
      
      // 提取图片信息
      const images = await page.$$eval('img', imgs => 
        imgs.map(img => ({
          src: img.src,
          alt: img.alt || '',
          title: img.title || ''
        }))
      );
      
      // 提取链接信息
      const links = await page.$$eval('a[href]', anchors => 
        anchors.map(a => ({
          href: a.href,
          text: a.textContent?.trim() || '',
          title: a.title || ''
        }))
      );
      
      return {
        url: urlInfo.url,
        title,
        content: textContent,
        htmlContent,
        metadata: {
          description,
          keywords,
          author,
          publishDate,
          category: this.categorizePageContent(title, textContent),
          language: await page.getAttribute('html', 'lang') || 'zh-CN',
          wordCount: textContent.split(/\s+/).length,
          images: images.length,
          links: links.length,
          structuredData
        },
        timestamp: new Date().toISOString(),
        discoveryInfo: {
          type: urlInfo.type,
          depth: urlInfo.depth,
          discoveredFrom: urlInfo.discoveredFrom || ''
        }
      };
    } catch (error) {
      console.error('页面内容提取失败:', error);
      return null;
    }
  }

  /**
   * 提取发布日期
   */
  private async extractPublishDate(page: Page): Promise<string | undefined> {
    // 尝试多种方式提取发布日期
    const dateSelectors = [
      'meta[property="article:published_time"]',
      'meta[name="publish_date"]',
      'meta[name="date"]',
      '.publish-date',
      '.date',
      'time[datetime]'
    ];
    
    for (const selector of dateSelectors) {
      try {
        const dateValue = await page.getAttribute(selector, 'content') 
          || await page.getAttribute(selector, 'datetime')
          || await page.textContent(selector);
        
        if (dateValue) {
          const parsed = new Date(dateValue);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
          }
        }
      } catch (e) {
        // 忽略选择器错误
      }
    }
    
    return undefined;
  }

  /**
   * 提取结构化数据
   */
  private async extractStructuredData(page: Page): Promise<any> {
    try {
      const jsonLd = await page.$$eval('script[type="application/ld+json"]', scripts => 
        scripts.map(script => {
          try {
            return JSON.parse(script.textContent || '');
          } catch {
            return null;
          }
        }).filter(Boolean)
      );
      
      return jsonLd.length > 0 ? jsonLd : undefined;
    } catch {
      return undefined;
    }
  }

  // === 工具方法 ===

  /**
   * 添加URL到队列
   */
  private addUrlToQueue(url: string, depth: number, type: string, discoveredFrom?: string): void {
    if (this.discoveredUrls.has(url)) return;
    
    const urlInfo: DiscoveredURL = {
      url,
      depth,
      type,
      discoveredFrom,
      timestamp: new Date().toISOString()
    };
    
    this.discoveredUrls.set(url, urlInfo);
    this.urlQueue.push(url);
  }

  /**
   * 判断是否应该跟踪URL
   */
  private shouldFollowUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const baseHost = new URL(this.config.baseUrl).hostname;
      
      // 内部链接检查
      if (parsed.hostname !== baseHost && !this.config.followExternalLinks) {
        return false;
      }
      
      // 排除的文件类型
      const excludeExtensions = ['.css', '.js', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
      if (excludeExtensions.some(ext => parsed.pathname.endsWith(ext))) {
        return false;
      }
      
      // 排除的路径模式
      const excludePatterns = ['/admin', '/login', '/logout', '/_', '/api/'];
      if (excludePatterns.some(pattern => parsed.pathname.includes(pattern))) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * URL分类
   */
  private classifyUrl(url: string): string {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('product') || urlLower.includes('00070001')) return 'product';
    if (urlLower.includes('about') || urlLower.includes('00010001')) return 'about';
    if (urlLower.includes('news') || urlLower.includes('market') || urlLower.includes('00020001')) return 'news';
    if (urlLower.includes('literature') || urlLower.includes('00050001')) return 'literature';
    if (urlLower.includes('contact')) return 'contact';
    if (urlLower.includes('display.aspx')) return 'detail';
    
    return 'general';
  }

  /**
   * 页面内容分类
   */
  private categorizePageContent(title: string, content: string): string {
    const text = (title + ' ' + content).toLowerCase();
    
    if (text.includes('产品') || text.includes('product')) return '产品页面';
    if (text.includes('关于我们') || text.includes('about us')) return '公司信息';
    if (text.includes('新闻') || text.includes('动向') || text.includes('market')) return '新闻资讯';
    if (text.includes('文献') || text.includes('literature')) return '技术文献';
    if (text.includes('联系') || text.includes('contact')) return '联系我们';
    
    return '一般页面';
  }

  /**
   * 判断是否需要捕获资源
   */
  private shouldCaptureResource(resourceType: string, url: string): boolean {
    const captureTypes = ['image', 'document', 'media'];
    const captureExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    
    return captureTypes.includes(resourceType) || 
           captureExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  /**
   * 记录发现的资源
   */
  private recordDiscoveredResource(url: string, resourceType: string): void {
    if (this.resources.has(url)) return;
    
    const resource: ResourceFile = {
      url,
      type: resourceType,
      filename: path.basename(new URL(url).pathname) || 'unnamed',
      size: 0,
      downloadPath: '',
      timestamp: new Date().toISOString()
    };
    
    this.resources.set(url, resource);
  }

  /**
   * 数组分块工具
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 延迟工具
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 打印最终统计
   */
  private printFinalStats(): void {
    const duration = Date.now() - this.stats.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    console.log('\n📊 === 抓取统计报告 ===');
    console.log(`⏱️  总耗时: ${minutes}分${seconds}秒`);
    console.log(`📄 处理页面: ${this.stats.pagesProcessed} 个`);
    console.log(`💾 下载资源: ${this.stats.resourcesDownloaded} 个`);
    console.log(`📊 数据大小: ${(this.stats.totalDataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`❌ 错误数量: ${this.stats.errors} 个`);
    console.log(`⚠️  警告数量: ${this.stats.warnings} 个`);
    console.log(`🔍 发现URL: ${this.discoveredUrls.size} 个`);
    console.log(`✅ 成功处理: ${this.processedUrls.size} 个`);
    console.log(`❌ 失败URL: ${this.failedUrls.size} 个`);
  }

  /**
   * 清理资源
   */
  private async cleanup(): Promise<void> {
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
    console.log('🧹 资源清理完成');
  }

  /**
   * 下载所有发现的资源
   */
  private async downloadAllResources(): Promise<void> {
    const resourcesToDownload = Array.from(this.resources.values())
      .filter(resource => !resource.downloadPath);
    
    if (resourcesToDownload.length === 0) {
      console.log('📦 没有发现需要下载的资源');
      return;
    }
    
    console.log(`💾 开始下载 ${resourcesToDownload.length} 个资源文件`);
    
    // 创建资源目录
    const resourcesDir = path.join(this.config.outputDir!, 'resources');
    await fs.ensureDir(resourcesDir);
    
    // 按类型分组下载
    const imageResources = resourcesToDownload.filter(r => r.type === 'image');
    const documentResources = resourcesToDownload.filter(r => r.type === 'document');
    const mediaResources = resourcesToDownload.filter(r => r.type === 'media');
    
    // 并发下载不同类型的资源
    await Promise.allSettled([
      this.downloadResourceBatch(imageResources, path.join(resourcesDir, 'images')),
      this.downloadResourceBatch(documentResources, path.join(resourcesDir, 'documents')),
      this.downloadResourceBatch(mediaResources, path.join(resourcesDir, 'media'))
    ]);
    
    const successCount = Array.from(this.resources.values())
      .filter(r => r.downloadStatus === 'completed').length;
    
    console.log(`✅ 资源下载完成: ${successCount}/${resourcesToDownload.length}`);
    this.stats.resourcesDownloaded = successCount;
  }
  
  /**
   * 批量下载资源
   */
  private async downloadResourceBatch(resources: ResourceFile[], targetDir: string): Promise<void> {
    if (resources.length === 0) return;
    
    await fs.ensureDir(targetDir);
    
    // 控制并发数量
    const batches = this.chunkArray(resources, this.config.concurrency!);
    
    for (const batch of batches) {
      const downloadPromises = batch.map(resource => this.downloadSingleResource(resource, targetDir));
      await Promise.allSettled(downloadPromises);
      
      // 批次间延迟
      await this.delay(500);
    }
  }
  
  /**
   * 下载单个资源
   */
  private async downloadSingleResource(resource: ResourceFile, targetDir: string): Promise<void> {
    let retryCount = 0;
    
    while (retryCount < this.config.retryAttempts!) {
      try {
        console.log(`   📥 下载资源: ${resource.filename}`);
        resource.downloadStatus = 'downloading';
        
        // 生成安全的文件名
        const safeFilename = this.sanitizeFilename(resource.filename) || `resource_${Date.now()}`;
        const filePath = path.join(targetDir, safeFilename);
        
        // 检查文件大小
        const headResponse = await axios.head(resource.url, {
          timeout: 10000,
          headers: {
            'User-Agent': this.config.userAgent
          }
        });
        
        const contentLength = parseInt(headResponse.headers['content-length'] || '0');
        
        if (contentLength > this.config.maxResourceSize!) {
          console.warn(`   ⚠️ 资源过大，跳过: ${resource.filename} (${this.formatFileSize(contentLength)})`);
          resource.downloadStatus = 'failed';
          resource.error = `文件过大: ${this.formatFileSize(contentLength)}`;
          return;
        }
        
        // 下载文件
        const response = await axios.get(resource.url, {
          responseType: 'stream',
          timeout: 30000,
          headers: {
            'User-Agent': this.config.userAgent
          }
        });
        
        // 保存文件
        const writer = createWriteStream(filePath);
        response.data.pipe(writer);
        
        await finished(writer);
        
        // 获取文件大小
        const stats = await fs.stat(filePath);
        
        // 更新资源信息
        resource.size = stats.size;
        resource.downloadPath = filePath;
        resource.downloadStatus = 'completed';
        resource.mimeType = headResponse.headers['content-type'] || 'application/octet-stream';
        
        this.stats.totalDataSize += stats.size;
        
        console.log(`   ✅ 下载完成: ${resource.filename} (${this.formatFileSize(stats.size)})`);
        break;
        
      } catch (error) {
        retryCount++;
        console.error(`   ❌ 资源下载失败 (尝试 ${retryCount}/${this.config.retryAttempts}): ${resource.filename}`, error);
        
        if (retryCount >= this.config.retryAttempts!) {
          resource.downloadStatus = 'failed';
          resource.error = String(error);
          this.stats.errors++;
        } else {
          await this.delay(1000 * retryCount); // 递增延迟
        }
      }
    }
  }
  
  /**
   * 清理文件名
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\|?*]/g, '_') // 替换非法字符
      .replace(/\s+/g, '_') // 替换空格
      .replace(/_+/g, '_') // 合并多个下划线
      .replace(/^_|_$/g, '') // 移除首尾下划线
      .substring(0, 200); // 限制长度
  }
  
  /**
   * 格式化文件大小
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * 分析和分类所有内容
   */
  private async analyzeAndClassifyContent(): Promise<void> {
    console.log('🤖 开始内容智能分析和分类');
    
    // 1. 提取公司信息
    await this.extractCompanyInformation();
    
    // 2. 识别和分类产品
    await this.classifyProducts();
    
    // 3. 识别技术文献
    await this.identifyTechnicalDocuments();
    
    // 4. 识别新闻文章
    await this.identifyNewsArticles();
    
    // 5. 分析内容质量
    await this.analyzeContentQuality();
    
    // 6. 生成内容统计
    this.generateContentStatistics();
    
    console.log('✅ 内容分析完成');
  }
  
  /**
   * 提取公司信息
   */
  private async extractCompanyInformation(): Promise<void> {
    console.log('   🏢 提取公司信息');
    
    const aboutPages = this.scrapedData.pages.filter(page => 
      page.discoveryInfo?.type === 'about' || 
      page.title.toLowerCase().includes('关于我们') ||
      page.title.toLowerCase().includes('about us')
    );
    
    let companyInfo: Company = {
      name: 'Assay Biotechnology',
      description: '',
      businessScope: []
    };
    
    for (const page of aboutPages) {
      const content = page.content.toLowerCase();
      
      // 提取公司描述
      if (!companyInfo.description) {
        const sentences = page.content.split(/[.。!?]/)
          .filter(s => s.length > 20 && s.length < 200)
          .filter(s => s.includes('生物') || s.includes('技术') || s.includes('检测'));
        if (sentences.length > 0) {
          companyInfo.description = sentences[0].trim();
        }
      }
      
      // 提取成立时间
      const establishedMatch = content.match(/成立于[\s]*([12]\d{3})[\s]*年/);
      if (establishedMatch) {
        companyInfo.established = establishedMatch[1];
      }
      
      // 提取联系信息
      const phoneMatch = content.match(/(\+?\d{1,4}[\s-]?)?\(?\d{3,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/);
      if (phoneMatch && !companyInfo.phone) {
        companyInfo.phone = phoneMatch[0];
      }
      
      const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch && !companyInfo.email) {
        companyInfo.email = emailMatch[0];
      }
      
      // 提取业务范围
      const businessKeywords = [
        '水质检测', '微生物检测', '生物技术', '实验设备',
        '技术服务', '产品研发', '检测试剂', '生物传感器'
      ];
      
      for (const keyword of businessKeywords) {
        if (content.includes(keyword) && !companyInfo.businessScope.includes(keyword)) {
          companyInfo.businessScope.push(keyword);
        }
      }
    }
    
    this.scrapedData.company = companyInfo;
    console.log(`   ✅ 公司信息提取完成: ${companyInfo.businessScope.length} 个业务范围`);
  }
  
  /**
   * 分类产品信息
   */
  private async classifyProducts(): Promise<void> {
    console.log('   📦 分类产品信息');
    
    const productPages = this.scrapedData.pages.filter(page => 
      page.discoveryInfo?.type === 'product' || 
      page.discoveryInfo?.type === 'detail' ||
      page.title.toLowerCase().includes('产品') ||
      page.url.includes('产品') ||
      page.url.includes('product')
    );
    
    const products: Product[] = [];
    const productCategories = new Map<string, number>();
    
    for (const page of productPages) {
      const extractedProducts = this.extractProductsFromPage(page);
      products.push(...extractedProducts);
      
      // 统计产品分类
      extractedProducts.forEach(product => {
        productCategories.set(product.category, (productCategories.get(product.category) || 0) + 1);
      });
    }
    
    // 去重和合并类似产品
    this.scrapedData.products = this.deduplicateProducts(products);
    
    console.log(`   ✅ 产品分类完成: ${this.scrapedData.products.length} 个产品，${productCategories.size} 个分类`);
  }
  
  /**
   * 从页面提取产品信息
   */
  private extractProductsFromPage(page: ScrapedPage): Product[] {
    const products: Product[] = [];
    const content = page.content;
    
    // 使用正则表达式和关键词匹配识别产品
    const productPatterns = [
      // 常见的产品名称模式
      /Colilert[\w\s-]+/gi,
      /Quanti[\w\s-]+/gi,
      /大肠菌[群检测试剂箱设备\s-]+/g,
      /菌落[总数检测试剂箱设备\s-]+/g,
      /隐孢子虫[检测试剂箱设备\s-]+/g,
      /贾第鞭毛虫[检测试剂箱设备\s-]+/g
    ];
    
    const foundProducts = new Set<string>();
    
    // 使用模式匹配
    for (const pattern of productPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => foundProducts.add(match.trim()));
      }
    }
    
    // 通过上下文关键词发现产品
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const productKeywords = ['产品', '试剂', '检测', '设备', '仪器', '系统'];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length > 5 && line.length < 100) {
        const hasProductKeyword = productKeywords.some(keyword => line.includes(keyword));
        const hasNumbers = /\d/.test(line);
        const hasEnglish = /[a-zA-Z]/.test(line);
        
        if ((hasProductKeyword || hasNumbers || hasEnglish) && !line.includes('公司') && !line.includes('网站')) {
          foundProducts.add(line);
        }
      }
    }
    
    // 转换为产品对象
    Array.from(foundProducts).forEach(productName => {
      if (productName.length > 3) {
        const product: Product = {
          id: this.generateProductId(productName),
          name: productName,
          category: this.categorizeProductName(productName),
          description: this.extractProductDescription(productName, content),
          features: this.extractProductFeatures(productName, content),
          images: [],
          documents: [],
          url: page.url,
          specifications: this.extractProductSpecs(productName, content)
        };
        products.push(product);
      }
    });
    
    return products;
  }
  
  /**
   * 生成产品ID
   */
  private generateProductId(productName: string): string {
    return Buffer.from(productName).toString('base64').substring(0, 12).replace(/[+/=]/g, '');
  }
  
  /**
   * 产品名称分类
   */
  private categorizeProductName(productName: string): string {
    const name = productName.toLowerCase();
    
    if (name.includes('大肠菌') || name.includes('colilert')) return '大肠菌群检测';
    if (name.includes('菌落') || name.includes('quanti')) return '菌落总数检测';
    if (name.includes('隐孢子虫')) return '寄生虫检测';
    if (name.includes('贾第鞭毛虫')) return '寄生虫检测';
    if (name.includes('培养箱') || name.includes('恒温')) return '实验设备';
    if (name.includes('试剂') || name.includes('试剂盒')) return '检测试剂';
    if (name.includes('仪器') || name.includes('设备')) return '检测设备';
    
    return '其他产品';
  }
  
  /**
   * 提取产品描述
   */
  private extractProductDescription(productName: string, content: string): string {
    const lines = content.split('\n');
    const productIndex = lines.findIndex(line => line.includes(productName));
    
    if (productIndex >= 0) {
      // 查找产品名后的描述性文字
      for (let i = productIndex + 1; i < Math.min(productIndex + 5, lines.length); i++) {
        const line = lines[i].trim();
        if (line.length > 10 && line.length < 200 && !line.includes('产品') && line.includes('检测')) {
          return line;
        }
      }
    }
    
    // 默认描述
    const category = this.categorizeProductName(productName);
    return `${category}相关产品，用于水质微生物检测`;
  }
  
  /**
   * 提取产品特性
   */
  private extractProductFeatures(productName: string, content: string): string[] {
    const features: string[] = [];
    const featureKeywords = ['快速', '精确', '简单', '可靠', '安全', '高效', '经济'];
    
    const sentences = content.split(/[.。!?]/);
    for (const sentence of sentences) {
      if (sentence.includes(productName)) {
        for (const keyword of featureKeywords) {
          if (sentence.includes(keyword) && !features.includes(keyword)) {
            features.push(keyword);
          }
        }
      }
    }
    
    return features;
  }
  
  /**
   * 提取产品规格
   */
  private extractProductSpecs(productName: string, content: string): Record<string, any> {
    const specs: Record<string, any> = {};
    
    // 常见规格模式
    const specPatterns = [
      { key: '温度范围', pattern: /(\d{1,2}[°C℃-]+\d{1,2}[°C℃])/ },
      { key: '检测时间', pattern: /(\d{1,2}[小时天-]+\d{1,2}[小时天])/ },
      { key: '检测范围', pattern: /(10[^^]\d+[个cfu\/ml-]+10[^^]\d+[个cfu\/ml])/ },
      { key: '包装规格', pattern: /(\d+[个支盒件套\/]+[个支盒件套])/ }
    ];
    
    for (const { key, pattern } of specPatterns) {
      const match = content.match(pattern);
      if (match) {
        specs[key] = match[1];
      }
    }
    
    return specs;
  }
  
  /**
   * 产品去重
   */
  private deduplicateProducts(products: Product[]): Product[] {
    const uniqueProducts = new Map<string, Product>();
    
    for (const product of products) {
      const key = product.name.toLowerCase().replace(/\s+/g, '');
      
      if (!uniqueProducts.has(key)) {
        uniqueProducts.set(key, product);
      } else {
        // 合并类似产品的信息
        const existing = uniqueProducts.get(key)!;
        existing.features = [...new Set([...existing.features, ...product.features])];
        if (product.description.length > existing.description.length) {
          existing.description = product.description;
        }
      }
    }
    
    return Array.from(uniqueProducts.values());
  }

  private async generateComprehensiveReport(): Promise<void> {
    console.log('📋 生成综合报告...');
    
    const reportDir = path.join(this.config.outputDir!, 'reports');
    await fs.ensureDir(reportDir);
    
    // 生成markdown报告
    const markdownReport = this.generateMarkdownReport();
    await fs.writeFile(path.join(reportDir, 'scraping-report.md'), markdownReport, 'utf8');
    
    // 生成JSON统计报告
    const statsReport = {
      scrapingStats: this.stats,
      urlCoverage: {
        discovered: this.discoveredUrls.size,
        processed: this.processedUrls.size,
        failed: this.failedUrls.size
      },
      contentAnalysis: {
        totalPages: this.scrapedData.pages.length,
        totalProducts: this.scrapedData.products.length,
        totalResources: this.resources.size,
        categories: this.getContentCategoryStats()
      },
      timestamp: new Date().toISOString()
    };
    
    await fs.writeJSON(path.join(reportDir, 'stats-report.json'), statsReport, { spaces: 2 });
    console.log('✅ 综合报告生成完成');
  }

  private async saveAllResults(): Promise<void> {
    console.log('💾 保存所有抓取数据...');
    
    await fs.ensureDir(this.config.outputDir!);
    
    // 保存主要数据文件
    await fs.writeJSON(
      path.join(this.config.outputDir!, 'complete-scraped-data.json'),
      this.scrapedData,
      { spaces: 2 }
    );
    
    // 保存站点地图
    await fs.writeJSON(
      path.join(this.config.outputDir!, 'sitemap.json'),
      this.siteMap,
      { spaces: 2 }
    );
    
    // 保存URL发现记录
    const urlRecord = Array.from(this.discoveredUrls.entries()).map(([url, info]) => ({
      url,
      ...info,
      processed: this.processedUrls.has(url),
      failed: this.failedUrls.has(url)
    }));
    
    await fs.writeJSON(
      path.join(this.config.outputDir!, 'url-discovery-record.json'),
      urlRecord,
      { spaces: 2 }
    );
    
    // 保存资源清单
    const resourceInventory = Array.from(this.resources.values());
    await fs.writeJSON(
      path.join(this.config.outputDir!, 'resource-inventory.json'),
      resourceInventory,
      { spaces: 2 }
    );
    
    console.log('✅ 所有数据保存完成');
  }

  private generateMarkdownReport(): string {
    const duration = Date.now() - this.stats.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    return `# AssayBio 企业级网站抓取报告

## 抓取概况

- **开始时间**: ${new Date(this.stats.startTime).toLocaleString('zh-CN')}
- **完成时间**: ${new Date().toLocaleString('zh-CN')}
- **总耗时**: ${minutes}分${seconds}秒
- **目标网站**: ${this.config.baseUrl}

## 数据统计

### 页面抓取
- **发现页面**: ${this.discoveredUrls.size} 个
- **成功处理**: ${this.processedUrls.size} 个
- **处理失败**: ${this.failedUrls.size} 个
- **抓取深度**: 最大 ${this.config.maxDepth} 层

### 内容分析
- **总页面数**: ${this.scrapedData.pages.length}
- **产品信息**: ${this.scrapedData.products.length} 个
- **技术文档**: ${this.scrapedData.technicalDocs.length} 个
- **新闻文章**: ${this.scrapedData.news.length} 个

### 资源下载
- **发现资源**: ${this.resources.size} 个
- **下载成功**: ${this.stats.resourcesDownloaded} 个
- **数据大小**: ${(this.stats.totalDataSize / 1024 / 1024).toFixed(2)} MB

## 错误统计

- **总错误数**: ${this.stats.errors}
- **总警告数**: ${this.stats.warnings}

${this.scrapedData.metadata.errors.length > 0 ? `
### 错误详情
${this.scrapedData.metadata.errors.slice(0, 10).map(error => `- ${error}`).join('\n')}
` : '✅ 无错误记录'}

## 技术说明

- **抓取引擎**: Playwright + Chrome
- **并发控制**: ${this.config.concurrency} 个并发
- **延迟设置**: ${this.config.delay}ms
- **重试机制**: 最多 ${this.config.retryAttempts} 次重试
- **资源限制**: 单文件最大 ${(this.config.maxResourceSize! / 1024 / 1024)}MB

---
*报告生成时间: ${new Date().toLocaleString('zh-CN')}*
*抓取工具: AssayBio Enterprise Scraper v1.0*
`;
  }

  private getContentCategoryStats(): Record<string, number> {
    const categories: Record<string, number> = {};
    
    this.scrapedData.pages.forEach(page => {
      const category = page.metadata.category;
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return categories;
  }

  // 缺失的方法实现
  private async identifyTechnicalDocuments(): Promise<void> {
    console.log('   📚 识别技术文献');
    
    const docPages = this.scrapedData.pages.filter(page => 
      page.discoveryInfo?.type === 'literature' ||
      page.title.toLowerCase().includes('文献') ||
      page.title.toLowerCase().includes('literature') ||
      page.content.toLowerCase().includes('技术文档')
    );
    
    const technicalDocs: TechnicalDocument[] = docPages.map(page => ({
      id: this.generateId(),
      title: page.title,
      content: page.content,
      url: page.url,
      type: '技术文献',
      publishDate: page.metadata.publishDate,
      keywords: page.metadata.keywords,
      category: '技术资料'
    }));
    
    this.scrapedData.technicalDocs = technicalDocs;
    console.log(`   ✅ 技术文献识别完成: ${technicalDocs.length} 篇`);
  }

  private async identifyNewsArticles(): Promise<void> {
    console.log('   📰 识别新闻文章');
    
    const newsPages = this.scrapedData.pages.filter(page => 
      page.discoveryInfo?.type === 'news' ||
      page.title.toLowerCase().includes('动向') ||
      page.title.toLowerCase().includes('新闻') ||
      page.title.toLowerCase().includes('market')
    );
    
    const newsArticles: NewsArticle[] = newsPages.map(page => ({
      id: this.generateId(),
      title: page.title,
      content: page.content,
      url: page.url,
      publishDate: page.metadata.publishDate || new Date().toISOString().split('T')[0],
      category: '市场动向',
      tags: ['市场', '动向'],
      featured: false
    }));
    
    this.scrapedData.news = newsArticles;
    console.log(`   ✅ 新闻文章识别完成: ${newsArticles.length} 篇`);
  }

  private async analyzeContentQuality(): Promise<void> {
    console.log('   🔍 分析内容质量');
    
    // 分析页面质量指标
    this.scrapedData.pages.forEach(page => {
      const quality = {
        hasTitle: !!page.title,
        hasDescription: !!page.metadata.description,
        hasKeywords: page.metadata.keywords.length > 0,
        wordCount: page.metadata.wordCount,
        hasImages: page.metadata.images > 0,
        hasLinks: page.metadata.links > 0
      };
      
      // 将质量分析添加到页面元数据
      (page.metadata as any).qualityScore = this.calculateQualityScore(quality);
    });
    
    console.log('   ✅ 内容质量分析完成');
  }

  private calculateQualityScore(quality: any): number {
    let score = 0;
    
    if (quality.hasTitle) score += 20;
    if (quality.hasDescription) score += 15;
    if (quality.hasKeywords) score += 10;
    if (quality.wordCount > 100) score += 20;
    if (quality.wordCount > 500) score += 15;
    if (quality.hasImages) score += 10;
    if (quality.hasLinks) score += 10;
    
    return Math.min(100, score);
  }

  private generateContentStatistics(): void {
    console.log('   📊 生成内容统计');
    
    // 更新元数据统计
    this.scrapedData.metadata.totalPages = this.scrapedData.pages.length;
    this.scrapedData.metadata.totalResources = this.resources.size;
    this.scrapedData.metadata.totalSize = this.stats.totalDataSize;
    this.scrapedData.metadata.duration = `${Math.round((Date.now() - this.stats.startTime) / 1000)}秒`;
    
    // 覆盖率统计
    this.scrapedData.metadata.coverage = {
      discoveredUrls: this.discoveredUrls.size,
      processedUrls: this.processedUrls.size,
      failedUrls: this.failedUrls.size,
      skippedUrls: this.discoveredUrls.size - this.processedUrls.size - this.failedUrls.size
    };
    
    console.log('   ✅ 内容统计完成');
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}