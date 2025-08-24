#!/usr/bin/env node

/**
 * 通用网站抓取器 CLI 工具
 * 简单命令行界面，方便快速抓取网站内容
 */

import { UniversalWebScraper, ScrapingPresets } from './universal-web-scraper';
import { ScrapingConfig } from './types/universal-scraper-types';
import * as fs from 'fs-extra';
import * as path from 'path';

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const config: Partial<ScrapingConfig> = {
    baseUrl: ''
  };

  let urls: string[] = [];
  let outputFile = '';
  let preset: keyof typeof ScrapingPresets = 'BALANCED';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--url':
      case '-u':
        if (args[i + 1]) {
          urls.push(args[++i]);
        }
        break;
      
      case '--urls':
        // 批量URL，逗号分隔
        if (args[i + 1]) {
          urls.push(...args[++i].split(',').map(u => u.trim()));
        }
        break;

      case '--preset':
      case '-p':
        if (args[i + 1]) {
          const presetName = args[++i].toUpperCase() as keyof typeof ScrapingPresets;
          if (presetName in ScrapingPresets) {
            preset = presetName;
          }
        }
        break;

      case '--strategy':
      case '-s':
        if (args[i + 1]) {
          const strategy = args[++i];
          if (['jsdom', 'playwright', 'auto'].includes(strategy)) {
            config.strategy = strategy as any;
          }
        }
        break;

      case '--timeout':
      case '-t':
        if (args[i + 1]) {
          config.timeout = parseInt(args[++i]);
        }
        break;

      case '--delay':
      case '-d':
        if (args[i + 1]) {
          config.delay = parseInt(args[++i]);
        }
        break;

      case '--output':
      case '-o':
        if (args[i + 1]) {
          outputFile = args[++i];
        }
        break;

      case '--concurrency':
      case '-c':
        if (args[i + 1]) {
          config.concurrency = parseInt(args[++i]);
        }
        break;

      case '--no-js':
        config.enableJavaScript = false;
        break;

      case '--save-html':
        config.saveRawHtml = true;
        break;

      case '--download-assets':
        config.downloadAssets = true;
        break;

      case '--verbose':
      case '-v':
        // 详细模式会在后面处理
        break;

      default:
        // 如果不是选项且看起来像URL，添加到URL列表
        if (arg.startsWith('http://') || arg.startsWith('https://')) {
          urls.push(arg);
        }
    }
  }

  if (urls.length === 0) {
    console.error('❌ 错误: 需要至少提供一个URL');
    printHelp();
    process.exit(1);
  }

  // 设置baseUrl为第一个URL的域名
  config.baseUrl = new URL(urls[0]).origin;

  return {
    urls,
    config,
    outputFile,
    preset,
    verbose: args.includes('--verbose') || args.includes('-v')
  };
}

function printHelp() {
  console.log(`
🕷️  通用网站抓取器 CLI

用法:
  scrape-cli <URL> [选项]
  scrape-cli --url <URL> [选项]
  scrape-cli --urls <URL1,URL2,URL3> [选项]

参数:
  -u, --url <URL>           要抓取的URL
  --urls <URL1,URL2,...>    批量抓取URL（逗号分隔）
  -o, --output <file>       输出文件路径（JSON格式）
  
抓取选项:
  -p, --preset <PRESET>     使用预设配置 (FAST|BALANCED|THOROUGH)
  -s, --strategy <STRATEGY> 抓取策略 (jsdom|playwright|auto)
  -t, --timeout <ms>        超时时间（毫秒）
  -d, --delay <ms>          请求间延迟（毫秒）
  -c, --concurrency <num>   并发数量
  
内容选项:
  --no-js                   禁用JavaScript
  --save-html               保存原始HTML
  --download-assets         下载资源文件
  
其他选项:
  -v, --verbose             详细输出
  -h, --help                显示帮助

示例:
  scrape-cli https://example.com
  scrape-cli https://example.com --preset FAST --output result.json
  scrape-cli --urls "https://site1.com,https://site2.com" --concurrency 2
  scrape-cli https://spa-site.com --strategy playwright --save-html
`);
}

async function main() {
  const { urls, config, outputFile, preset, verbose } = parseArgs();

  console.log('🚀 启动通用网站抓取器');
  
  if (verbose) {
    console.log(`📝 配置信息:`);
    console.log(`   URLs: ${urls.join(', ')}`);
    console.log(`   预设: ${preset}`);
    console.log(`   策略: ${config.strategy || '自动'}`);
    console.log(`   输出: ${outputFile || '控制台'}`);
  }

  // 创建抓取器
  const scraper = config.strategy 
    ? new UniversalWebScraper({ ...config, baseUrl: config.baseUrl! })
    : UniversalWebScraper.withPreset(config.baseUrl!, preset, config);

  try {
    const startTime = Date.now();

    if (urls.length === 1) {
      // 单个URL抓取
      console.log(`🔍 抓取单个URL: ${urls[0]}`);
      const result = await scraper.scrape(urls[0]);
      
      console.log(`✅ 抓取成功!`);
      console.log(`   标题: ${result.title}`);
      console.log(`   策略: ${result.strategy}`);
      console.log(`   状态码: ${result.metadata.responseStatus}`);
      console.log(`   内容长度: ${result.content.length} 字符`);
      console.log(`   处理时间: ${result.processingTime}ms`);
      
      if (result.metadata.wordCount > 0) {
        console.log(`   词数统计: ${result.metadata.wordCount} 词`);
      }
      
      if (result.metadata.imageCount > 0) {
        console.log(`   图片数量: ${result.metadata.imageCount}`);
      }
      
      if (result.metadata.linkCount > 0) {
        console.log(`   链接数量: ${result.metadata.linkCount}`);
      }

      // 保存或输出结果
      if (outputFile) {
        await saveResult(result, outputFile);
      } else if (verbose) {
        console.log(`\\n📄 页面内容预览 (前500字符):`);
        console.log(result.content.substring(0, 500) + (result.content.length > 500 ? '...' : ''));
      }

    } else {
      // 批量抓取
      console.log(`🔍 批量抓取 ${urls.length} 个URL`);
      const batchResult = await scraper.scrapeMultiple(urls);
      
      console.log(`\\n📊 批量抓取完成!`);
      console.log(`   总页面: ${batchResult.totalPages}`);
      console.log(`   成功: ${batchResult.successCount}`);
      console.log(`   失败: ${batchResult.failureCount}`);
      console.log(`   总耗时: ${Math.round(batchResult.duration / 1000)}秒`);
      console.log(`   平均时间: ${Math.round(batchResult.summary.avgProcessingTime)}ms`);
      
      console.log(`\\n🎯 策略统计:`);
      console.log(`   jsdom: ${batchResult.summary.strategyCounts.jsdom}次`);
      console.log(`   playwright: ${batchResult.summary.strategyCounts.playwright}次`);
      
      // 显示每个结果
      if (verbose) {
        console.log(`\\n📋 详细结果:`);
        batchResult.results.forEach((result, index) => {
          console.log(`\\n${index + 1}. ${result.url}`);
          console.log(`   标题: ${result.title}`);
          console.log(`   策略: ${result.strategy}`);
          console.log(`   状态: ${result.metadata.responseStatus}`);
          console.log(`   内容: ${result.content.length} 字符`);
        });
      }
      
      // 显示失败信息
      if (batchResult.failures.length > 0) {
        console.log(`\\n❌ 失败的URL:`);
        batchResult.failures.forEach(failure => {
          console.log(`   ${failure.url}: ${failure.error}`);
        });
      }

      // 保存批量结果
      if (outputFile) {
        await saveResult(batchResult, outputFile);
      }
    }

    // 显示性能统计
    const stats = scraper.getStats();
    const totalTime = Date.now() - startTime;
    
    console.log(`\\n📈 总体统计:`);
    console.log(`   总请求: ${stats.totalRequests}`);
    console.log(`   成功率: ${Math.round(stats.successfulRequests / stats.totalRequests * 100)}%`);
    console.log(`   总耗时: ${Math.round(totalTime / 1000)}秒`);

  } catch (error) {
    console.error('❌ 抓取过程出错:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await scraper.cleanup();
    console.log('\\n🎉 抓取完成，资源已清理');
  }
}

async function saveResult(result: any, outputFile: string) {
  try {
    // 确保输出目录存在
    await fs.ensureDir(path.dirname(outputFile));
    
    // 保存JSON文件
    await fs.writeJSON(outputFile, result, { spaces: 2 });
    
    console.log(`💾 结果已保存到: ${outputFile}`);
    
    // 如果是批量结果，额外生成简化版本
    if (result.results && Array.isArray(result.results)) {
      const summaryFile = outputFile.replace('.json', '-summary.json');
      const summary = {
        totalPages: result.totalPages,
        successCount: result.successCount,
        failureCount: result.failureCount,
        duration: result.duration,
        summary: result.summary,
        urls: result.results.map((r: any) => ({
          url: r.url,
          title: r.title,
          strategy: r.strategy,
          wordCount: r.metadata.wordCount,
          status: r.metadata.responseStatus
        }))
      };
      
      await fs.writeJSON(summaryFile, summary, { spaces: 2 });
      console.log(`📋 摘要已保存到: ${summaryFile}`);
    }
    
  } catch (error) {
    console.error('❌ 保存文件失败:', error);
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的错误:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ 未处理的Promise拒绝:', error);
  process.exit(1);
});

// 启动
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ 程序执行失败:', error);
    process.exit(1);
  });
}

export { main, parseArgs };