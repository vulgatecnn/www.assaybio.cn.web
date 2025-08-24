/**
 * 运行完整的AssayBio网站抓取 - 输出到fresh-scraped目录
 */

import { AssayBioEnterpriseScraper } from './enterprise-scraper';

async function main() {
  console.log('🚀 启动AssayBio网站全新抓取任务');
  
  const scraper = new AssayBioEnterpriseScraper({
    baseUrl: 'http://www.assaybio.cn',
    outputDir: '../../../data/fresh-scraped',
    maxPages: 50,
    delay: 3000,
    downloadResources: true,
    enableJavaScript: true,
    followExternalLinks: false,
    maxDepth: 4,
    retryAttempts: 3,
    concurrency: 2,
    maxResourceSize: 100 * 1024 * 1024 // 100MB
  });
  
  try {
    const result = await scraper.scrapeCompleteSite();
    
    console.log('\n🎉 抓取任务完成！');
    console.log('📊 结果统计:');
    console.log(`   - 页面总数: ${result.pages.length}`);
    console.log(`   - 产品数量: ${result.products.length}`);
    console.log(`   - 技术文档: ${result.technicalDocs.length}`);
    console.log(`   - 新闻文章: ${result.news.length}`);
    console.log(`   - 资源文件: ${result.resources.length}`);
    console.log(`   - 错误数量: ${result.metadata.errors.length}`);
    
    if (result.metadata.errors.length > 0) {
      console.log('\n⚠️ 错误详情:');
      result.metadata.errors.slice(0, 5).forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 抓取失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}