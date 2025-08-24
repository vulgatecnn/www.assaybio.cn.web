// 将新生成的产品数据更新到migrated-data.json中
const fs = require('fs').promises;
const path = require('path');

async function updateMigratedData() {
  try {
    // 读取现有的migrated-data.json
    const migratedDataPath = path.join(__dirname, 'apps', 'website', 'src', 'data', 'migrated-data.json');
    const migratedDataContent = await fs.readFile(migratedDataPath, 'utf8');
    const migratedData = JSON.parse(migratedDataContent);
    
    // 读取新生成的产品数据
    const finalProductsPath = path.join(__dirname, 'final-products.json');
    const finalProductsContent = await fs.readFile(finalProductsPath, 'utf8');
    const finalProducts = JSON.parse(finalProductsContent);
    
    console.log(`📥 读取现有数据: ${migratedData.products.length} 个产品`);
    console.log(`📋 新产品数据: ${finalProducts.length} 个产品`);
    
    // 替换products数组
    migratedData.products = finalProducts;
    
    // 备份原文件
    const backupPath = path.join(__dirname, 'apps', 'website', 'src', 'data', 'migrated-data-backup.json');
    await fs.writeFile(backupPath, migratedDataContent, 'utf8');
    console.log(`💾 已备份原文件到: ${backupPath}`);
    
    // 更新migrated-data.json
    await fs.writeFile(migratedDataPath, JSON.stringify(migratedData, null, 2), 'utf8');
    console.log(`✅ 已更新 migrated-data.json`);
    
    // 显示统计信息
    const categories = {};
    finalProducts.forEach(product => {
      const categoryName = product.category.name;
      categories[categoryName] = (categories[categoryName] || 0) + 1;
    });
    
    console.log('\n📊 产品分类统计:');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} 个产品`);
    });
    
    console.log('\n🎉 数据更新完成!');
    console.log('新的产品数据已成功集成到系统中。');
    
  } catch (error) {
    console.error('❌ 更新失败:', error.message);
    throw error;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  updateMigratedData().catch(console.error);
}

module.exports = { updateMigratedData };