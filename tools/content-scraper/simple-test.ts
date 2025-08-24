/**
 * 简化版测试，验证工具逻辑
 */

import { DataMigrator } from './migrator';
import { ScrapingResult } from './types';
import * as fs from 'fs-extra';

// 创建模拟数据用于测试
const mockScrapedData: ScrapingResult = {
  company: {
    name: 'Assay Biotechnology',
    description: 'Assay Biotechnology成立于2009年，是一家新兴的专业技术服务公司。公司专注于水中微生物检测技术及方法的研发、引进和推广。',
    established: '2009',
    businessScope: ['水中微生物检测技术', '检测设备销售', '技术服务']
  },
  products: [
    {
      id: 'prod001',
      name: 'DST技术大肠菌群检测系统',
      category: '总大肠菌群检测',
      description: 'DST技术大肠菌群检测系统，高精度检测解决方案',
      features: ['高精度检测', '快速出结果'],
      images: [],
      documents: [],
      url: 'http://www.assaybio.cn/display.aspx?id=1774'
    },
    {
      id: 'prod002',
      name: '科立得试剂 18小时',
      category: '总大肠菌群检测',
      description: '18小时快速检测试剂，符合国标要求',
      features: ['18小时出结果', '符合国标'],
      images: [],
      documents: [],
      url: 'http://www.assaybio.cn/display.aspx?id=1772'
    },
    {
      id: 'prod003',
      name: '电热恒温培养箱',
      category: '检测设备',
      description: '专业的恒温培养设备',
      features: ['恒温控制', '稳定可靠'],
      images: [],
      documents: [],
      url: 'http://www.assaybio.cn/display.aspx?id=2005'
    }
  ],
  technicalDocs: [
    {
      title: 'DST技术应用指南',
      type: 'manual',
      category: '技术手册',
      description: 'DST技术详细应用指南',
      tags: ['技术指南', '检测技术'],
      publishDate: '2024-01-15'
    },
    {
      title: '水质检测标准规范',
      type: 'specification',
      category: '技术规范',
      description: '国家标准水质检测规范文件',
      tags: ['国家标准', '检测规范'],
      publishDate: '2024-02-01'
    }
  ],
  news: [
    {
      title: '2024年水质检测技术发展趋势',
      content: '随着环保要求的提高，水质检测技术不断发展...',
      publishDate: '2024-03-01',
      category: '行业动态',
      tags: ['技术发展', '行业趋势'],
      url: 'http://www.assaybio.cn/news/001'
    },
    {
      title: 'Assay Bio参加国际环保展览会',
      content: '公司携最新检测设备参加2024国际环保展...',
      publishDate: '2024-03-15',
      category: '公司动态',
      tags: ['展览会', '公司新闻'],
      url: 'http://www.assaybio.cn/news/002'
    }
  ],
  pages: [
    {
      url: 'http://www.assaybio.cn/info.aspx?id=00010001',
      title: '关于我们 - Assay Biotechnology',
      content: 'Assay Biotechnology成立于2009年，专注于水中微生物检测技术...',
      htmlContent: '<div>HTML content</div>',
      metadata: {
        description: '专业的水中微生物检测技术服务公司',
        keywords: ['微生物检测', '水质分析'],
        language: 'zh-CN'
      },
      timestamp: new Date().toISOString()
    }
  ],
  metadata: {
    totalPages: 15,
    scrapedAt: new Date().toISOString(),
    duration: '120秒',
    errors: []
  }
};

async function testDataMigration() {
  console.log('🧪 开始测试数据迁移功能...\n');

  try {
    // 创建测试目录和模拟数据文件
    await fs.ensureDir('./test-data');
    const testDataFile = './test-data/mock-scraped.json';
    await fs.writeJSON(testDataFile, mockScrapedData, { spaces: 2 });
    
    console.log('✅ 模拟数据文件已创建');

    // 执行数据迁移
    const migrator = new DataMigrator('./test-migrated');
    const migratedData = await migrator.migrate(testDataFile);
    
    // 验证迁移结果
    console.log('\n=== 数据迁移测试结果 ===');
    console.log(`✅ 公司信息: ${migratedData.company.name}`);
    console.log(`✅ 产品数量: ${migratedData.products.length}`);
    console.log(`✅ 新闻文章: ${migratedData.news.length}`);
    console.log(`✅ 技术文档: ${migratedData.documents.length}`);
    console.log(`✅ 页面数量: ${migratedData.pages.length}`);

    // 显示产品分类
    const categories = [...new Set(migratedData.products.map(p => p.category.name))];
    console.log(`✅ 产品分类: ${categories.join(', ')}`);

    // 显示SEO信息示例
    if (migratedData.products.length > 0) {
      const firstProduct = migratedData.products[0];
      console.log('\n=== SEO信息示例 ===');
      console.log(`产品名称: ${firstProduct.name}`);
      console.log(`SEO标题: ${firstProduct.seo.title}`);
      console.log(`SEO描述: ${firstProduct.seo.description}`);
      console.log(`关键词: ${firstProduct.seo.keywords.join(', ')}`);
      console.log(`URL Slug: ${firstProduct.slug}`);
    }

    console.log('\n🎉 数据迁移测试完成！');
    console.log('\n输出文件位置:');
    console.log('- 模拟数据: ./test-data/');
    console.log('- 迁移结果: ./test-migrated/');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

testDataMigration().catch(console.error);