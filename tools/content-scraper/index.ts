/**
 * AssayBio 内容抓取和迁移工具入口
 */

import { AssayBioScraper } from './scraper';
import { DataMigrator } from './migrator';
import * as path from 'path';
import * as fs from 'fs-extra';

async function main() {
  console.log('=== AssayBio 网站内容迁移工具 ===\n');

  try {
    // 第一步：数据抓取
    console.log('1. 开始抓取网站内容...');
    
    const scraper = new AssayBioScraper({
      baseUrl: 'http://www.assaybio.cn',
      maxPages: 25,
      delay: 3000,
      outputDir: './scraped-data',
      includeImages: true,
      followExternalLinks: false
    });

    const scrapedData = await scraper.scrape();
    console.log(`✅ 数据抓取完成，共获取 ${scrapedData.pages.length} 个页面\n`);

    // 第二步：数据迁移
    console.log('2. 开始数据格式转换和迁移...');
    
    const migrator = new DataMigrator('./migrated-data');
    
    // 查找最新的抓取数据文件
    const scrapedDir = './scraped-data';
    const files = await fs.readdir(scrapedDir);
    const scrapedFiles = files.filter(f => f.startsWith('assaybio-scraped-') && f.endsWith('.json'));
    
    if (scrapedFiles.length === 0) {
      throw new Error('未找到抓取数据文件');
    }

    const latestFile = scrapedFiles.sort().pop()!;
    const scrapedDataPath = path.join(scrapedDir, latestFile);
    
    const migratedData = await migrator.migrate(scrapedDataPath);
    console.log(`✅ 数据迁移完成，处理了 ${migratedData.products.length} 个产品\n`);

    // 第三步：生成完成报告
    console.log('3. 生成项目总结报告...');
    await generateProjectSummary(scrapedData, migratedData);
    console.log('✅ 项目总结报告已生成\n');

    console.log('🎉 所有任务完成！');
    console.log('\n输出文件位置:');
    console.log('- 原始抓取数据: ./scraped-data/');
    console.log('- 迁移后数据: ./migrated-data/');
    console.log('- 项目报告: ./project-summary.md');

  } catch (error) {
    console.error('❌ 任务执行失败:', error);
    process.exit(1);
  }
}

/**
 * 生成项目总结报告
 */
async function generateProjectSummary(scrapedData: any, migratedData: any): Promise<void> {
  const summary = `# AssayBio 网站重构项目 - 内容分析报告

## 项目概况
- **执行时间**: ${new Date().toLocaleString('zh-CN')}
- **原网站**: http://www.assaybio.cn
- **项目目标**: 现代化网站重构与内容迁移

## 内容统计

### 抓取数据统计
- **总页面数**: ${scrapedData.pages.length}
- **产品数量**: ${scrapedData.products.length}
- **技术文档**: ${scrapedData.technicalDocs.length}
- **新闻文章**: ${scrapedData.news.length}

### 迁移数据统计
- **产品分类**: ${new Set(migratedData.products.map((p: any) => p.category.name)).size} 个
- **可发布产品**: ${migratedData.products.filter((p: any) => p.status === 'active').length}
- **推荐新闻**: ${migratedData.news.filter((n: any) => n.featured).length}
- **技术文档**: ${migratedData.documents.length}

## 产品分类分析

### 主要产品类别
${generateProductAnalysis(migratedData.products)}

### 技术特色
${generateTechFeatures(migratedData.products)}

## 公司信息提取

### 基本信息
- **公司名称**: ${migratedData.company.name}
- **成立时间**: ${migratedData.company.established}年
- **主营业务**: ${migratedData.company.services.join('、')}

### 业务描述
${migratedData.company.description}

## 新网站建议

### 网站结构建议
\`\`\`
/
├── 首页 (现代化展示)
├── 关于我们
│   ├── 公司介绍
│   ├── 发展历程
│   └── 团队优势
├── 产品中心
│   ├── 总大肠菌群检测
│   ├── 菌落总数检测
│   ├── 寄生虫检测
│   └── 检测设备
├── 技术文献
│   ├── 产品手册
│   ├── 技术规格
│   └── 研究资料
├── 新闻动态
│   ├── 行业资讯
│   ├── 公司动态
│   └── 技术分享
└── 联系我们
\`\`\`

### UI/UX优化重点
1. **现代化设计**: 采用简洁的卡片式布局
2. **移动端适配**: 完全响应式设计
3. **搜索功能**: 产品快速搜索和筛选
4. **内容展示**: 结构化的产品参数展示
5. **用户体验**: 便捷的文档下载和咨询功能

### SEO优化建议
1. **关键词布局**: 重点围绕"微生物检测"、"水质分析"等核心词
2. **内容优化**: 每个产品页面都有完整的描述和规格
3. **技术文档**: 建立丰富的技术内容库提升权威性
4. **结构化数据**: 使用JSON-LD标记产品信息

## 技术实现路径

### 开发阶段划分
1. **前端开发** (3-4周)
   - React + TypeScript + Tailwind CSS
   - 响应式组件开发
   - 产品展示和搜索功能
   
2. **后端开发** (2-3周)
   - Node.js + Express + PostgreSQL
   - CMS内容管理系统
   - API接口开发
   
3. **数据迁移** (1周)
   - 使用本工具生成的迁移数据
   - 图片资源处理和CDN部署
   - URL重定向配置

4. **测试优化** (1-2周)
   - 功能测试和性能优化
   - SEO检查和移动端测试
   - 用户体验测试

### 部署建议
- **前端**: Vercel 或 Netlify 静态部署
- **后端**: Railway 或 Heroku 部署
- **数据库**: PostgreSQL (Supabase 推荐)
- **CDN**: Cloudflare 或 AWS CloudFront

## 项目文件说明

### 抓取数据 (./scraped-data/)
- \`assaybio-scraped-*.json\`: 原始抓取数据
- \`scraping-report.md\`: 抓取过程报告

### 迁移数据 (./migrated-data/)
- \`company.json\`: 公司信息 (可直接用于网站)
- \`products.json\`: 产品数据 (包含SEO信息)
- \`news.json\`: 新闻文章 (支持标签分类)
- \`documents.json\`: 技术文档列表
- \`migration.sql\`: 数据库插入脚本
- \`migration-report.md\`: 详细迁移报告

## 下一步行动

### 立即可开始
1. ✅ 使用迁移数据开始前端页面开发
2. ✅ 根据产品分类设计网站导航结构
3. ✅ 开始UI组件库搭建

### 需要补充
1. 🔄 收集高质量产品图片
2. 🔄 完善产品技术规格参数
3. 🔄 补充公司详细联系信息
4. 🔄 准备客户案例和成功故事

### 长期优化
1. 📈 建立内容更新机制
2. 📈 实施SEO长期策略
3. 📈 用户行为分析和优化
4. 📈 建立客户服务系统

---
*报告生成时间: ${new Date().toLocaleString('zh-CN')}*
*工具版本: AssayBio Content Migration Tool v1.0*
`;

  await fs.writeFile('./project-summary.md', summary, 'utf8');
}

/**
 * 产品分析
 */
function generateProductAnalysis(products: any[]): string {
  const categoryStats = products.reduce((acc, product) => {
    const category = product.category.name;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => `- **${category}**: ${count} 个产品`)
    .join('\n');
}

/**
 * 技术特色分析
 */
function generateTechFeatures(products: any[]): string {
  const allFeatures = products.flatMap(p => p.features);
  const featureStats = allFeatures.reduce((acc, feature) => {
    acc[feature] = (acc[feature] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(featureStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([feature, count]) => `- **${feature}**: ${count} 个产品具备`)
    .join('\n');
}

// 运行主程序
if (require.main === module) {
  main().catch(console.error);
}