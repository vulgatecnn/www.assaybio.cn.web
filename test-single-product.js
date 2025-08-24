const { chromium } = require('playwright');

// 测试单个产品页面
async function testSingleProduct() {
  console.log('测试单个产品页面抓取...');
  
  const browser = await chromium.launch({ 
    headless: false, 
    timeout: 60000 
  });
  
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    
    // 测试第一个产品
    const testUrl = 'http://www.assaybio.cn/Info.aspx?id=000700010001';
    console.log(`访问测试URL: ${testUrl}`);
    
    await page.goto(testUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // 获取页面信息
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        bodyText: document.body.innerText.substring(0, 1000),
        images: Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt
        })),
        headings: Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.textContent.trim()),
        tables: Array.from(document.querySelectorAll('table')).length,
        hasContent: document.body.innerText.length > 100
      };
    });
    
    console.log('页面信息:', JSON.stringify(pageInfo, null, 2));
    
    // 截图保存
    await page.screenshot({ 
      path: 'test-screenshot.png', 
      fullPage: true 
    });
    
    console.log('✅ 测试完成，已保存截图 test-screenshot.png');
    
    return pageInfo;
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  testSingleProduct().catch(console.error);
}

module.exports = { testSingleProduct };