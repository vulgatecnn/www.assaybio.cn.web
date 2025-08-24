// 基于抓取结果生成完整的产品数据
const fs = require('fs').promises;
const path = require('path');

// 从实际抓取中获得的详细产品信息
const detailedProductData = {
  'prod001': {
    name: '科立得试剂 24小时',
    nameEn: 'Colilert',
    manufacturer: 'IDEXX',
    origin: '美国',
    waterType: '水源水，饮用水',
    detectionTarget: '总大肠菌群、耐热大肠菌群、大肠埃希氏菌',
    detectionContent: '定性检测、定量检测',
    detectionVolume: '100ml',
    detectionTime: '24小时',
    productCode: '98-17506-00',
    specifications: '200个/盒',
    storageConditions: '2℃~30℃',
    shelfLife: '12个月',
    description: '科立得利用专利技术固定底物技术酶底物法® (DST®) 可在36℃培养温度下，同时检测总大肠菌群和大肠埃希氏菌；在44.5℃培养温度下检测耐热大肠菌。科立得采用ONPG和MUG 两种营养指示剂，这两种试剂分别可以被大肠菌群的β-半乳糖苷酶和大肠杆菌的β-葡糖醛酸酶分解代谢。'
  },
  'prod002': {
    name: '科立得试剂 18小时',
    nameEn: 'Colilert®-18',
    manufacturer: 'IDEXX',
    origin: '美国',
    waterType: '海水',
    detectionTarget: '总大肠菌群、耐热大肠菌、大肠埃希氏菌',
    detectionContent: '定性检测、定量检测',
    detectionVolume: '100ml',
    detectionTime: '18小时',
    productCode: '98-08877-00',
    specifications: '200个/盒',
    storageConditions: '2℃~25℃',
    shelfLife: '15个月',
    description: 'Colilert -18 利用固定底物技术酶底物法® (DST®) 营养指示剂 ONPG 和 NUG 检测总大肠菌群和大肠埃希氏菌或粪大肠菌群。大肠菌群利用其 β-半乳糖苷酶分解代谢 ONPG 并使其从无色变为黄色。'
  },
  'prod003': {
    name: 'Colilert® 250',
    nameEn: 'Colilert®250',
    manufacturer: 'IDEXX',
    origin: '美国',
    waterType: '瓶装水',
    detectionTarget: '总大肠菌群、耐热大肠菌、大肠埃希氏菌',
    detectionContent: '定性检测、定量检测',
    detectionVolume: '250ml',
    detectionTime: '24小时',
    productCode: '98-26017-00',
    specifications: '100个/盒',
    storageConditions: '2℃~30℃',
    shelfLife: '12个月',
    description: 'Colilert 250 利用专利技术固定底物技术酶底物法® (DST®) 可同时检测总大肠菌群和大肠杆菌。Colilert 采用 ONPG 和 MUG 两种营养指示剂，这两种试剂分别可以被大肠菌群的 β-半乳糖苷酶和大肠杆菌的 β-葡糖醛酸酶分解代谢。'
  },
  'prod004': {
    name: 'Colisure®',
    nameEn: 'Colisure®',
    manufacturer: 'IDEXX',
    origin: '美国',
    waterType: '水源水，饮用水',
    detectionTarget: '总大肠菌群、大肠埃希氏菌、粪大肠菌群',
    detectionContent: '定性检测、定量检测',
    detectionVolume: '100ml',
    detectionTime: '24-48小时',
    productCode: '98-13174-00',
    specifications: '200个/盒',
    storageConditions: '2℃~25℃',
    shelfLife: '12个月',
    description: 'Colisure® 利用固定底物技术酶底物法® (DST®) 营养指示剂 CPRG 和 MUG 来检测总大肠菌群及大肠杆菌。大肠菌群利用其 β-半乳糖苷酶分解代谢 CPRG 并使其从黄色变为粉红色。'
  },
  'prod005': {
    name: '51孔定量盘®',
    nameEn: '51-well Quanti-Tray®',
    manufacturer: 'IDEXX',
    origin: '美国',
    waterType: '通用水样',
    detectionTarget: '配合固定底物技术酶底物法试剂使用',
    detectionContent: '定量检测',
    detectionVolume: '100ml',
    detectionTime: '根据试剂而定',
    productCode: '98-21378-00',
    specifications: '100个/箱',
    storageConditions: '常温保存',
    shelfLife: '30个月',
    description: '51孔定量盘®适用于基于固定底物技术酶底物法的各种试剂，提供精确的定量检测结果。配合MPN表使用，可快速计算菌落数量。'
  },
  'prod006': {
    name: '97孔定量盘®',
    nameEn: '97-well Quanti-Tray®',
    manufacturer: 'IDEXX',
    origin: '美国',
    waterType: '通用水样',
    detectionTarget: '配合固定底物技术酶底物法试剂使用',
    detectionContent: '定量检测',
    detectionVolume: '100ml',
    detectionTime: '根据试剂而定',
    productCode: '98-21378-00',
    specifications: '100个/箱',
    storageConditions: '常温保存',
    shelfLife: '30个月',
    description: '97孔定量盘®适用于基于固定底物技术酶底物法的各种试剂，提供更精确的定量检测结果。配合MPN表使用，检测范围更广，精度更高。'
  },
  'prod007': {
    name: '120ml 无菌取样瓶',
    nameEn: '120ml Vessels',
    manufacturer: 'IDEXX',
    origin: '美国',
    waterType: '出厂水、处理水等各种水样',
    detectionTarget: '配合固定底物技术酶底物法试剂使用',
    detectionContent: '定量检测、定性检测',
    detectionVolume: '可定量100ml水样',
    detectionTime: '根据试剂而定',
    productCode: '98-09221-00（含硫代硫酸钠）',
    specifications: '200个/箱',
    storageConditions: '常温保存',
    shelfLife: '36个月',
    description: '120ml无菌取样瓶特别适用于含氯水样的采集和检测，内含硫代硫酸钠可中和余氯。瓶身透明，便于观察反应结果。'
  },
  'prod008': {
    name: '97孔阳性比色盘',
    nameEn: 'Quanti-tray2000 Comparator',
    manufacturer: 'IDEXX',
    origin: '美国',
    waterType: '',
    detectionTarget: '结果判读辅助工具',
    detectionContent: '结果比对',
    detectionVolume: '',
    detectionTime: '',
    productCode: '98-09227-00',
    specifications: '1个/袋',
    storageConditions: '2-30°C',
    shelfLife: '10个月',
    description: '97孔阳性比色盘作为标准阳性对照品，用于验证试剂活性和判读结果的准确性。帮助实验人员准确识别阳性反应。'
  },
  'prod009': {
    name: '程控定量封口机',
    nameEn: 'Quanti-Tray Sealer',
    manufacturer: '中国制造',
    origin: '中国',
    waterType: '',
    detectionTarget: '定量盘封口设备',
    detectionContent: '设备操作',
    detectionVolume: '',
    detectionTime: '',
    productCode: '98-19353-00',
    specifications: '1台/箱',
    storageConditions: '干燥环境',
    shelfLife: '',
    description: '程控定量封口机专门用于51孔和97孔定量盘的封口操作，确保封口质量和检测准确性。操作简便，封口效果均匀。'
  },
  'prod010': {
    name: '紫外灯及灯箱',
    nameEn: 'UV Light & Light Box',
    manufacturer: '',
    origin: '',
    waterType: '',
    detectionTarget: '荧光检测设备',
    detectionContent: '荧光观察',
    detectionVolume: '',
    detectionTime: '',
    productCode: '',
    specifications: '不同规格可选',
    storageConditions: '干燥环境',
    shelfLife: '',
    description: '紫外灯及灯箱用于观察大肠埃希氏菌的荧光反应，是酶底物法检测中必需的配套设备。提供稳定的紫外光源，确保检测结果准确。'
  },
  'prod011': {
    name: '隔水式恒温培养箱',
    nameEn: 'Water Bath Incubator',
    manufacturer: '',
    origin: '上海',
    waterType: '',
    detectionTarget: '培养设备',
    detectionContent: '恒温培养',
    detectionVolume: '',
    detectionTime: '',
    productCode: '',
    specifications: '不同容量可选',
    storageConditions: '常规保存',
    shelfLife: '',
    description: '隔水式恒温培养箱提供精确的温度控制，适用于微生物培养。水浴加热方式确保温度均匀稳定，满足各种检测需求。'
  },
  'prod012': {
    name: 'DST技术大肠菌群检测系统',
    nameEn: 'DST Coliform Detection System',
    manufacturer: '',
    origin: '',
    waterType: '各种水样',
    detectionTarget: '大肠菌群检测系统',
    detectionContent: '系统检测',
    detectionVolume: '',
    detectionTime: '24-28小时',
    productCode: '',
    specifications: '完整系统',
    storageConditions: '',
    shelfLife: '',
    description: 'DST技术大肠菌群检测系统集成了固定底物技术的所有优势，提供完整的检测解决方案。系统包括试剂、设备和技术支持。'
  },
  'prod013': {
    name: '电热恒温培养箱',
    nameEn: 'Electric Incubator',
    manufacturer: '',
    origin: '上海',
    waterType: '',
    detectionTarget: '培养设备',
    detectionContent: '恒温培养',
    detectionVolume: '',
    detectionTime: '',
    productCode: '',
    specifications: '不同容量可选',
    storageConditions: '常规保存',
    shelfLife: '',
    description: '电热恒温培养箱采用电加热方式，温度控制精确，适用于各种微生物培养实验。结构紧凑，操作简便。'
  },
  'prod014': {
    name: '涡旋振荡器',
    nameEn: 'Vortex Mixer',
    manufacturer: '',
    origin: '韩国',
    waterType: '',
    detectionTarget: '样品混合设备',
    detectionContent: '样品处理',
    detectionVolume: '',
    detectionTime: '',
    productCode: '',
    specifications: '标准规格',
    storageConditions: '干燥环境',
    shelfLife: '',
    description: '涡旋振荡器用于样品的快速混合，确保试剂与水样充分接触。操作简单，混合效果好，是实验室必备设备。'
  },
  'prod015': {
    name: '升级版程控定量封口机',
    nameEn: 'Quanti-Tray Sealer Plus',
    manufacturer: '',
    origin: '美国',
    waterType: '',
    detectionTarget: '定量盘封口设备',
    detectionContent: '设备操作',
    detectionVolume: '',
    detectionTime: '',
    productCode: '98-0002570-00',
    specifications: '1台/箱',
    storageConditions: '干燥环境',
    shelfLife: '',
    description: '升级版程控定量封口机在原有功能基础上增加了更多智能化功能，封口质量更稳定，操作更便捷，是实验室的理想选择。'
  }
};

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

// 检测产品类别
function detectCategory(productName) {
  const name = productName.toLowerCase();
  if (name.includes('试剂') || name.includes('colilert') || name.includes('colisure')) {
    return '5oC75aSn6IKg'; // 试剂类
  } else if (name.includes('定量盘') || name.includes('取样瓶')) {
    return '5YiG5Lyg6aOf'; // 耗材类
  } else if (name.includes('培养箱') || name.includes('封口机') || name.includes('紫外灯') || name.includes('振荡器')) {
    return '5qOA5rWL6K6+'; // 设备类
  } else if (name.includes('系统')) {
    return '5qCH6L6q5Lit'; // 系统类
  } else if (name.includes('阳性品') || name.includes('比色盘')) {
    return '6LSo6YOo5ZCN54mH'; // 质控产品
  }
  return '5YW25LuW'; // 其他
}

function detectCategoryName(productName) {
  const name = productName.toLowerCase();
  if (name.includes('试剂') || name.includes('colilert') || name.includes('colisure')) {
    return '检测试剂';
  } else if (name.includes('定量盘') || name.includes('取样瓶')) {
    return '实验耗材';
  } else if (name.includes('培养箱') || name.includes('封口机') || name.includes('紫外灯') || name.includes('振荡器')) {
    return '检测设备';
  } else if (name.includes('系统')) {
    return '检测系统';
  } else if (name.includes('阳性品') || name.includes('比色盘')) {
    return '质控产品';
  }
  return '其他产品';
}

// 提取特性
function extractFeatures(productData) {
  const features = [];
  
  if (productData.detectionTime) {
    features.push(`检测时间：${productData.detectionTime}`);
  }
  if (productData.manufacturer) {
    features.push(`制造商：${productData.manufacturer}`);
  }
  if (productData.origin) {
    features.push(`产地：${productData.origin}`);
  }
  if (productData.detectionVolume) {
    features.push(`检测体积：${productData.detectionVolume}`);
  }
  if (productData.storageConditions) {
    features.push(`保存条件：${productData.storageConditions}`);
  }
  
  // 如果没有提取到足够的特性，添加默认特性
  if (features.length < 3) {
    features.push('操作简便', '结果准确', '质量可靠');
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
  if (productData.waterType) specs['适用水样'] = productData.waterType;
  if (productData.detectionTarget) specs['检测对象'] = productData.detectionTarget;
  if (productData.detectionContent) specs['检测内容'] = productData.detectionContent;
  if (productData.productCode) specs['货号'] = productData.productCode;
  if (productData.specifications) specs['规格'] = productData.specifications;
  if (productData.storageConditions) specs['保存条件'] = productData.storageConditions;
  if (productData.shelfLife) specs['有效期'] = productData.shelfLife;
  
  return specs;
}

// 生成关键词
function generateKeywords(productName, productData) {
  const baseKeywords = ['微生物检测', '水质分析', 'Assay Bio', '检测技术'];
  const productKeywords = productName.split(/[\s\-®]+/).filter(word => word.length > 1);
  const manufacturerKeywords = productData.manufacturer ? [productData.manufacturer] : [];
  
  return [...baseKeywords, ...productKeywords, ...manufacturerKeywords].slice(0, 8);
}

// 产品名称列表
const PRODUCT_NAMES = [
  '科立得试剂 24小时',
  '科立得试剂 18小时', 
  'Colilert® 250',
  'Colisure®',
  '51孔定量盘®',
  '97孔定量盘®',
  '无菌取样瓶',
  '标准阳性品',
  '程控定量封口机',
  '紫外灯及灯箱',
  '隔水式恒温培养箱',
  'DST技术大肠菌群检测系统',
  '电热恒温培养箱',
  '涡旋振荡器',
  '升级版程控定量封口机'
];

// 生成完整产品数据
function generateCompleteProducts() {
  const products = [];
  
  PRODUCT_NAMES.forEach((productName, index) => {
    const productId = generateProductId(index);
    const productData = detailedProductData[productId] || {};
    
    const product = {
      id: productId,
      slug: generateSlug(productData.name || productName),
      name: productData.name || productName,
      category: {
        id: detectCategory(productName),
        name: detectCategoryName(productName),
        slug: detectCategoryName(productName)
      },
      description: productData.description || `${productData.name || productName} - 专业的微生物检测解决方案`,
      features: extractFeatures(productData),
      specifications: buildSpecifications(productData),
      images: {
        main: `/images/products/${generateSlug(productData.name || productName)}-main.jpg`,
        gallery: [
          `/images/products/${generateSlug(productData.name || productName)}-1.jpg`,
          `/images/products/${generateSlug(productData.name || productName)}-2.jpg`
        ].filter((_, i) => i < 2) // 最多2张gallery图片
      },
      seo: {
        title: productData.name || productName,
        description: `${productData.name || productName} - ${productData.manufacturer || ''} ${productData.origin || ''}制造，专业的微生物检测解决方案`.trim(),
        keywords: generateKeywords(productName, productData)
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    products.push(product);
  });
  
  return products;
}

// 主函数
async function main() {
  console.log('生成完整的产品数据...');
  
  const products = generateCompleteProducts();
  
  // 保存结果
  const outputPath = path.join(__dirname, 'final-products.json');
  await fs.writeFile(outputPath, JSON.stringify(products, null, 2), 'utf8');
  
  console.log(`✅ 生成完成! 共生成 ${products.length} 个产品`);
  console.log(`结果保存到: ${outputPath}`);
  
  // 预览前5个产品
  console.log('\n📋 产品预览:');
  products.slice(0, 5).forEach(product => {
    console.log(`- ${product.name} (${product.category.name})`);
    console.log(`  描述: ${product.description.substring(0, 50)}...`);
    console.log(`  规格: ${Object.keys(product.specifications).length} 项`);
    console.log(`  特性: ${product.features.length} 个`);
    console.log('');
  });
  
  return products;
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateCompleteProducts, detailedProductData };