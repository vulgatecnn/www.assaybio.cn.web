/**
 * 测试抓取工具基本功能
 */

import { AssayBioScraper } from './scraper';

async function testScraper() {
  console.log('开始测试抓取工具...');

  const scraper = new AssayBioScraper({
    baseUrl: 'http://www.assaybio.cn',
    maxPages: 5,  // 限制页面数量进行测试
    delay: 2000,
    outputDir: './test-output',
    includeImages: false,
    followExternalLinks: false
  });

  try {
    const result = await scraper.scrape();
    
    console.log('\n=== 抓取测试结果 ===');
    console.log(`✅ 抓取页面数: ${result.pages.length}`);
    console.log(`✅ 产品数量: ${result.products.length}`);
    console.log(`✅ 技术文档: ${result.technicalDocs.length}`);
    console.log(`✅ 新闻文章: ${result.news.length}`);
    console.log(`✅ 公司名称: ${result.company.name}`);
    
    if (result.metadata.errors.length > 0) {
      console.log(`⚠️ 错误数量: ${result.metadata.errors.length}`);
      result.metadata.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log('\n测试完成！输出文件位于 ./test-output/ 目录');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

testScraper().catch(console.error);