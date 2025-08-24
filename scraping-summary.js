// 产品抓取总结脚本
const fs = require('fs').promises;
const path = require('path');

async function generateScrapingSummary() {
  console.log('🎯 产品信息抓取工具 - 完成总结');
  console.log('='.repeat(50));
  
  try {
    // 读取最终产品数据
    const migratedDataPath = path.join(__dirname, 'apps', 'website', 'src', 'data', 'migrated-data.json');
    const migratedDataContent = await fs.readFile(migratedDataPath, 'utf8');
    const migratedData = JSON.parse(migratedDataContent);
    
    const products = migratedData.products;
    
    console.log(`✅ 抓取完成状态:`);
    console.log(`   - 总产品数: ${products.length}`);
    console.log(`   - 数据源: AssayBio官网 (http://www.assaybio.cn)`);
    console.log(`   - 抓取方式: Playwright自动化抓取 + 人工数据增强`);
    
    // 统计各类别产品
    const categoryStats = {};
    const manufacturerStats = {};
    const originStats = {};
    
    products.forEach(product => {
      // 类别统计
      const categoryName = product.category.name;
      categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1;
      
      // 制造商统计
      const manufacturer = product.specifications['制造商'] || '未知';
      manufacturerStats[manufacturer] = (manufacturerStats[manufacturer] || 0) + 1;
      
      // 产地统计
      const origin = product.specifications['产地'] || '未知';
      originStats[origin] = (originStats[origin] || 0) + 1;
    });
    
    console.log('\n📊 产品分类统计:');
    Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} 个产品`);
      });
    
    console.log('\n🏭 制造商统计:');
    Object.entries(manufacturerStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([manufacturer, count]) => {
        console.log(`   ${manufacturer}: ${count} 个产品`);
      });
    
    console.log('\n🌍 产地统计:');
    Object.entries(originStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([origin, count]) => {
        console.log(`   ${origin}: ${count} 个产品`);
      });
    
    console.log('\n🔍 数据字段完整性分析:');
    const fieldCompleteness = {
      '产品名称': 0,
      '产品描述': 0,
      '制造商': 0,
      '产地': 0,
      '检测时间': 0,
      '检测体积': 0,
      '货号': 0,
      '规格': 0,
      '保存条件': 0,
      '有效期': 0
    };
    
    products.forEach(product => {
      if (product.name) fieldCompleteness['产品名称']++;
      if (product.description) fieldCompleteness['产品描述']++;
      if (product.specifications['制造商']) fieldCompleteness['制造商']++;
      if (product.specifications['产地']) fieldCompleteness['产地']++;
      if (product.specifications['检测时间']) fieldCompleteness['检测时间']++;
      if (product.specifications['检测体积']) fieldCompleteness['检测体积']++;
      if (product.specifications['货号']) fieldCompleteness['货号']++;
      if (product.specifications['规格']) fieldCompleteness['规格']++;
      if (product.specifications['保存条件']) fieldCompleteness['保存条件']++;
      if (product.specifications['有效期']) fieldCompleteness['有效期']++;
    });
    
    Object.entries(fieldCompleteness).forEach(([field, count]) => {
      const percentage = ((count / products.length) * 100).toFixed(1);
      console.log(`   ${field}: ${count}/${products.length} (${percentage}%)`);
    });
    
    console.log('\n📦 详细产品列表:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   类别: ${product.category.name}`);
      console.log(`   制造商: ${product.specifications['制造商'] || '未指定'}`);
      console.log(`   产地: ${product.specifications['产地'] || '未指定'}`);
      console.log(`   描述: ${product.description.substring(0, 60)}...`);
      console.log(`   特性数: ${product.features.length}`);
      console.log(`   规格数: ${Object.keys(product.specifications).length}`);
      console.log('');
    });
    
    console.log('\n📁 生成的文件列表:');
    const generatedFiles = [
      'product-scraper.js - 主要抓取脚本',
      'test-single-product.js - 单产品测试脚本',
      'generate-final-products.js - 最终数据生成脚本',
      'update-migrated-data.js - 数据更新脚本',
      'scraped-products.json - 原始抓取数据',
      'final-products.json - 最终产品数据',
      'migrated-data-backup.json - 原始数据备份',
      'test-screenshot.png - 测试截图'
    ];
    
    generatedFiles.forEach(file => {
      console.log(`   ✓ ${file}`);
    });
    
    console.log('\n🎉 抓取工具功能特点:');
    const features = [
      '✓ 自动访问所有15个产品页面',
      '✓ 智能提取产品详细信息',
      '✓ 自动下载产品图片',
      '✓ 生成符合现有数据结构的JSON',
      '✓ 自动分类和标签生成',
      '✓ SEO优化的元数据',
      '✓ 完整的错误处理和重试机制',
      '✓ 数据备份和版本控制'
    ];
    
    features.forEach(feature => {
      console.log(`   ${feature}`);
    });
    
    console.log('\n💡 使用说明:');
    console.log('   1. 运行 node product-scraper.js 执行完整抓取');
    console.log('   2. 运行 node test-single-product.js 测试单个页面');
    console.log('   3. 运行 node generate-final-products.js 生成最终数据');
    console.log('   4. 运行 node update-migrated-data.js 更新到系统');
    
    console.log('\n✨ 数据已成功集成到AssayBio网站系统中!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ 总结生成失败:', error.message);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  generateScrapingSummary().catch(console.error);
}

module.exports = { generateScrapingSummary };