/**
 * 通用网站抓取器使用示例
 * 展示如何使用 UniversalWebScraper 抓取任意网站
 */

import { UniversalWebScraper, ScrapingPresets } from './universal-web-scraper';
import { ScrapingConfig } from './types/universal-scraper-types';
import * as fs from 'fs-extra';

async function demoBasicScraping() {
  console.log('=== 基础抓取示例 ===');
  
  const scraper = new UniversalWebScraper({
    baseUrl: 'https://example.com',
    strategy: 'auto', // 自动选择最优策略
    enableJavaScript: true,
    timeout: 15000
  });

  try {
    // 抓取单个页面
    const result = await scraper.scrape('https://example.com');
    
    console.log(`✅ 抓取成功:`);
    console.log(`   标题: ${result.title}`);
    console.log(`   策略: ${result.strategy}`);
    console.log(`   内容长度: ${result.content.length} 字符`);
    console.log(`   处理时间: ${result.processingTime}ms`);
    console.log(`   图片数量: ${result.metadata.imageCount}`);
    console.log(`   链接数量: ${result.metadata.linkCount}`);
    
  } catch (error) {
    console.error('❌ 抓取失败:', error);
  } finally {
    await scraper.cleanup();
  }
}

async function demoBatchScraping() {
  console.log('\\n=== 批量抓取示例 ===');
  
  const urls = [
    'https://httpbin.org/html',
    'https://httpbin.org/json',
    'https://example.com'
  ];

  const scraper = UniversalWebScraper.withPreset('https://httpbin.org', 'BALANCED');

  try {
    const batchResult = await scraper.scrapeMultiple(urls);
    
    console.log(`\\n📊 批量抓取统计:`);
    console.log(`   总页面: ${batchResult.totalPages}`);
    console.log(`   成功: ${batchResult.successCount}`);
    console.log(`   失败: ${batchResult.failureCount}`);
    console.log(`   总耗时: ${Math.round(batchResult.duration / 1000)}秒`);
    console.log(`   平均处理时间: ${Math.round(batchResult.summary.avgProcessingTime)}ms`);
    
    console.log(`\\n🎯 策略使用统计:`);
    console.log(`   jsdom: ${batchResult.summary.strategyCounts.jsdom}次`);
    console.log(`   playwright: ${batchResult.summary.strategyCounts.playwright}次`);
    
    // 显示成功的结果
    batchResult.results.forEach((result, index) => {
      console.log(`\\n${index + 1}. ${result.url}`);
      console.log(`   标题: ${result.title}`);
      console.log(`   策略: ${result.strategy}`);
      console.log(`   状态: ${result.metadata.responseStatus}`);
    });
    
    // 显示失败的URL
    if (batchResult.failures.length > 0) {
      console.log('\\n❌ 失败的URL:');
      batchResult.failures.forEach(failure => {
        console.log(`   ${failure.url}: ${failure.error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 批量抓取失败:', error);
  } finally {
    await scraper.cleanup();
  }
}

async function demoCustomConfiguration() {
  console.log('\\n=== 自定义配置示例 ===');
  
  const customConfig: ScrapingConfig = {
    baseUrl: 'https://news.ycombinator.com',
    strategy: 'jsdom', // 强制使用jsdom (新闻网站通常是静态的)
    enableJavaScript: false,
    timeout: 10000,
    retryAttempts: 3,
    concurrency: 2,
    headers: {
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    },
    saveRawHtml: true,
    saveProcessedText: true,
    outputDir: './demo-output'
  };

  const scraper = new UniversalWebScraper(customConfig);

  try {
    const result = await scraper.scrape('https://news.ycombinator.com');
    
    console.log(`✅ 抓取 Hacker News:`);
    console.log(`   策略: ${result.strategy}`);
    console.log(`   内容长度: ${result.content.length}`);
    console.log(`   词数统计: ${result.metadata.wordCount}`);
    
    // 保存结果到文件
    await fs.ensureDir(customConfig.outputDir!);
    await fs.writeJSON(`${customConfig.outputDir}/hacker-news-result.json`, result, { spaces: 2 });
    console.log(`💾 结果已保存到: ${customConfig.outputDir}/hacker-news-result.json`);
    
  } catch (error) {
    console.error('❌ 自定义抓取失败:', error);
  } finally {
    await scraper.cleanup();
  }
}

async function demoPresetComparison() {
  console.log('\\n=== 预设配置对比示例 ===');
  
  const testUrl = 'https://example.com';
  const presets: (keyof typeof ScrapingPresets)[] = ['FAST', 'BALANCED', 'THOROUGH'];
  
  for (const presetName of presets) {
    console.log(`\\n🧪 测试预设: ${presetName}`);
    
    const scraper = UniversalWebScraper.withPreset('https://example.com', presetName);
    
    try {
      const startTime = Date.now();
      const result = await scraper.scrape(testUrl);
      const totalTime = Date.now() - startTime;
      
      console.log(`   ✅ 成功 - 策略: ${result.strategy}, 总时间: ${totalTime}ms`);
      
    } catch (error) {
      console.error(`   ❌ 失败:`, error instanceof Error ? error.message : error);
    } finally {
      await scraper.cleanup();
    }
  }
}

async function demoRealWorldSites() {
  console.log('\\n=== 真实网站抓取示例 ===');
  
  // 一些公开、友好的测试网站
  const testSites = [
    { url: 'https://httpbin.org/html', description: '简单HTML测试页' },
    { url: 'https://httpbin.org/json', description: 'JSON数据页面' },
    { url: 'https://example.com', description: '标准示例网站' },
    { url: 'https://httpstat.us/200', description: 'HTTP状态测试' }
  ];

  const scraper = UniversalWebScraper.withPreset('https://httpbin.org', 'BALANCED');

  console.log(`🌐 开始测试 ${testSites.length} 个真实网站...`);

  for (const site of testSites) {
    try {
      console.log(`\\n📍 抓取: ${site.description}`);
      console.log(`   URL: ${site.url}`);
      
      const result = await scraper.scrape(site.url);
      
      console.log(`   ✅ 成功 - 策略: ${result.strategy}`);
      console.log(`   📊 状态码: ${result.metadata.responseStatus}`);
      console.log(`   📄 内容类型: ${result.metadata.contentType}`);
      console.log(`   ⏱️  处理时间: ${result.processingTime}ms`);
      console.log(`   📝 内容长度: ${result.content.length} 字符`);
      
      if (result.title) {
        console.log(`   🏷️  页面标题: ${result.title}`);
      }
      
    } catch (error) {
      console.error(`   ❌ 抓取失败: ${error instanceof Error ? error.message : error}`);
    }
  }
  
  // 显示抓取器统计
  const stats = scraper.getStats();
  console.log(`\\n📈 抓取器统计:`);
  console.log(`   总请求: ${stats.totalRequests}`);
  console.log(`   成功: ${stats.successfulRequests}`);
  console.log(`   失败: ${stats.failedRequests}`);
  console.log(`   jsdom使用: ${stats.jsDomRequests}次`);
  console.log(`   playwright使用: ${stats.playwrightRequests}次`);

  await scraper.cleanup();
}

// 主执行函数
async function runAllDemos() {
  console.log('🚀 通用网站抓取器演示开始\\n');
  
  try {
    await demoBasicScraping();
    await demoBatchScraping();
    await demoCustomConfiguration();
    await demoPresetComparison();
    await demoRealWorldSites();
    
    console.log('\\n🎉 所有演示完成！');
    
  } catch (error) {
    console.error('演示过程出错:', error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runAllDemos().catch(console.error);
}

export {
  demoBasicScraping,
  demoBatchScraping,
  demoCustomConfiguration,
  demoPresetComparison,
  demoRealWorldSites,
  runAllDemos
};