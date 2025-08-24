/**
 * 数据迁移工具
 * 将抓取的数据转换为新网站需要的格式
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { ScrapingResult, Product, NewsArticle, TechnicalDocument } from './types';

export interface MigratedData {
  company: {
    name: string;
    description: string;
    established: string;
    services: string[];
    contact: {
      address: string;
      phone: string;
      email: string;
    };
  };
  products: MigratedProduct[];
  news: MigratedNews[];
  documents: MigratedDocument[];
  pages: MigratedPage[];
}

export interface MigratedProduct {
  id: string;
  slug: string;
  name: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  description: string;
  features: string[];
  specifications: Record<string, any>;
  images: {
    main: string;
    gallery: string[];
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface MigratedNews {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishDate: string;
  category: string;
  tags: string[];
  featured: boolean;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export interface MigratedDocument {
  id: string;
  title: string;
  type: 'manual' | 'specification' | 'research' | 'case-study';
  category: string;
  description: string;
  fileUrl: string;
  downloadCount: number;
  tags: string[];
  publishDate: string;
}

export interface MigratedPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  template: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  status: 'published' | 'draft';
}

export class DataMigrator {
  private outputDir: string;

  constructor(outputDir: string = './migrated-data') {
    this.outputDir = outputDir;
  }

  /**
   * 迁移数据主入口
   */
  async migrate(scrapedDataPath: string): Promise<MigratedData> {
    console.log('开始数据迁移...');

    try {
      // 读取抓取的数据
      const scrapedData: ScrapingResult = await fs.readJSON(scrapedDataPath);
      console.log('已读取抓取数据');

      // 迁移各类数据
      const migratedData: MigratedData = {
        company: this.migrateCompanyInfo(scrapedData),
        products: this.migrateProducts(scrapedData.products),
        news: this.migrateNews(scrapedData.news),
        documents: this.migrateDocuments(scrapedData.technicalDocs),
        pages: this.migratePages(scrapedData.pages)
      };

      // 保存迁移结果
      await this.saveMigratedData(migratedData);
      
      // 生成迁移报告
      await this.generateMigrationReport(migratedData, scrapedData);

      console.log('数据迁移完成！');
      return migratedData;

    } catch (error) {
      console.error('数据迁移失败:', error);
      throw error;
    }
  }

  /**
   * 迁移公司信息
   */
  private migrateCompanyInfo(data: ScrapingResult): MigratedData['company'] {
    return {
      name: data.company.name || 'Assay Biotechnology',
      description: data.company.description || '专业的水中微生物检测技术服务公司',
      established: data.company.established || '2009',
      services: [
        '水中微生物检测技术研发',
        '检测设备销售与服务',
        '技术培训与咨询',
        '质量控制解决方案'
      ],
      contact: {
        address: '上海市',
        phone: '021-XXXXXXXX',
        email: 'info@assaybio.cn'
      }
    };
  }

  /**
   * 迁移产品数据
   */
  private migrateProducts(products: Product[]): MigratedProduct[] {
    const productCategories = this.generateProductCategories(products);
    
    return products.map((product, index) => ({
      id: product.id || this.generateId(`product-${index}`),
      slug: this.generateSlug(product.name),
      name: product.name,
      category: productCategories[product.category] || {
        id: this.generateId(product.category),
        name: product.category,
        slug: this.generateSlug(product.category)
      },
      description: product.description || product.name,
      features: product.features || this.extractFeatures(product.name),
      specifications: product.specifications || {},
      images: {
        main: this.generatePlaceholderImage(product.name),
        gallery: product.images || []
      },
      seo: {
        title: product.name,
        description: `${product.name} - 专业的微生物检测解决方案`,
        keywords: this.generateKeywords(product.name)
      },
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  /**
   * 迁移新闻数据
   */
  private migrateNews(news: NewsArticle[]): MigratedNews[] {
    return news.map((article, index) => ({
      id: this.generateId(`news-${index}`),
      slug: this.generateSlug(article.title),
      title: article.title,
      excerpt: this.generateExcerpt(article.content),
      content: article.content,
      author: article.author || 'Assay Bio Team',
      publishDate: article.publishDate || new Date().toISOString().split('T')[0],
      category: article.category || '行业动态',
      tags: article.tags || this.extractTags(article.title),
      featured: index < 3, // 前3篇设为推荐
      seo: {
        title: article.title,
        description: this.generateExcerpt(article.content),
        keywords: this.generateKeywords(article.title)
      }
    }));
  }

  /**
   * 迁移文档数据
   */
  private migrateDocuments(docs: TechnicalDocument[]): MigratedDocument[] {
    return docs.map((doc, index) => ({
      id: this.generateId(`doc-${index}`),
      title: doc.title,
      type: doc.type,
      category: doc.category,
      description: doc.description,
      fileUrl: doc.downloadUrl || '',
      downloadCount: 0,
      tags: doc.tags,
      publishDate: doc.publishDate || new Date().toISOString().split('T')[0]
    }));
  }

  /**
   * 迁移页面数据
   */
  private migratePages(pages: any[]): MigratedPage[] {
    return pages.map((page, index) => ({
      id: this.generateId(`page-${index}`),
      slug: this.generateSlug(page.title || `page-${index}`),
      title: page.title || `页面 ${index + 1}`,
      content: this.cleanContent(page.content || ''),
      template: this.determineTemplate(page.url || ''),
      seo: {
        title: page.title || `页面 ${index + 1}`,
        description: this.generateExcerpt(page.content || ''),
        keywords: this.generateKeywords(page.title || '')
      },
      status: 'published' as const
    }));
  }

  /**
   * 生成产品分类
   */
  private generateProductCategories(products: Product[]): Record<string, any> {
    const categories: Record<string, any> = {};
    const categoryNames = [...new Set(products.map(p => p.category))];
    
    categoryNames.forEach(categoryName => {
      categories[categoryName] = {
        id: this.generateId(categoryName),
        name: categoryName,
        slug: this.generateSlug(categoryName)
      };
    });

    return categories;
  }

  /**
   * 工具方法
   */
  private generateId(text: string): string {
    return Buffer.from(text + Date.now()).toString('base64').substring(0, 12);
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private generateExcerpt(content: string, maxLength: number = 150): string {
    const cleaned = content.replace(/\s+/g, ' ').trim();
    return cleaned.length > maxLength ? 
      cleaned.substring(0, maxLength) + '...' : 
      cleaned;
  }

  private generateKeywords(text: string): string[] {
    const commonKeywords = ['微生物检测', '水质分析', 'Assay Bio', '检测技术'];
    const textKeywords = text.match(/[\u4e00-\u9fff]+/g) || [];
    
    return [...commonKeywords, ...textKeywords.slice(0, 3)]
      .filter((keyword, index, array) => array.indexOf(keyword) === index);
  }

  private extractFeatures(productName: string): string[] {
    const features: string[] = [];
    
    if (productName.includes('检测')) features.push('高精度检测');
    if (productName.includes('大肠菌')) features.push('符合国标要求');
    if (productName.includes('快速') || productName.includes('18小时') || productName.includes('24小时')) {
      features.push('快速检测');
    }
    if (productName.includes('自动') || productName.includes('程控')) features.push('自动化操作');
    if (productName.includes('培养箱') || productName.includes('设备')) features.push('稳定可靠');
    
    return features.length > 0 ? features : ['专业检测', '质量可靠'];
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];
    
    if (text.includes('检测')) tags.push('检测技术');
    if (text.includes('微生物')) tags.push('微生物');
    if (text.includes('水质')) tags.push('水质监测');
    if (text.includes('设备')) tags.push('检测设备');
    if (text.includes('标准')) tags.push('行业标准');
    if (text.includes('技术')) tags.push('技术创新');
    
    return tags.length > 0 ? tags : ['行业资讯'];
  }

  private generatePlaceholderImage(productName: string): string {
    // 生成占位符图片URL或返回默认图片路径
    const slug = this.generateSlug(productName);
    return `/images/products/${slug}-main.jpg`;
  }

  private cleanContent(content: string): string {
    return content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  private determineTemplate(url: string): string {
    if (url.includes('about') || url.includes('00010001')) return 'about';
    if (url.includes('product') || url.includes('00070001')) return 'product-list';
    if (url.includes('news') || url.includes('00020001')) return 'news-list';
    if (url.includes('literature') || url.includes('00050001')) return 'document-list';
    if (url.includes('contact') || url.includes('00010002')) return 'contact';
    return 'page';
  }

  /**
   * 保存迁移数据
   */
  private async saveMigratedData(data: MigratedData): Promise<void> {
    await fs.ensureDir(this.outputDir);

    // 分别保存各类数据
    await fs.writeJSON(path.join(this.outputDir, 'company.json'), data.company, { spaces: 2 });
    await fs.writeJSON(path.join(this.outputDir, 'products.json'), data.products, { spaces: 2 });
    await fs.writeJSON(path.join(this.outputDir, 'news.json'), data.news, { spaces: 2 });
    await fs.writeJSON(path.join(this.outputDir, 'documents.json'), data.documents, { spaces: 2 });
    await fs.writeJSON(path.join(this.outputDir, 'pages.json'), data.pages, { spaces: 2 });

    // 保存完整数据
    await fs.writeJSON(path.join(this.outputDir, 'migrated-complete.json'), data, { spaces: 2 });

    // 生成SQL插入语句（可选）
    await this.generateSQLInserts(data);

    console.log(`迁移数据已保存到: ${this.outputDir}`);
  }

  /**
   * 生成SQL插入语句
   */
  private async generateSQLInserts(data: MigratedData): Promise<void> {
    const sqlContent = `-- AssayBio 网站数据迁移 SQL 脚本
-- 生成时间: ${new Date().toISOString()}

-- 产品分类表
INSERT INTO product_categories (id, name, slug, description) VALUES
${this.generateCategoryInserts(data.products)};

-- 产品表  
INSERT INTO products (id, slug, name, category_id, description, features, status, created_at, updated_at) VALUES
${this.generateProductInserts(data.products)};

-- 新闻文章表
INSERT INTO news_articles (id, slug, title, excerpt, content, author, publish_date, category, tags, featured) VALUES
${this.generateNewsInserts(data.news)};

-- 技术文档表
INSERT INTO documents (id, title, type, category, description, file_url, tags, publish_date) VALUES  
${this.generateDocumentInserts(data.documents)};

-- 页面表
INSERT INTO pages (id, slug, title, content, template, status) VALUES
${this.generatePageInserts(data.pages)};
`;

    await fs.writeFile(path.join(this.outputDir, 'migration.sql'), sqlContent, 'utf8');
    console.log('SQL插入脚本已生成: migration.sql');
  }

  private generateCategoryInserts(products: MigratedProduct[]): string {
    const categories = new Map();
    products.forEach(product => {
      if (!categories.has(product.category.id)) {
        categories.set(product.category.id, product.category);
      }
    });

    return Array.from(categories.values())
      .map(cat => `('${cat.id}', '${this.escapeSql(cat.name)}', '${cat.slug}', '${this.escapeSql(cat.name)}产品分类')`)
      .join(',\n');
  }

  private generateProductInserts(products: MigratedProduct[]): string {
    return products.map(product => 
      `('${product.id}', '${product.slug}', '${this.escapeSql(product.name)}', '${product.category.id}', '${this.escapeSql(product.description)}', '${JSON.stringify(product.features)}', '${product.status}', '${product.createdAt}', '${product.updatedAt}')`
    ).join(',\n');
  }

  private generateNewsInserts(news: MigratedNews[]): string {
    return news.map(article =>
      `('${this.generateId('news')}', '${article.slug}', '${this.escapeSql(article.title)}', '${this.escapeSql(article.excerpt)}', '${this.escapeSql(article.content)}', '${this.escapeSql(article.author)}', '${article.publishDate}', '${this.escapeSql(article.category)}', '${JSON.stringify(article.tags)}', ${article.featured})`
    ).join(',\n');
  }

  private generateDocumentInserts(documents: MigratedDocument[]): string {
    return documents.map(doc =>
      `('${doc.id}', '${this.escapeSql(doc.title)}', '${doc.type}', '${this.escapeSql(doc.category)}', '${this.escapeSql(doc.description)}', '${this.escapeSql(doc.fileUrl)}', '${JSON.stringify(doc.tags)}', '${doc.publishDate}')`
    ).join(',\n');
  }

  private generatePageInserts(pages: MigratedPage[]): string {
    return pages.map(page =>
      `('${page.id}', '${page.slug}', '${this.escapeSql(page.title)}', '${this.escapeSql(page.content)}', '${page.template}', '${page.status}')`
    ).join(',\n');
  }

  private escapeSql(text: string): string {
    return text.replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  }

  /**
   * 生成迁移报告
   */
  private async generateMigrationReport(migratedData: MigratedData, originalData: ScrapingResult): Promise<void> {
    const report = `# 数据迁移报告

## 迁移概况
- **迁移时间**: ${new Date().toISOString()}
- **原始页面数**: ${originalData.pages.length}
- **迁移产品数**: ${migratedData.products.length}
- **迁移新闻数**: ${migratedData.news.length}  
- **迁移文档数**: ${migratedData.documents.length}
- **迁移页面数**: ${migratedData.pages.length}

## 产品分类统计
${this.generateCategoryStats(migratedData.products)}

## 数据文件说明
- \`company.json\`: 公司基础信息
- \`products.json\`: 产品数据，包含完整的SEO信息
- \`news.json\`: 新闻文章，包含标签和分类
- \`documents.json\`: 技术文档信息
- \`pages.json\`: 其他页面内容
- \`migrated-complete.json\`: 完整迁移数据
- \`migration.sql\`: SQL插入脚本

## 新网站数据结构特点
1. **SEO优化**: 所有内容都包含完整的SEO元信息
2. **分类体系**: 建立了清晰的产品分类和内容分类
3. **URL友好**: 生成了搜索引擎友好的URL slug
4. **内容增强**: 为产品添加了特性描述和关键词
5. **状态管理**: 支持内容的发布状态控制

## 建议的下一步操作
1. 检查并完善产品图片资源
2. 优化产品描述和技术规格
3. 补充公司联系信息
4. 设置URL重定向映射
5. 进行SEO关键词优化

---
*由 AssayBio Data Migrator 生成*
`;

    await fs.writeFile(path.join(this.outputDir, 'migration-report.md'), report, 'utf8');
    console.log('迁移报告已生成: migration-report.md');
  }

  private generateCategoryStats(products: MigratedProduct[]): string {
    const stats = products.reduce((acc, product) => {
      const category = product.category.name;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stats)
      .map(([category, count]) => `- **${category}**: ${count} 个产品`)
      .join('\n');
  }
}

// 运行脚本
async function main() {
  const migrator = new DataMigrator('./migrated-data');
  
  // 查找最新的抓取数据文件
  const scrapedDir = './scraped-data';
  const files = await fs.readdir(scrapedDir);
  const scrapedFiles = files.filter(f => f.startsWith('assaybio-scraped-') && f.endsWith('.json'));
  
  if (scrapedFiles.length === 0) {
    console.error('未找到抓取数据文件，请先运行数据抓取工具');
    process.exit(1);
  }

  // 使用最新的抓取文件
  const latestFile = scrapedFiles.sort().pop()!;
  const scrapedDataPath = path.join(scrapedDir, latestFile);
  
  console.log(`使用抓取数据文件: ${scrapedDataPath}`);

  try {
    await migrator.migrate(scrapedDataPath);
    console.log('数据迁移完成！');
  } catch (error) {
    console.error('数据迁移失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，执行main函数
if (require.main === module) {
  main().catch(console.error);
}