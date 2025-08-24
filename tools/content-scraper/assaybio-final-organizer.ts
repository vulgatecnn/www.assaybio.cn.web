/**
 * AssayBio网站最终整理器
 * 创建完美的文件结构和导航
 */

import * as fs from 'fs-extra';
import * as path from 'path';

async function finalOrganize() {
  const baseDir = path.join(__dirname, '../assaybio-scraped');
  const dataFile = path.join(baseDir, 'reports/complete-scrape.json');
  
  console.log('🎯 开始最终整理AssayBio网站内容...');
  
  // 读取数据
  const data = await fs.readJSON(dataFile);
  
  // 重新整理页面文件
  const pageMapping = {
    'http://www.assaybio.cn/default.aspx': 'homepage',
    'http://www.assaybio.cn/info.aspx?id=00010001': 'about-us',
    'http://www.assaybio.cn/info.aspx?id=00020001': 'market-trend', 
    'http://www.assaybio.cn/info.aspx?id=00050001': 'literature',
    'http://www.assaybio.cn/info.aspx?id=00070001': 'products'
  };
  
  // 清理并重新创建pages目录结构
  await fs.remove(path.join(baseDir, 'pages'));
  await fs.ensureDir(path.join(baseDir, 'pages/html'));
  await fs.ensureDir(path.join(baseDir, 'pages/text'));
  await fs.ensureDir(path.join(baseDir, 'pages/markdown'));
  
  console.log('📁 重新创建页面目录结构');
  
  // 处理每个页面
  for (const result of data.results) {
    const filename = pageMapping[result.url] || 'unknown';
    const displayName = getDisplayName(filename);
    
    console.log(`📄 处理页面: ${displayName}`);
    
    // 保存HTML文件
    if (result.htmlContent) {
      await fs.writeFile(
        path.join(baseDir, 'pages/html', `${filename}.html`),
        cleanHtml(result.htmlContent),
        'utf8'
      );
    }
    
    // 保存文本文件  
    await fs.writeFile(
      path.join(baseDir, 'pages/text', `${filename}.txt`),
      cleanText(result.content),
      'utf8'
    );
    
    // 保存Markdown文件
    const markdown = generateMarkdown(result, displayName);
    await fs.writeFile(
      path.join(baseDir, 'pages/markdown', `${filename}.md`),
      markdown,
      'utf8'
    );
    
    // 保存元数据
    await fs.writeJSON(
      path.join(baseDir, 'pages', `${filename}-info.json`),
      {
        name: displayName,
        url: result.url,
        title: result.title,
        wordCount: result.content.split(/\\s+/).length,
        imageCount: result.metadata.imageCount,
        linkCount: result.metadata.linkCount,
        scrapedAt: result.timestamp,
        processingTime: result.processingTime,
        strategy: result.strategy,
        status: result.metadata.responseStatus
      },
      { spaces: 2 }
    );
  }
  
  // 生成最终报告
  await generateFinalReport(baseDir, data);
  
  console.log('✅ AssayBio网站内容最终整理完成！');
  console.log(`📂 输出目录: ${baseDir}`);
  console.log(`🌐 查看首页: ${path.join(baseDir, 'index.html')}`);
}

function getDisplayName(filename: string): string {
  const names = {
    'homepage': '网站首页',
    'about-us': '关于我们',
    'market-trend': '市场动向',
    'literature': '技术文献', 
    'products': '产品中心'
  };
  return names[filename as keyof typeof names] || filename;
}

function cleanHtml(html: string): string {
  return html
    .replace(/\\s+/g, ' ')
    .replace(/> </g, '>\\n<')
    .trim();
}

function cleanText(text: string): string {
  return text
    .replace(/\\s+/g, ' ')
    .replace(/\\n\\s*\\n/g, '\\n\\n')
    .trim();
}

function generateMarkdown(result: any, displayName: string): string {
  let md = `# ${displayName}\\n\\n`;
  md += `**原始标题**: ${result.title || '无标题'}\\n`;
  md += `**页面URL**: ${result.url}\\n`;
  md += `**抓取时间**: ${new Date(result.timestamp).toLocaleString('zh-CN')}\\n`;
  md += `**内容字数**: ${result.content.split(/\\s+/).length} 字\\n`;
  md += `**图片数量**: ${result.metadata.imageCount || 0} 张\\n`;
  md += `**链接数量**: ${result.metadata.linkCount || 0} 个\\n\\n`;
  md += `---\\n\\n`;
  md += `## 页面内容\\n\\n`;
  md += cleanText(result.content);
  md += `\\n\\n---\\n\\n`;
  md += `*此页面由通用网站抓取器于 ${new Date(result.timestamp).toLocaleString('zh-CN')} 抓取保存*`;
  
  return md;
}

async function generateFinalReport(baseDir: string, data: any) {
  console.log('📊 生成最终报告...');
  
  const report = {
    site: {
      name: 'AssayBio - 上海安净生物技术有限公司',
      url: 'http://www.assaybio.cn',
      description: '专业的生物技术检测产品和解决方案提供商',
      scrapedAt: new Date().toISOString(),
      pages: data.totalPages
    },
    pages: [
      { id: 'homepage', name: '网站首页', file: 'homepage' },
      { id: 'about-us', name: '关于我们', file: 'about-us' },
      { id: 'market-trend', name: '市场动向', file: 'market-trend' },
      { id: 'literature', name: '技术文献', file: 'literature' },
      { id: 'products', name: '产品中心', file: 'products' }
    ],
    statistics: {
      totalWords: data.results.reduce((sum: number, r: any) => sum + r.content.split(/\\s+/).length, 0),
      totalImages: data.summary.totalImages,
      totalLinks: data.summary.totalLinks,
      avgProcessingTime: Math.round(data.summary.avgProcessingTime),
      successRate: '100%'
    },
    directories: {
      pages: 'pages/ - 页面内容文件',
      assets: 'assets/ - 网站资源文件',
      reports: 'reports/ - 抓取报告和数据',
      index: 'index.html - 网站导航首页'
    }
  };
  
  await fs.writeJSON(
    path.join(baseDir, 'final-report.json'),
    report,
    { spaces: 2 }
  );
  
  // 生成更好的HTML首页
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.site.name} - 网站归档</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; 
               background: #f8f9fa; color: #333; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; border-radius: 12px; padding: 30px; margin-bottom: 20px; 
                 box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header h1 { color: #2c3e50; font-size: 2.2em; margin-bottom: 10px; }
        .header p { color: #7f8c8d; font-size: 1.1em; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                gap: 15px; margin-bottom: 30px; }
        .stat { background: white; padding: 20px; border-radius: 8px; text-align: center; 
               box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2em; font-weight: 700; color: #3498db; }
        .stat-label { color: #7f8c8d; font-size: 0.9em; margin-top: 5px; }
        .nav { background: white; border-radius: 12px; padding: 30px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .nav h2 { color: #2c3e50; margin-bottom: 20px; }
        .page-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .page-card { background: #fff; border: 1px solid #e1e8ed; border-radius: 8px; 
                    padding: 20px; transition: all 0.3s ease; }
        .page-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); transform: translateY(-2px); }
        .page-title { font-size: 1.3em; font-weight: 600; color: #2c3e50; margin-bottom: 15px; }
        .page-links { display: flex; gap: 10px; flex-wrap: wrap; }
        .page-links a { color: white; background: #3498db; text-decoration: none; 
                       padding: 8px 16px; border-radius: 20px; font-size: 0.85em; 
                       transition: all 0.3s ease; }
        .page-links a:hover { background: #2980b9; transform: scale(1.05); }
        .footer { text-align: center; margin-top: 40px; padding: 20px; color: #7f8c8d; }
        .badge { background: #27ae60; color: white; padding: 4px 8px; border-radius: 12px; 
                font-size: 0.8em; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${report.site.name}</h1>
            <p>${report.site.description}</p>
            <p>原始网站: <a href="${report.site.url}" target="_blank" style="color: #3498db;">${report.site.url}</a></p>
            <div style="margin-top: 15px;">
                <span class="badge">✅ 抓取完成</span>
                <span style="margin-left: 10px; color: #7f8c8d;">
                    ${new Date(report.site.scrapedAt).toLocaleString('zh-CN')}
                </span>
            </div>
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-number">${report.site.pages}</div>
                <div class="stat-label">📄 抓取页面</div>
            </div>
            <div class="stat">
                <div class="stat-number">${report.statistics.totalWords.toLocaleString()}</div>
                <div class="stat-label">📝 总字数</div>
            </div>
            <div class="stat">
                <div class="stat-number">${report.statistics.totalImages}</div>
                <div class="stat-label">🖼️ 图片资源</div>
            </div>
            <div class="stat">
                <div class="stat-number">${report.statistics.totalLinks}</div>
                <div class="stat-label">🔗 链接数量</div>
            </div>
        </div>
        
        <div class="nav">
            <h2>📚 页面导航</h2>
            <div class="page-grid">
                ${report.pages.map(page => `
                    <div class="page-card">
                        <div class="page-title">${page.name}</div>
                        <div class="page-links">
                            <a href="pages/html/${page.file}.html" target="_blank">HTML源码</a>
                            <a href="pages/markdown/${page.file}.md" target="_blank">Markdown</a>
                            <a href="pages/text/${page.file}.txt" target="_blank">纯文本</a>
                            <a href="pages/${page.file}-info.json" target="_blank">页面信息</a>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="footer">
            <p>📊 <strong>资源统计</strong></p>
            <p>• 图片文件: <a href="assets/images/" style="color: #3498db;">assets/images/</a> (${report.statistics.totalImages} 个文件)</p>
            <p>• 完整报告: <a href="final-report.json" style="color: #3498db;">final-report.json</a></p>
            <p>• 网站地图: <a href="sitemap.json" style="color: #3498db;">sitemap.json</a></p>
            <div style="margin-top: 20px; font-size: 0.9em;">
                🤖 由通用网站抓取器生成 • 平均处理时间: ${report.statistics.avgProcessingTime}ms/页面
            </div>
        </div>
    </div>
</body>
</html>`;
  
  await fs.writeFile(path.join(baseDir, 'index.html'), html, 'utf8');
  console.log('✅ HTML导航页面生成完成');
}

// 执行整理
if (require.main === module) {
  finalOrganize().catch(console.error);
}

export { finalOrganize };