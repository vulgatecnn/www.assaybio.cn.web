const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const url = require('url');

// 产品ID列表
const PRODUCT_IDS = [
  { id: '000700010001', name: '科立得试剂 24小时' },
  { id: '000700010002', name: '科立得试剂 18小时' },
  { id: '000700010003', name: 'Colilert® 250' },
  { id: '000700010004', name: 'Colisure®' },
  { id: '000700010005', name: '51孔定量盘®' },
  { id: '000700010006', name: '97孔定量盘®' },
  { id: '000700010007', name: '无菌取样瓶' },
  { id: '000700010008', name: '标准阳性品' },
  { id: '000700010009', name: '程控定量封口机' },
  { id: '000700010010', name: '紫外灯及灯箱' },
  { id: '000700010011', name: '隔水式恒温培养箱' },
  { id: '000700010012', name: 'DST技术大肠菌群检测系统' },
  { id: '000700010013', name: '电热恒温培养箱' },
  { id: '000700010014', name: '涡旋振荡器' },
  { id: '000700010015', name: '升级版程控定量封口机' }
];

const BASE_URL = 'http://www.assaybio.cn/Info.aspx?id=';
const IMAGE_DIR = path.join(__dirname, 'apps', 'website', 'public', 'images', 'products');

// 生成产品ID
function generateProductId(index) {
  return `prod${String(index + 1).padStart(3, '0')}`;
}

// 生成slug
function generateSlug(name) {
  return name.toLowerCase()
    .replace(/®/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-\u4e00-\u9fa5]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// 下载图片
async function downloadImage(imageUrl, filename) {
  try {
    if (!imageUrl || imageUrl.startsWith('data:')) {
      console.log(`跳过无效图片链接: ${imageUrl}`);
      return null;
    }

    // 处理相对URL
    let fullUrl = imageUrl;
    if (imageUrl.startsWith('/')) {
      fullUrl = `http://www.assaybio.cn${imageUrl}`;
    } else if (!imageUrl.startsWith('http')) {
      fullUrl = `http://www.assaybio.cn/${imageUrl}`;
    }

    console.log(`下载图片: ${fullUrl}`);

    return new Promise((resolve, reject) => {
      const file = require('fs').createWriteStream(path.join(IMAGE_DIR, filename));
      // 使用 http 模块而不是 https，因为目标网站是 http
      const http = require('http');
      const request = http.get(fullUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log(`图片下载完成: ${filename}`);
          resolve(filename);
        });

        file.on('error', (err) => {
          require('fs').unlink(path.join(IMAGE_DIR, filename), () => {});
          reject(err);
        });
      });

      request.on('error', (err) => {
        reject(err);
      });

      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('下载超时'));
      });
    });
  } catch (error) {
    console.error(`下载图片失败 ${imageUrl}:`, error.message);
    return null;
  }
}

// 提取产品信息
async function scrapeProduct(page, productId, productName) {
  try {
    const url = `${BASE_URL}${productId}`;
    console.log(`正在抓取: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // 等待页面加载
    await page.waitForTimeout(3000);

    // 提取产品信息
    const productData = await page.evaluate(() => {
      const result = {
        name: '',
        nameEn: '',
        manufacturer: '',
        origin: '',
        waterType: '',
        detectionTarget: '',
        detectionContent: '',
        detectionVolume: '',
        detectionTime: '',
        productCode: '',
        specifications: '',
        storageConditions: '',
        shelfLife: '',
        description: '',
        usage: '',
        overview: '',
        images: []
      };

      // 获取页面文本内容
      const bodyText = document.body.textContent || document.body.innerText || '';
      
      // 基于实际页面结构，提取各种信息
      const patterns = {
        nameEn: /英文品名[：:]\s*([^\n\r]+)/i,
        name: /中文品名[：:]\s*([^\n\r]+)/i,
        manufacturer: /制\s*造\s*商[：:]\s*([^\n\r]+)/i,
        origin: /产\s*地[：:]\s*([^\n\r]+)/i,
        waterType: /检测水样[：:]\s*([^\n\r]+)/i,
        detectionTarget: /检测对象[：:]\s*([^\n\r，]+)/i,
        detectionContent: /检测内容[：:]\s*([^\n\r]+)/i,
        detectionVolume: /检测体积[：:]\s*([^\n\r]+)/i,
        detectionTime: /检测时间[：:]\s*([^\n\r]+)/i,
        productCode: /货号[：:]\s*([^\n\r]+)/i,
        specifications: /规格[：:]\s*([^\n\r]+)/i,
        storageConditions: /保存条件[：:]\s*([^\n\r]+)/i,
        shelfLife: /有效期[：:]\s*([^\n\r]+)/i
      };

      for (const [key, pattern] of Object.entries(patterns)) {
        const match = bodyText.match(pattern);
        if (match) {
          result[key] = match[1].trim().replace(/\s+/g, ' ');
        }
      }

      // 获取产品描述 - 从"原理"部分提取
      const principleMatch = bodyText.match(/原理\s*([^。]*。[^。]*。)/);
      if (principleMatch) {
        result.description = principleMatch[1].trim().substring(0, 200);
      } else {
        // 如果没有原理部分，使用通用描述
        result.description = `${result.name || result.nameEn} - 专业的微生物检测试剂，适用于${result.detectionTarget || '水质检测'}。`;
      }

      // 获取产品概述要点
      const overviewPoints = [];
      if (result.detectionTime) overviewPoints.push(`检测时间：${result.detectionTime}`);
      if (result.manufacturer) overviewPoints.push(`制造商：${result.manufacturer}`);
      if (result.origin) overviewPoints.push(`产地：${result.origin}`);
      if (result.detectionTarget) overviewPoints.push(`检测对象：${result.detectionTarget}`);
      result.overview = overviewPoints.join('；');

      // 获取所有图片，排除logo和导航图片
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        const src = img.src || img.getAttribute('src');
        if (src && 
            !src.includes('logo') && 
            !src.includes('nav') && 
            !src.includes('menu') &&
            !src.includes('banner') &&
            src.includes('/Upload/')) {
          result.images.push(src);
        }
      });

      return result;
    });

    console.log(`提取的产品数据:`, productData);

    // 下载图片
    const downloadedImages = [];
    for (let i = 0; i < productData.images.length; i++) {
      const imageUrl = productData.images[i];
      const extension = path.extname(imageUrl) || '.jpg';
      const filename = `${generateSlug(productName)}-${i + 1}${extension}`;
      
      const downloadedFilename = await downloadImage(imageUrl, filename);
      if (downloadedFilename) {
        downloadedImages.push(`/images/products/${downloadedFilename}`);
      }
    }

    // 构建最终产品数据
    const finalProduct = {
      id: generateProductId(PRODUCT_IDS.findIndex(p => p.id === productId)),
      slug: generateSlug(productName),
      name: productData.name || productName,
      category: {
        id: detectCategory(productName),
        name: detectCategoryName(productName),
        slug: detectCategoryName(productName)
      },
      description: productData.description || `${productName} - 专业的微生物检测解决方案`,
      features: extractFeatures(productData),
      specifications: buildSpecifications(productData),
      images: {
        main: downloadedImages[0] || `/images/products/${generateSlug(productName)}-main.jpg`,
        gallery: downloadedImages.slice(1)
      },
      seo: {
        title: productData.name || productName,
        description: `${productData.name || productName} - 专业的微生物检测解决方案`,
        keywords: generateKeywords(productName)
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return finalProduct;

  } catch (error) {
    console.error(`抓取产品失败 ${productId}:`, error.message);
    
    // 返回基本产品信息
    return {
      id: generateProductId(PRODUCT_IDS.findIndex(p => p.id === productId)),
      slug: generateSlug(productName),
      name: productName,
      category: {
        id: detectCategory(productName),
        name: detectCategoryName(productName),
        slug: detectCategoryName(productName)
      },
      description: `${productName} - 专业的微生物检测解决方案`,
      features: [`${productName}的特色功能`],
      specifications: {},
      images: {
        main: `/images/products/${generateSlug(productName)}-main.jpg`,
        gallery: []
      },
      seo: {
        title: productName,
        description: `${productName} - 专业的微生物检测解决方案`,
        keywords: generateKeywords(productName)
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

// 检测产品类别
function detectCategory(productName) {
  const name = productName.toLowerCase();
  if (name.includes('试剂') || name.includes('colilert') || name.includes('colisure')) {
    return '5oC75aSn6IKg'; // 试剂类
  } else if (name.includes('定量盘')) {
    return '5YiG5Lyg6aOf'; // 耗材类
  } else if (name.includes('培养箱') || name.includes('封口机') || name.includes('紫外灯') || name.includes('振荡器')) {
    return '5qOA5rWL6K6+'; // 设备类
  } else if (name.includes('系统')) {
    return '5qCH6L6q5Lit'; // 系统类
  }
  return '5YW25LuW'; // 其他
}

function detectCategoryName(productName) {
  const name = productName.toLowerCase();
  if (name.includes('试剂') || name.includes('colilert') || name.includes('colisure')) {
    return '检测试剂';
  } else if (name.includes('定量盘')) {
    return '实验耗材';
  } else if (name.includes('培养箱') || name.includes('封口机') || name.includes('紫外灯') || name.includes('振荡器')) {
    return '检测设备';
  } else if (name.includes('系统')) {
    return '检测系统';
  }
  return '其他产品';
}

// 提取特性
function extractFeatures(productData) {
  const features = [];
  
  if (productData.detectionTime) {
    features.push(`检测时间: ${productData.detectionTime}`);
  }
  if (productData.manufacturer) {
    features.push(`制造商: ${productData.manufacturer}`);
  }
  if (productData.origin) {
    features.push(`产地: ${productData.origin}`);
  }
  if (productData.detectionTarget) {
    features.push(`检测对象: ${productData.detectionTarget}`);
  }
  
  if (features.length === 0) {
    features.push('高精度检测', '操作简便', '结果可靠');
  }
  
  return features;
}

// 构建规格信息
function buildSpecifications(productData) {
  const specs = {};
  
  if (productData.manufacturer) specs['制造商'] = productData.manufacturer;
  if (productData.origin) specs['产地'] = productData.origin;
  if (productData.detectionTime) specs['检测时间'] = productData.detectionTime;
  if (productData.detectionVolume) specs['检测体积'] = productData.detectionVolume;
  if (productData.productCode) specs['货号'] = productData.productCode;
  if (productData.specifications) specs['规格'] = productData.specifications;
  if (productData.storageConditions) specs['保存条件'] = productData.storageConditions;
  if (productData.shelfLife) specs['有效期'] = productData.shelfLife;
  
  return specs;
}

// 生成关键词
function generateKeywords(productName) {
  const baseKeywords = ['微生物检测', '水质分析', 'Assay Bio', '检测技术'];
  const productKeywords = productName.split(/[\s\-®]+/).filter(word => word.length > 1);
  
  return [...baseKeywords, ...productKeywords].slice(0, 8);
}

// 主函数
async function main() {
  console.log('开始抓取产品信息...');
  
  const browser = await chromium.launch({ 
    headless: false, // 设为 false 以便调试
    timeout: 60000 
  });
  
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    // 设置超时
    page.setDefaultTimeout(30000);
    
    const products = [];
    
    for (const product of PRODUCT_IDS) {
      console.log(`\n=== 处理产品: ${product.name} (${product.id}) ===`);
      
      try {
        const productData = await scrapeProduct(page, product.id, product.name);
        products.push(productData);
        console.log(`✅ 成功抓取: ${product.name}`);
        
        // 等待一下避免请求过快
        await page.waitForTimeout(2000);
      } catch (error) {
        console.error(`❌ 抓取失败: ${product.name} -`, error.message);
      }
    }
    
    // 保存结果
    const outputPath = path.join(__dirname, 'scraped-products.json');
    await fs.writeFile(outputPath, JSON.stringify(products, null, 2), 'utf8');
    
    console.log(`\n✅ 抓取完成! 共处理 ${products.length} 个产品`);
    console.log(`结果保存到: ${outputPath}`);
    
    return products;
    
  } finally {
    await browser.close();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, scrapeProduct, PRODUCT_IDS };