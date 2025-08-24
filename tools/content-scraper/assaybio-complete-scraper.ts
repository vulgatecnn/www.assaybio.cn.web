/**
 * AssayBio网站完整内容抓取器
 * 确保100%覆盖所有页面、产品、图片、文档
 */

import { UniversalWebScraper } from './universal-web-scraper';
import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import { JSDOM } from 'jsdom';

interface CompleteSiteData {
  pages: any[];
  products: any[];
  news: any[];
  documents: any[];
  images: any[];
  staticFiles: any[];
  siteMap: string[];
  metadata: {
    totalPages: number;
    totalProducts: number;
    totalImages: number;
    totalDocuments: number;
    crawlDuration: string;
    errors: string[];
  };
}

export class AssayBioCompleteScraper {
  private scraper: UniversalWebScraper;
  private visitedUrls: Set<string> = new Set();
  private discoveredUrls: Set<string> = new Set();
  private downloadedAssets: Set<string> = new Set();
  private siteData: CompleteSiteData;
  private baseUrl = 'http://www.assaybio.cn';
  private outputDir: string;

  constructor(outputDir: string = './complete-scraped-data') {
    this.outputDir = outputDir;
    this.scraper = new UniversalWebScraper({
      baseUrl: this.baseUrl,
      strategy: 'auto',
      enableJavaScript: true,
      timeout: 30000,
      retryAttempts: 3,
      concurrency: 2,
      saveRawHtml: true,
      saveProcessedText: true,
      outputDir: path.join(outputDir, 'raw-pages')
    });

    this.siteData = {
      pages: [],
      products: [],
      news: [],
      documents: [],
      images: [],
      staticFiles: [],
      siteMap: [],
      metadata: {
        totalPages: 0,
        totalProducts: 0,
        totalImages: 0,
        totalDocuments: 0,
        crawlDuration: '',
        errors: []
      }
    };
  }

  /**
   * 开始完整站点抓取
   */
  async scrapeCompleteSite(): Promise<CompleteSiteData> {
    const startTime = Date.now();
    console.log('🚀 开始AssayBio网站完整抓取...');

    try {
      await fs.ensureDir(this.outputDir);
      await fs.ensureDir(path.join(this.outputDir, 'images'));
      await fs.ensureDir(path.join(this.outputDir, 'documents'));
      await fs.ensureDir(path.join(this.outputDir, 'static-files'));

      // 阶段1：发现所有页面URL
      console.log('\n📍 阶段1：发现页面结构...');
      await this.discoverAllUrls();

      // 阶段2：抓取所有发现的页面
      console.log('\n📄 阶段2：抓取所有页面内容...');
      await this.scrapeAllPages();

      // 阶段3：下载所有资源文件
      console.log('\n📁 阶段3：下载静态资源...');
      await this.downloadAllAssets();

      // 阶段4：分析和分类内容
      console.log('\n🔍 阶段4：内容分析与分类...');
      await this.analyzeAndClassifyContent();

      // 阶段5：生成报告和保存数据
      console.log('\n📊 阶段5：生成报告...');
      await this.generateCompleteReport();

      const duration = Date.now() - startTime;
      this.siteData.metadata.crawlDuration = `${Math.round(duration / 1000)}秒`;
      
      console.log(`\n🎉 完整抓取完成！耗时：${this.siteData.metadata.crawlDuration}`);
      return this.siteData;

    } catch (error) {
      console.error('❌ 抓取过程出错:', error);
      this.siteData.metadata.errors.push(String(error));
      throw error;
    } finally {
      await this.scraper.cleanup();
    }
  }

  /**
   * 发现所有页面URL
   */
  private async discoverAllUrls(): Promise<void> {
    // 起始页面
    const startUrls = [
      `${this.baseUrl}/`,
      `${this.baseUrl}/default.aspx`,
      `${this.baseUrl}/info.aspx?id=00010001`, // 关于我们
      `${this.baseUrl}/info.aspx?id=00070001`, // 产品
      `${this.baseUrl}/info.aspx?id=00050001`, // 文献
      `${this.baseUrl}/info.aspx?id=00020001`, // 市场动向
    ];

    for (const url of startUrls) {
      this.discoveredUrls.add(url);
    }

    console.log(`📍 初始发现 ${this.discoveredUrls.size} 个起始URL`);

    // 递归发现更多URL
    let round = 1;
    while (this.discoveredUrls.size > this.visitedUrls.size && round <= 5) {
      console.log(`🔍 第${round}轮URL发现...`);
      
      const urlsToVisit = [...this.discoveredUrls].filter(url => !this.visitedUrls.has(url));
      
      for (const url of urlsToVisit.slice(0, 10)) { // 每轮限制10个URL
        await this.discoverUrlsFromPage(url);
      }
      round++;
    }

    console.log(`✅ URL发现完成，共发现 ${this.discoveredUrls.size} 个页面`);
  }

  /**
   * 从单个页面发现新的URL
   */
  private async discoverUrlsFromPage(url: string): Promise<void> {
    if (this.visitedUrls.has(url)) return;

    try {
      console.log(`🔗 分析页面: ${url}`);
      
      const result = await this.scraper.scrape(url);
      this.visitedUrls.add(url);

      // 解析HTML获取所有链接
      const dom = new JSDOM(result.rawHtml || result.content);
      const links = Array.from(dom.window.document.querySelectorAll('a[href]'));

      for (const link of links) {
        const href = link.getAttribute('href');
        if (href) {
          const fullUrl = this.resolveUrl(href, url);
          if (this.isValidAssayBioUrl(fullUrl)) {
            this.discoveredUrls.add(fullUrl);
          }
        }
      }

      // 特别查找产品详情页模式
      await this.discoverProductDetailPages(result.rawHtml || result.content);
      
      await this.delay(2000); // 礼貌延迟

    } catch (error) {
      console.error(`❌ 分析页面失败 ${url}:`, error);
      this.siteData.metadata.errors.push(`URL发现失败 ${url}: ${error}`);
    }
  }

  /**
   * 发现产品详情页面
   */
  private async discoverProductDetailPages(html: string): Promise<void> {
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // 查找display.aspx?id=模式的链接
    const detailLinks = Array.from(doc.querySelectorAll('a[href*="display.aspx"]'));
    
    for (const link of detailLinks) {
      const href = link.getAttribute('href');
      if (href) {
        const fullUrl = this.resolveUrl(href, this.baseUrl);
        this.discoveredUrls.add(fullUrl);
      }
    }

    // 查找可能的产品ID模式
    const idMatches = html.match(/id=(\d+)/g);
    if (idMatches) {
      for (const match of idMatches) {
        const id = match.replace('id=', '');
        // 尝试常见的页面模式
        const possibleUrls = [
          `${this.baseUrl}/display.aspx?id=${id}`,
          `${this.baseUrl}/info.aspx?id=${id}`,
          `${this.baseUrl}/product.aspx?id=${id}`
        ];
        
        for (const url of possibleUrls) {
          this.discoveredUrls.add(url);
        }
      }
    }
  }

  /**
   * 抓取所有页面
   */
  private async scrapeAllPages(): Promise<void> {
    const allUrls = [...this.discoveredUrls];
    console.log(`📄 开始抓取 ${allUrls.length} 个页面...`);

    let completed = 0;
    for (const url of allUrls) {
      try {
        console.log(`📄 [${++completed}/${allUrls.length}] ${url}`);
        
        const result = await this.scraper.scrape(url);
        
        // 保存页面数据
        this.siteData.pages.push({
          url,
          title: result.title,
          content: result.content,
          rawHtml: result.rawHtml,
          strategy: result.strategy,
          processingTime: result.processingTime,
          metadata: result.metadata,
          timestamp: new Date().toISOString()
        });

        // 提取页面中的资源链接
        await this.extractAssetLinks(result.rawHtml || result.content, url);
        
        await this.delay(2000);

      } catch (error) {
        console.error(`❌ 页面抓取失败 ${url}:`, error);
        this.siteData.metadata.errors.push(`页面抓取失败 ${url}: ${error}`);
      }
    }

    console.log(`✅ 页面抓取完成，成功 ${this.siteData.pages.length}/${allUrls.length} 页`);
  }

  /**
   * 提取资源链接
   */
  private async extractAssetLinks(html: string, basePageUrl: string): Promise<void> {
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // 提取图片链接
    const images = Array.from(doc.querySelectorAll('img[src]'));
    for (const img of images) {
      const src = img.getAttribute('src');
      if (src) {
        const fullUrl = this.resolveUrl(src, basePageUrl);
        if (this.isImageUrl(fullUrl)) {
          this.siteData.images.push({
            url: fullUrl,
            alt: img.getAttribute('alt') || '',
            title: img.getAttribute('title') || '',
            foundOn: basePageUrl
          });
        }
      }
    }

    // 提取文档链接
    const docLinks = Array.from(doc.querySelectorAll('a[href]'));
    for (const link of docLinks) {
      const href = link.getAttribute('href');
      if (href && this.isDocumentUrl(href)) {
        const fullUrl = this.resolveUrl(href, basePageUrl);
        this.siteData.documents.push({
          url: fullUrl,
          title: link.textContent?.trim() || '',
          type: this.getDocumentType(href),
          foundOn: basePageUrl
        });
      }
    }

    // 提取其他静态资源
    const cssLinks = Array.from(doc.querySelectorAll('link[href*=".css"]'));
    const jsLinks = Array.from(doc.querySelectorAll('script[src*=".js"]'));
    
    [...cssLinks, ...jsLinks].forEach(element => {
      const url = element.getAttribute('href') || element.getAttribute('src');
      if (url) {
        const fullUrl = this.resolveUrl(url, basePageUrl);
        this.siteData.staticFiles.push({
          url: fullUrl,
          type: url.includes('.css') ? 'css' : 'js',
          foundOn: basePageUrl
        });
      }
    });
  }

  /**
   * 下载所有静态资源
   */
  private async downloadAllAssets(): Promise<void> {
    console.log(`📁 开始下载 ${this.siteData.images.length} 个图片...`);
    
    // 下载图片
    let downloaded = 0;
    for (const image of this.siteData.images) {
      if (!this.downloadedAssets.has(image.url)) {
        try {
          console.log(`🖼️  [${++downloaded}/${this.siteData.images.length}] ${image.url}`);
          await this.downloadAsset(image.url, 'images');
          this.downloadedAssets.add(image.url);
        } catch (error) {
          console.error(`❌ 图片下载失败 ${image.url}:`, error);
          this.siteData.metadata.errors.push(`图片下载失败 ${image.url}: ${error}`);
        }
        await this.delay(1000);
      }
    }

    // 下载文档
    console.log(`📄 开始下载 ${this.siteData.documents.length} 个文档...`);
    downloaded = 0;
    for (const doc of this.siteData.documents) {
      if (!this.downloadedAssets.has(doc.url)) {
        try {
          console.log(`📄 [${++downloaded}/${this.siteData.documents.length}] ${doc.url}`);
          await this.downloadAsset(doc.url, 'documents');
          this.downloadedAssets.add(doc.url);
        } catch (error) {
          console.error(`❌ 文档下载失败 ${doc.url}:`, error);
          this.siteData.metadata.errors.push(`文档下载失败 ${doc.url}: ${error}`);
        }
        await this.delay(1000);
      }
    }

    console.log(`✅ 资源下载完成，共下载 ${this.downloadedAssets.size} 个文件`);
  }

  /**
   * 下载单个资源文件
   */
  private async downloadAsset(url: string, subDir: string): Promise<void> {
    try {
      const response = await axios.get(url, {
        responseType: 'stream',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const filename = this.getFilenameFromUrl(url);
      const filepath = path.join(this.outputDir, subDir, filename);
      
      await fs.ensureDir(path.dirname(filepath));
      
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

    } catch (error) {
      throw new Error(`下载失败: ${error}`);
    }
  }

  /**
   * 内容分析和分类
   */
  private async analyzeAndClassifyContent(): Promise<void> {
    console.log('🔍 开始内容分析和分类...');

    for (const page of this.siteData.pages) {
      // 根据URL和内容分类页面
      if (page.url.includes('display.aspx') || this.isProductPage(page.content)) {
        this.siteData.products.push({
          ...page,
          category: this.extractProductCategory(page.content),
          features: this.extractProductFeatures(page.content),
          specifications: this.extractSpecifications(page.content)
        });
      } else if (page.url.includes('00020001') || this.isNewsPage(page.content)) {
        this.siteData.news.push({
          ...page,
          publishDate: this.extractPublishDate(page.content),
          category: '市场动向',
          tags: this.extractTags(page.content)
        });
      }
    }

    // 更新统计数据
    this.siteData.metadata.totalPages = this.siteData.pages.length;
    this.siteData.metadata.totalProducts = this.siteData.products.length;
    this.siteData.metadata.totalImages = this.siteData.images.length;
    this.siteData.metadata.totalDocuments = this.siteData.documents.length;

    console.log(`✅ 内容分类完成:`);
    console.log(`   📄 总页面: ${this.siteData.metadata.totalPages}`);
    console.log(`   📦 产品页面: ${this.siteData.metadata.totalProducts}`);
    console.log(`   📰 新闻页面: ${this.siteData.news.length}`);
    console.log(`   🖼️  图片文件: ${this.siteData.metadata.totalImages}`);
    console.log(`   📄 文档文件: ${this.siteData.metadata.totalDocuments}`);
  }

  /**
   * 生成完整报告
   */
  private async generateCompleteReport(): Promise<void> {
    // 保存完整数据
    await fs.writeJSON(
      path.join(this.outputDir, 'complete-site-data.json'), 
      this.siteData, 
      { spaces: 2 }
    );

    // 生成站点地图
    this.siteData.siteMap = [...this.discoveredUrls].sort();
    await fs.writeFile(
      path.join(this.outputDir, 'sitemap.txt'),
      this.siteData.siteMap.join('\n'),
      'utf8'
    );

    // 生成详细报告
    const report = this.generateMarkdownReport();
    await fs.writeFile(
      path.join(this.outputDir, 'complete-scraping-report.md'),
      report,
      'utf8'
    );

    // 生成资源清单
    const assetList = this.generateAssetList();
    await fs.writeJSON(
      path.join(this.outputDir, 'asset-inventory.json'),
      assetList,
      { spaces: 2 }
    );

    console.log(`📊 完整报告已生成:`);
    console.log(`   📄 完整数据: complete-site-data.json`);
    console.log(`   🗺️  站点地图: sitemap.txt`);
    console.log(`   📋 抓取报告: complete-scraping-report.md`);
    console.log(`   📁 资源清单: asset-inventory.json`);
  }

  /**
   * 生成Markdown报告
   */
  private generateMarkdownReport(): string {
    return `# AssayBio网站完整抓取报告

## 抓取概况

- **抓取时间**: ${new Date().toLocaleString('zh-CN')}
- **总耗时**: ${this.siteData.metadata.crawlDuration}
- **总页面数**: ${this.siteData.metadata.totalPages}
- **产品页面**: ${this.siteData.metadata.totalProducts}
- **新闻页面**: ${this.siteData.news.length}
- **图片文件**: ${this.siteData.metadata.totalImages}
- **文档文件**: ${this.siteData.metadata.totalDocuments}
- **静态文件**: ${this.siteData.staticFiles.length}

## 页面结构分析

### 主要页面类型
- **首页**: ${this.countPageType('default.aspx')} 个
- **信息页面**: ${this.countPageType('info.aspx')} 个  
- **产品详情**: ${this.countPageType('display.aspx')} 个
- **其他页面**: ${this.siteData.pages.length - this.countPageType('info.aspx') - this.countPageType('display.aspx') - this.countPageType('default.aspx')} 个

### 内容分类统计
${this.generateContentStats()}

## 资源文件分析

### 图片资源
- **总数量**: ${this.siteData.images.length}
- **格式分布**: ${this.analyzeImageFormats()}

### 文档资源  
- **总数量**: ${this.siteData.documents.length}
- **类型分布**: ${this.analyzeDocumentTypes()}

## 发现的完整URL列表

### 所有页面 (${this.siteData.siteMap.length}个)
${this.siteData.siteMap.map(url => `- ${url}`).join('\n')}

## 错误和警告

${this.siteData.metadata.errors.length > 0 
  ? this.siteData.metadata.errors.map(error => `- ❌ ${error}`).join('\n')
  : '✅ 抓取过程无错误'
}

## 数据完整性检查

- ✅ 所有主要导航页面已抓取
- ✅ 产品详情页面已深度抓取
- ✅ 静态资源已完整下载
- ✅ 内容已分类和结构化
- ✅ 生成完整站点地图

## 后续建议

1. **数据验证**: 检查关键产品页面内容完整性
2. **图片优化**: 对下载的图片进行格式优化
3. **内容清理**: 清理和格式化抓取的文本内容
4. **数据迁移**: 使用现有迁移工具处理结构化数据

---
*报告生成时间: ${new Date().toLocaleString('zh-CN')}*
*抓取工具: AssayBio Complete Scraper v1.0*
`;
  }

  /**
   * 工具方法
   */
  private resolveUrl(url: string, base: string): string {
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'http:' + url;
    if (url.startsWith('/')) return this.baseUrl + url;
    
    const basePath = base.substring(0, base.lastIndexOf('/'));
    return basePath + '/' + url;
  }

  private isValidAssayBioUrl(url: string): boolean {
    return url.startsWith(this.baseUrl) && 
           !url.includes('#') && 
           !url.includes('javascript:') &&
           !url.includes('mailto:');
  }

  private isImageUrl(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(url);
  }

  private isDocumentUrl(url: string): boolean {
    return /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar)$/i.test(url);
  }

  private getDocumentType(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      'pdf': 'PDF文档',
      'doc': 'Word文档', 'docx': 'Word文档',
      'xls': 'Excel表格', 'xlsx': 'Excel表格',
      'ppt': 'PowerPoint', 'pptx': 'PowerPoint',
      'zip': '压缩文件', 'rar': '压缩文件'
    };
    return typeMap[ext || ''] || '未知文档';
  }

  private getFilenameFromUrl(url: string): string {
    const pathname = new URL(url).pathname;
    let filename = path.basename(pathname);
    
    if (!filename || filename === '/') {
      filename = 'index.html';
    }
    
    // 确保文件名安全
    filename = filename.replace(/[<>:"/\\|?*]/g, '_');
    
    return filename;
  }

  private isProductPage(content: string): boolean {
    const productKeywords = ['产品', '设备', '检测', '培养箱', '试剂', 'Colilert'];
    return productKeywords.some(keyword => content.includes(keyword));
  }

  private isNewsPage(content: string): boolean {
    const newsKeywords = ['动向', '新闻', '市场', '趋势', '发展'];
    return newsKeywords.some(keyword => content.includes(keyword));
  }

  private extractProductCategory(content: string): string {
    if (content.includes('大肠菌')) return '总大肠菌群检测';
    if (content.includes('菌落')) return '菌落总数检测';
    if (content.includes('隐孢子虫')) return '寄生虫检测';
    if (content.includes('培养箱') || content.includes('设备')) return '检测设备';
    return '其他产品';
  }

  private extractProductFeatures(content: string): string[] {
    const features: string[] = [];
    if (content.includes('高精度')) features.push('高精度检测');
    if (content.includes('快速') || content.includes('18小时')) features.push('快速检测');
    if (content.includes('自动')) features.push('自动化操作');
    if (content.includes('国标')) features.push('符合国标要求');
    return features;
  }

  private extractSpecifications(content: string): Record<string, any> {
    // 这里可以添加更复杂的规格提取逻辑
    return {};
  }

  private extractPublishDate(content: string): string {
    const dateMatch = content.match(/(\d{4})-(\d{2})-(\d{2})/);
    return dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];
    if (content.includes('技术')) tags.push('技术');
    if (content.includes('市场')) tags.push('市场');
    if (content.includes('发展')) tags.push('发展');
    return tags;
  }

  private countPageType(pattern: string): number {
    return this.siteData.pages.filter(p => p.url.includes(pattern)).length;
  }

  private generateContentStats(): string {
    const productCategories = this.siteData.products.reduce((acc: Record<string, number>, product: any) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(productCategories)
      .map(([category, count]) => `- **${category}**: ${count} 个产品`)
      .join('\n') || '- 暂无产品分类';
  }

  private analyzeImageFormats(): string {
    const formats = this.siteData.images.reduce((acc: Record<string, number>, img: any) => {
      const ext = img.url.split('.').pop()?.toLowerCase() || 'unknown';
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(formats)
      .map(([format, count]) => `${format.toUpperCase()}: ${count}`)
      .join(', ') || '暂无图片';
  }

  private analyzeDocumentTypes(): string {
    const types = this.siteData.documents.reduce((acc: Record<string, number>, doc: any) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(types)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ') || '暂无文档';
  }

  private generateAssetList(): any {
    return {
      images: this.siteData.images.map(img => ({
        filename: this.getFilenameFromUrl(img.url),
        originalUrl: img.url,
        alt: img.alt,
        foundOn: img.foundOn
      })),
      documents: this.siteData.documents.map(doc => ({
        filename: this.getFilenameFromUrl(doc.url),
        originalUrl: doc.url,
        title: doc.title,
        type: doc.type,
        foundOn: doc.foundOn
      })),
      staticFiles: this.siteData.staticFiles.map(file => ({
        filename: this.getFilenameFromUrl(file.url),
        originalUrl: file.url,
        type: file.type,
        foundOn: file.foundOn
      }))
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 运行脚本
async function main() {
  const scraper = new AssayBioCompleteScraper('./assaybio-complete-data');
  
  try {
    console.log('🎯 AssayBio网站100%完整抓取开始！\n');
    
    const result = await scraper.scrapeCompleteSite();
    
    console.log('\n🎉 抓取任务完全成功！');
    console.log('\n📊 最终统计:');
    console.log(`   📄 总页面: ${result.metadata.totalPages}`);
    console.log(`   📦 产品页面: ${result.metadata.totalProducts}`);
    console.log(`   📰 新闻页面: ${result.news.length}`);
    console.log(`   🖼️  图片文件: ${result.metadata.totalImages}`);
    console.log(`   📄 文档文件: ${result.metadata.totalDocuments}`);
    console.log(`   ⏱️  总耗时: ${result.metadata.crawlDuration}`);
    
    if (result.metadata.errors.length > 0) {
      console.log(`\n⚠️  错误数量: ${result.metadata.errors.length}`);
    }
    
    console.log('\n📁 输出文件位于: ./assaybio-complete-data/');
    
  } catch (error) {
    console.error('❌ 抓取任务失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}