/**
 * Assay Bio 网站内容抓取器
 * 基于Playwright实现全站内容抓取
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ScrapingResult, ScrapedPage, Product, Company, TechnicalDocument, NewsArticle, ScrapingConfig } from './types';
import TurndownService from 'turndown';

export class AssayBioScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: ScrapingConfig;
  private visitedUrls: Set<string> = new Set();
  private scrapedData: ScrapingResult;
  private turndownService: TurndownService;

  constructor(config: ScrapingConfig) {
    this.config = {
      maxPages: 50,
      delay: 2000,
      outputDir: './scraped-data',
      includeImages: true,
      followExternalLinks: false,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...config
    };

    this.scrapedData = {
      company: {} as Company,
      products: [],
      technicalDocs: [],
      news: [],
      pages: [],
      metadata: {
        totalPages: 0,
        scrapedAt: new Date().toISOString(),
        duration: '',
        errors: []
      }
    };

    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
  }

  /**
   * 启动浏览器并初始化
   */
  async init(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: false,
        slowMo: 100
      });

      this.page = await this.browser.newPage({
        userAgent: this.config.userAgent
      });

      // 设置较长的超时时间
      this.page.setDefaultTimeout(30000);
      
      console.log('浏览器初始化完成');
    } catch (error) {
      console.error('浏览器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 开始抓取网站内容
   */
  async scrape(): Promise<ScrapingResult> {
    const startTime = Date.now();

    try {
      await this.init();
      
      console.log(`开始抓取网站: ${this.config.baseUrl}`);
      
      // 1. 首页分析
      await this.scrapeHomePage();
      
      // 2. 抓取公司信息
      await this.scrapeCompanyInfo();
      
      // 3. 抓取产品信息
      await this.scrapeProducts();
      
      // 4. 抓取技术文献
      await this.scrapeTechnicalDocs();
      
      // 5. 抓取新闻动态
      await this.scrapeNews();
      
      // 6. 其他页面
      await this.scrapeOtherPages();

      // 计算耗时
      const duration = Date.now() - startTime;
      this.scrapedData.metadata.duration = `${Math.round(duration / 1000)}秒`;
      this.scrapedData.metadata.totalPages = this.scrapedData.pages.length;

      console.log(`抓取完成，共抓取 ${this.scrapedData.pages.length} 个页面，耗时 ${this.scrapedData.metadata.duration}`);
      
      // 保存数据
      await this.saveResults();
      
      return this.scrapedData;
    } catch (error) {
      console.error('抓取过程出错:', error);
      this.scrapedData.metadata.errors.push(String(error));
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * 抓取首页内容
   */
  private async scrapeHomePage(): Promise<void> {
    if (!this.page) return;

    try {
      console.log('正在抓取首页...');
      await this.page.goto(this.config.baseUrl);
      await this.page.waitForLoadState('networkidle');

      const pageData = await this.extractPageContent(this.config.baseUrl);
      if (pageData) {
        this.scrapedData.pages.push(pageData);
        this.visitedUrls.add(this.config.baseUrl);
      }
    } catch (error) {
      console.error('首页抓取失败:', error);
      this.scrapedData.metadata.errors.push(`首页抓取失败: ${error}`);
    }
  }

  /**
   * 抓取公司信息页面
   */
  private async scrapeCompanyInfo(): Promise<void> {
    if (!this.page) return;

    try {
      console.log('正在抓取公司信息...');
      
      // 查找"关于我们"相关链接
      const aboutLinks = await this.page.$$eval('a', links => 
        links.filter(link => 
          link.textContent?.includes('关于我们') || 
          link.textContent?.includes('About Us') ||
          link.href.includes('about') ||
          link.href.includes('00010001')
        ).map(link => link.href)
      );

      for (const link of aboutLinks) {
        await this.scrapePageWithDelay(link);
        
        // 提取公司信息
        const content = await this.page.textContent('body') || '';
        this.extractCompanyInfo(content);
        break; // 只处理第一个关于我们页面
      }
    } catch (error) {
      console.error('公司信息抓取失败:', error);
      this.scrapedData.metadata.errors.push(`公司信息抓取失败: ${error}`);
    }
  }

  /**
   * 抓取产品信息
   */
  private async scrapeProducts(): Promise<void> {
    if (!this.page) return;

    try {
      console.log('正在抓取产品信息...');
      
      // 查找产品相关链接
      const productLinks = await this.page.$$eval('a', links => 
        links.filter(link => 
          link.textContent?.includes('产品') || 
          link.textContent?.includes('Product') ||
          link.href.includes('00070001')
        ).map(link => link.href)
      );

      for (const link of productLinks) {
        if (this.visitedUrls.has(link)) continue;
        
        await this.scrapePageWithDelay(link);
        
        // 提取产品信息
        await this.extractProductInfo();
        
        // 查找产品详情页面
        const detailLinks = await this.page.$$eval('a', links => 
          links.filter(link => 
            link.href.includes('display.aspx') ||
            link.textContent?.includes('详情') ||
            link.textContent?.includes('了解更多')
          ).map(link => link.href)
        );

        // 限制产品详情页面数量
        for (const detailLink of detailLinks.slice(0, 10)) {
          await this.scrapeProductDetail(detailLink);
        }
        
        break;
      }
    } catch (error) {
      console.error('产品信息抓取失败:', error);
      this.scrapedData.metadata.errors.push(`产品信息抓取失败: ${error}`);
    }
  }

  /**
   * 抓取技术文献
   */
  private async scrapeTechnicalDocs(): Promise<void> {
    if (!this.page) return;

    try {
      console.log('正在抓取技术文献...');
      
      // 查找文献相关链接
      const docLinks = await this.page.$$eval('a', links => 
        links.filter(link => 
          link.textContent?.includes('文献') || 
          link.textContent?.includes('Literature') ||
          link.href.includes('00050001')
        ).map(link => link.href)
      );

      for (const link of docLinks) {
        await this.scrapePageWithDelay(link);
        
        // 提取文献信息
        const docs = await this.extractTechnicalDocs();
        this.scrapedData.technicalDocs.push(...docs);
        break;
      }
    } catch (error) {
      console.error('技术文献抓取失败:', error);
      this.scrapedData.metadata.errors.push(`技术文献抓取失败: ${error}`);
    }
  }

  /**
   * 抓取新闻动态
   */
  private async scrapeNews(): Promise<void> {
    if (!this.page) return;

    try {
      console.log('正在抓取市场动向...');
      
      // 查找新闻相关链接
      const newsLinks = await this.page.$$eval('a', links => 
        links.filter(link => 
          link.textContent?.includes('市场动向') || 
          link.textContent?.includes('Market Trend') ||
          link.textContent?.includes('新闻') ||
          link.href.includes('00020001')
        ).map(link => link.href)
      );

      for (const link of newsLinks) {
        await this.scrapePageWithDelay(link);
        
        // 提取新闻信息
        const articles = await this.extractNewsArticles();
        this.scrapedData.news.push(...articles);
        break;
      }
    } catch (error) {
      console.error('新闻抓取失败:', error);
      this.scrapedData.metadata.errors.push(`新闻抓取失败: ${error}`);
    }
  }

  /**
   * 抓取其他页面
   */
  private async scrapeOtherPages(): Promise<void> {
    if (!this.page) return;

    try {
      console.log('正在抓取其他页面...');
      
      // 获取所有导航链接
      const navLinks = await this.page.$$eval('a', links => 
        Array.from(new Set(links.map(link => link.href)))
          .filter(href => 
            href.startsWith('http://www.assaybio.cn') ||
            href.startsWith('https://www.assaybio.cn')
          )
      );

      const unvisitedLinks = navLinks.filter(link => !this.visitedUrls.has(link));
      
      for (const link of unvisitedLinks.slice(0, 10)) {
        await this.scrapePageWithDelay(link);
      }
    } catch (error) {
      console.error('其他页面抓取失败:', error);
      this.scrapedData.metadata.errors.push(`其他页面抓取失败: ${error}`);
    }
  }

  /**
   * 带延迟的页面抓取
   */
  private async scrapePageWithDelay(url: string): Promise<void> {
    if (!this.page || this.visitedUrls.has(url)) return;
    
    try {
      console.log(`正在抓取: ${url}`);
      
      await this.page.goto(url);
      await this.page.waitForLoadState('networkidle');
      await this.delay(this.config.delay!);
      
      const pageData = await this.extractPageContent(url);
      if (pageData) {
        this.scrapedData.pages.push(pageData);
      }
      
      this.visitedUrls.add(url);
    } catch (error) {
      console.error(`页面抓取失败 ${url}:`, error);
      this.scrapedData.metadata.errors.push(`页面抓取失败 ${url}: ${error}`);
    }
  }

  /**
   * 提取页面内容
   */
  private async extractPageContent(url: string): Promise<ScrapedPage | null> {
    if (!this.page) return null;

    try {
      const title = await this.page.title();
      const htmlContent = await this.page.content();
      const textContent = await this.page.textContent('body') || '';
      
      // 转换为Markdown格式
      const markdownContent = this.turndownService.turndown(htmlContent);
      
      return {
        url,
        title,
        content: textContent,
        htmlContent,
        metadata: {
          description: await this.page.getAttribute('meta[name="description"]', 'content') || undefined,
          keywords: (await this.page.getAttribute('meta[name="keywords"]', 'content') || '').split(',').filter(k => k.trim()),
          language: await this.page.getAttribute('html', 'lang') || 'zh-CN'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('页面内容提取失败:', error);
      return null;
    }
  }

  /**
   * 提取公司信息
   */
  private extractCompanyInfo(content: string): void {
    const companyInfo: Company = {
      name: 'Assay Biotechnology',
      description: '',
      established: '',
      businessScope: []
    };

    // 提取成立时间
    const establishedMatch = content.match(/成立于\s*(\d{4})\s*年/);
    if (establishedMatch) {
      companyInfo.established = establishedMatch[1];
    }

    // 提取公司描述（提取第一段有意义的内容）
    const descriptionMatch = content.match(/Assay Biotechnology[^。]*。[^。]*。/);
    if (descriptionMatch) {
      companyInfo.description = descriptionMatch[0];
    }

    // 提取业务范围
    if (content.includes('水中微生物检测')) {
      companyInfo.businessScope.push('水中微生物检测技术');
    }
    if (content.includes('设备')) {
      companyInfo.businessScope.push('检测设备销售');
    }
    if (content.includes('技术服务')) {
      companyInfo.businessScope.push('技术服务');
    }

    this.scrapedData.company = companyInfo;
  }

  /**
   * 提取产品信息
   */
  private async extractProductInfo(): Promise<void> {
    if (!this.page) return;

    try {
      // 获取产品列表
      const productElements = await this.page.$$('[class*="product"], [class*="item"], li a');
      
      for (const element of productElements.slice(0, 20)) {
        const title = await element.textContent();
        const href = await element.getAttribute('href');
        
        if (title && href && title.trim()) {
          const product: Product = {
            id: this.generateId(title),
            name: title.trim(),
            category: this.categorizeProduct(title),
            description: title.trim(),
            features: [],
            images: [],
            documents: [],
            url: this.resolveUrl(href)
          };
          
          this.scrapedData.products.push(product);
        }
      }
    } catch (error) {
      console.error('产品信息提取失败:', error);
    }
  }

  /**
   * 抓取产品详情页
   */
  private async scrapeProductDetail(url: string): Promise<void> {
    if (!this.page || this.visitedUrls.has(url)) return;
    
    try {
      await this.scrapePageWithDelay(url);
      
      // 这里可以添加更详细的产品信息提取逻辑
      // 比如产品规格、参数、图片等
      
    } catch (error) {
      console.error('产品详情页抓取失败:', error);
    }
  }

  /**
   * 提取技术文献
   */
  private async extractTechnicalDocs(): Promise<TechnicalDocument[]> {
    if (!this.page) return [];
    
    try {
      const docs: TechnicalDocument[] = [];
      const docElements = await this.page.$$('a[href*="pdf"], a[href*="doc"], a[href*="download"]');
      
      for (const element of docElements) {
        const title = await element.textContent();
        const href = await element.getAttribute('href');
        
        if (title && href) {
          docs.push({
            title: title.trim(),
            type: this.classifyDocType(title),
            category: '技术文献',
            description: title.trim(),
            downloadUrl: this.resolveUrl(href),
            tags: this.extractTagsFromTitle(title)
          });
        }
      }
      
      return docs;
    } catch (error) {
      console.error('技术文献提取失败:', error);
      return [];
    }
  }

  /**
   * 提取新闻文章
   */
  private async extractNewsArticles(): Promise<NewsArticle[]> {
    if (!this.page) return [];
    
    try {
      const articles: NewsArticle[] = [];
      const articleElements = await this.page.$$('[class*="news"], [class*="article"], li');
      
      for (const element of articleElements.slice(0, 10)) {
        const title = await element.textContent();
        
        if (title && title.trim().length > 5) {
          articles.push({
            title: title.trim(),
            content: title.trim(),
            publishDate: new Date().toISOString().split('T')[0],
            category: '市场动向',
            tags: this.extractTagsFromTitle(title),
            url: this.page.url()
          });
        }
      }
      
      return articles;
    } catch (error) {
      console.error('新闻文章提取失败:', error);
      return [];
    }
  }

  /**
   * 工具方法
   */
  private generateId(text: string): string {
    return Buffer.from(text).toString('base64').substring(0, 10);
  }

  private categorizeProduct(title: string): string {
    if (title.includes('大肠菌') || title.includes('Colilert')) return '总大肠菌群检测';
    if (title.includes('菌落')) return '菌落总数检测';
    if (title.includes('隐孢子虫') || title.includes('贾第鞭毛虫')) return '寄生虫检测';
    if (title.includes('培养箱') || title.includes('设备')) return '检测设备';
    return '其他产品';
  }

  private classifyDocType(title: string): 'manual' | 'specification' | 'research' | 'case-study' {
    if (title.includes('说明书') || title.includes('manual')) return 'manual';
    if (title.includes('规格') || title.includes('specification')) return 'specification';
    if (title.includes('研究') || title.includes('research')) return 'research';
    return 'case-study';
  }

  private extractTagsFromTitle(title: string): string[] {
    const tags: string[] = [];
    
    if (title.includes('检测')) tags.push('检测');
    if (title.includes('微生物')) tags.push('微生物');
    if (title.includes('水质')) tags.push('水质');
    if (title.includes('技术')) tags.push('技术');
    
    return tags;
  }

  private resolveUrl(href: string): string {
    if (href.startsWith('http')) return href;
    return new URL(href, this.config.baseUrl).toString();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 保存抓取结果
   */
  private async saveResults(): Promise<void> {
    try {
      await fs.ensureDir(this.config.outputDir!);
      
      const outputFile = path.join(this.config.outputDir!, `assaybio-scraped-${Date.now()}.json`);
      await fs.writeJSON(outputFile, this.scrapedData, { spaces: 2 });
      
      console.log(`抓取结果已保存到: ${outputFile}`);
      
      // 生成摘要报告
      await this.generateReport();
    } catch (error) {
      console.error('保存结果失败:', error);
    }
  }

  /**
   * 生成抓取报告
   */
  private async generateReport(): Promise<void> {
    const reportFile = path.join(this.config.outputDir!, 'scraping-report.md');
    
    const report = `# Assay Bio 网站抓取报告

## 抓取概况
- **抓取时间**: ${this.scrapedData.metadata.scrapedAt}
- **耗时**: ${this.scrapedData.metadata.duration}
- **总页面数**: ${this.scrapedData.metadata.totalPages}
- **产品数量**: ${this.scrapedData.products.length}
- **技术文献数**: ${this.scrapedData.technicalDocs.length}
- **新闻文章数**: ${this.scrapedData.news.length}

## 公司信息
- **公司名称**: ${this.scrapedData.company.name}
- **成立时间**: ${this.scrapedData.company.established}
- **业务范围**: ${this.scrapedData.company.businessScope.join(', ')}

## 产品分类统计
${this.generateProductStats()}

## 错误日志
${this.scrapedData.metadata.errors.length > 0 ? this.scrapedData.metadata.errors.map(e => `- ${e}`).join('\n') : '无错误'}

---
*由 AssayBio Content Scraper 生成*
`;

    await fs.writeFile(reportFile, report, 'utf8');
    console.log(`报告已生成: ${reportFile}`);
  }

  private generateProductStats(): string {
    const categories = this.scrapedData.products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories)
      .map(([category, count]) => `- **${category}**: ${count} 个产品`)
      .join('\n');
  }

  /**
   * 清理资源
   */
  private async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
    console.log('浏览器已关闭');
  }
}

// 运行脚本
async function main() {
  const config: ScrapingConfig = {
    baseUrl: 'http://www.assaybio.cn',
    maxPages: 30,
    delay: 3000,
    outputDir: './scraped-data',
    includeImages: true,
    followExternalLinks: false
  };

  const scraper = new AssayBioScraper(config);
  
  try {
    await scraper.scrape();
    console.log('抓取任务完成！');
  } catch (error) {
    console.error('抓取任务失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，执行main函数
if (require.main === module) {
  main().catch(console.error);
}