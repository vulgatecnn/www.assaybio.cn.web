/**
 * AssayBio网站内容整理器
 * 将抓取的数据整理成结构化的文件系统
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { JSDOM } from 'jsdom';
import axios from 'axios';

interface ScrapingResult {
  success: boolean;
  url: string;
  title: string;
  content: string;
  htmlContent?: string;
  metadata: any;
  assets?: any[];
  timestamp: string;
  processingTime: number;
  strategy: string;
}

interface BatchScrapingResult {
  totalPages: number;
  successCount: number;
  results: ScrapingResult[];
  summary: any;
}

class AssayBioContentOrganizer {
  private outputDir: string;
  private data: BatchScrapingResult;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  async organize(inputFile: string): Promise<void> {
    console.log('🗂️  开始整理AssayBio网站内容...');
    
    // 1. 读取抓取数据
    this.data = await fs.readJSON(inputFile);
    console.log(`📊 读取了 ${this.data.totalPages} 个页面的数据`);

    // 2. 创建目录结构
    await this.setupDirectoryStructure();

    // 3. 处理每个页面
    for (const result of this.data.results) {
      await this.processPage(result);
    }

    // 4. 下载资源文件
    await this.downloadResources();

    // 5. 生成索引和导航
    await this.generateIndex();

    // 6. 生成网站地图
    await this.generateSitemap();

    console.log('✅ AssayBio网站内容整理完成！');
  }

  private async setupDirectoryStructure(): Promise<void> {
    const dirs = [
      'pages/html',           // 原始HTML文件
      'pages/text',           // 纯文本内容
      'pages/markdown',       // Markdown格式
      'assets/images',        // 图片资源
      'assets/css',           // 样式文件
      'assets/js',            // JavaScript文件
      'assets/documents',     // 文档文件
      'reports',              // 分析报告
      'index'                 // 索引文件
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(this.outputDir, dir));
    }

    console.log('📁 目录结构创建完成');
  }

  private async processPage(result: ScrapingResult): Promise<void> {
    const filename = this.generateFilename(result);
    
    console.log(`📄 处理页面: ${result.title || result.url}`);

    try {
      // 1. 保存原始HTML
      if (result.htmlContent) {
        await fs.writeFile(
          path.join(this.outputDir, 'pages/html', `${filename}.html`),
          result.htmlContent,
          'utf8'
        );
      }

      // 2. 保存纯文本内容
      await fs.writeFile(
        path.join(this.outputDir, 'pages/text', `${filename}.txt`),
        this.cleanTextContent(result.content),
        'utf8'
      );

      // 3. 生成Markdown格式
      const markdown = await this.convertToMarkdown(result);
      await fs.writeFile(
        path.join(this.outputDir, 'pages/markdown', `${filename}.md`),
        markdown,
        'utf8'
      );

      // 4. 保存页面元数据
      await fs.writeJSON(
        path.join(this.outputDir, 'pages', `${filename}-metadata.json`),
        {
          ...result.metadata,
          url: result.url,
          title: result.title,
          timestamp: result.timestamp,
          processingTime: result.processingTime,
          wordCount: result.content.split(/\\s+/).length
        },
        { spaces: 2 }
      );

    } catch (error) {
      console.error(`❌ 处理页面失败 ${filename}:`, error);
    }
  }

  private generateFilename(result: ScrapingResult): string {
    const url = new URL(result.url);
    
    // 根据URL模式生成有意义的文件名
    if (url.pathname === '/default.aspx') {
      return 'homepage';
    }
    
    const idMatch = url.search.match(/id=([\\w]+)/);
    if (idMatch) {
      const id = idMatch[1];
      
      // 根据ID映射到有意义的名称
      const pageMapping: Record<string, string> = {
        '00010001': 'about-us',
        '00020001': 'market-trend',
        '00050001': 'literature',
        '00070001': 'products'
      };
      
      return pageMapping[id] || `page-${id}`;
    }
    
    return url.pathname.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'unknown';
  }

  private cleanTextContent(content: string): string {
    return content
      .replace(/\\s+/g, ' ')           // 合并空白字符
      .replace(/\\n\\s*\\n/g, '\\n\\n')  // 规范化换行
      .trim();                       // 去除首尾空白
  }

  private async convertToMarkdown(result: ScrapingResult): Promise<string> {
    let markdown = `# ${result.title || '无标题页面'}\\n\\n`;
    
    // 添加元信息
    markdown += `**URL**: ${result.url}\\n`;
    markdown += `**抓取时间**: ${new Date(result.timestamp).toLocaleString('zh-CN')}\\n`;
    markdown += `**字数统计**: ${result.content.split(/\\s+/).length} 字\\n\\n`;
    
    // 分隔线
    markdown += '---\\n\\n';
    
    // 主要内容
    if (result.htmlContent) {
      try {
        const dom = new JSDOM(result.htmlContent);
        const document = dom.window.document;
        
        // 提取标题结构
        const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        for (const tag of headings) {
          const elements = document.querySelectorAll(tag);
          elements.forEach(el => {
            const level = parseInt(tag.charAt(1));
            const prefix = '#'.repeat(level);
            const text = el.textContent?.trim();
            if (text) {
              markdown += `${prefix} ${text}\\n\\n`;
            }
          });
        }
        
        // 提取段落内容
        const paragraphs = document.querySelectorAll('p, div.content, div.text');
        paragraphs.forEach(p => {
          const text = p.textContent?.trim();
          if (text && text.length > 10) {
            markdown += `${text}\\n\\n`;
          }
        });
        
      } catch (error) {
        // 如果HTML解析失败，使用纯文本
        markdown += result.content;
      }
    } else {
      markdown += result.content;
    }
    
    return markdown;
  }

  private async downloadResources(): Promise<void> {
    console.log('💾 开始下载资源文件...');
    
    const imageUrls = new Set<string>();
    
    // 从所有页面中提取图片URL
    for (const result of this.data.results) {
      if (result.htmlContent) {
        try {
          const dom = new JSDOM(result.htmlContent);
          const images = dom.window.document.querySelectorAll('img[src]');
          
          images.forEach(img => {
            const src = img.getAttribute('src');
            if (src) {
              // 转换为绝对URL
              const baseUrl = new URL(result.url).origin;
              const absoluteUrl = new URL(src, baseUrl).toString();
              imageUrls.add(absoluteUrl);
            }
          });
        } catch (error) {
          console.warn(`解析页面图片失败: ${result.url}`, error);
        }
      }
    }

    console.log(`🖼️  发现 ${imageUrls.size} 个图片资源`);
    
    // 下载图片
    let downloadedCount = 0;
    for (const imageUrl of imageUrls) {
      try {
        const filename = this.getImageFilename(imageUrl);
        const filePath = path.join(this.outputDir, 'assets/images', filename);
        
        // 检查文件是否已存在
        if (await fs.pathExists(filePath)) {
          continue;
        }
        
        const response = await axios.get(imageUrl, {
          responseType: 'stream',
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        
        downloadedCount++;
        console.log(`  ✅ 下载: ${filename}`);
        
        // 添加延迟避免过于频繁的请求
        await this.delay(500);
        
      } catch (error) {
        console.warn(`  ❌ 下载失败: ${imageUrl}`, error instanceof Error ? error.message : error);
      }
    }
    
    console.log(`📊 资源下载完成: ${downloadedCount}/${imageUrls.size} 个图片`);
  }

  private getImageFilename(imageUrl: string): string {
    try {
      const url = new URL(imageUrl);
      const pathname = url.pathname;
      const filename = path.basename(pathname);
      
      // 如果文件名为空或无扩展名，生成一个
      if (!filename || !filename.includes('.')) {
        const timestamp = Date.now();
        return `image-${timestamp}.jpg`;
      }
      
      return filename;
    } catch {
      return `image-${Date.now()}.jpg`;
    }
  }

  private async generateIndex(): Promise<void> {
    console.log('📋 生成内容索引...');
    
    const index = {
      site: {
        name: 'AssayBio (上海安净生物技术有限公司)',
        url: 'http://www.assaybio.cn',
        scrapedAt: new Date().toISOString(),
        totalPages: this.data.totalPages
      },
      pages: this.data.results.map(result => ({
        id: this.generateFilename(result),
        title: result.title,
        url: result.url,
        wordCount: result.content.split(/\\s+/).length,
        imageCount: result.metadata.imageCount,
        linkCount: result.metadata.linkCount,
        files: {
          html: `pages/html/${this.generateFilename(result)}.html`,
          text: `pages/text/${this.generateFilename(result)}.txt`,
          markdown: `pages/markdown/${this.generateFilename(result)}.md`,
          metadata: `pages/${this.generateFilename(result)}-metadata.json`
        }
      })),
      summary: this.data.summary,
      stats: {
        totalWords: this.data.results.reduce((sum, r) => sum + r.content.split(/\\s+/).length, 0),
        totalImages: this.data.results.reduce((sum, r) => sum + (r.metadata.imageCount || 0), 0),
        totalLinks: this.data.results.reduce((sum, r) => sum + (r.metadata.linkCount || 0), 0)
      }
    };
    
    await fs.writeJSON(
      path.join(this.outputDir, 'index/site-index.json'),
      index,
      { spaces: 2 }
    );
    
    // 生成HTML索引页面
    const htmlIndex = this.generateHtmlIndex(index);
    await fs.writeFile(
      path.join(this.outputDir, 'index.html'),
      htmlIndex,
      'utf8'
    );
    
    console.log('✅ 索引文件生成完成');
  }

  private generateHtmlIndex(index: any): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${index.site.name} - 抓取归档</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 8px; flex: 1; }
        .pages { display: grid; gap: 15px; }
        .page-card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
        .page-title { font-size: 18px; font-weight: 600; color: #333; margin-bottom: 10px; }
        .page-meta { color: #666; font-size: 14px; margin-bottom: 10px; }
        .page-links { display: flex; gap: 10px; flex-wrap: wrap; }
        .page-links a { color: #0066cc; text-decoration: none; padding: 4px 8px; background: #f0f8ff; border-radius: 4px; font-size: 12px; }
        .page-links a:hover { background: #e6f3ff; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${index.site.name}</h1>
        <p>网站归档 - 抓取时间: ${new Date(index.site.scrapedAt).toLocaleString('zh-CN')}</p>
        <p>原始网站: <a href="${index.site.url}" target="_blank">${index.site.url}</a></p>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <h3>📄 页面数量</h3>
            <div style="font-size: 24px; font-weight: 600;">${index.site.totalPages}</div>
        </div>
        <div class="stat-card">
            <h3>📝 总字数</h3>
            <div style="font-size: 24px; font-weight: 600;">${index.stats.totalWords.toLocaleString()}</div>
        </div>
        <div class="stat-card">
            <h3>🖼️ 图片数量</h3>
            <div style="font-size: 24px; font-weight: 600;">${index.stats.totalImages}</div>
        </div>
        <div class="stat-card">
            <h3>🔗 链接数量</h3>
            <div style="font-size: 24px; font-weight: 600;">${index.stats.totalLinks}</div>
        </div>
    </div>
    
    <h2>📋 页面列表</h2>
    <div class="pages">
        ${index.pages.map((page: any) => `
            <div class="page-card">
                <div class="page-title">${page.title || '无标题页面'}</div>
                <div class="page-meta">
                    ${page.wordCount} 字 • ${page.imageCount} 图片 • ${page.linkCount} 链接
                </div>
                <div class="page-links">
                    <a href="${page.files.html}" target="_blank">原始HTML</a>
                    <a href="${page.files.markdown}" target="_blank">Markdown</a>
                    <a href="${page.files.text}" target="_blank">纯文本</a>
                    <a href="${page.files.metadata}" target="_blank">元数据</a>
                </div>
            </div>
        `).join('')}
    </div>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
        <p>此归档由通用网站抓取器生成 • 生成时间: ${new Date().toLocaleString('zh-CN')}</p>
    </div>
</body>
</html>`;
  }

  private async generateSitemap(): Promise<void> {
    const sitemap = {
      name: 'AssayBio网站地图',
      pages: this.data.results.map(result => ({
        title: result.title,
        url: result.url,
        lastModified: result.timestamp,
        priority: result.url.includes('default.aspx') ? 1.0 : 0.8,
        changeFreq: 'monthly'
      }))
    };
    
    await fs.writeJSON(
      path.join(this.outputDir, 'sitemap.json'),
      sitemap,
      { spaces: 2 }
    );
    
    console.log('🗺️  网站地图生成完成');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 主执行函数
async function main() {
  const inputFile = path.join(__dirname, '../assaybio-scraped/reports/complete-scrape.json');
  const outputDir = path.join(__dirname, '../assaybio-scraped');
  
  if (!await fs.pathExists(inputFile)) {
    console.error('❌ 找不到抓取数据文件:', inputFile);
    process.exit(1);
  }
  
  const organizer = new AssayBioContentOrganizer(outputDir);
  await organizer.organize(inputFile);
}

if (require.main === module) {
  main().catch(console.error);
}

export { AssayBioContentOrganizer };