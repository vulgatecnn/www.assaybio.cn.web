/**
 * 网站内容验证器
 * 对比原网站和新网站的信息一致性
 */

import * as fs from 'fs-extra';
import * as path from 'path';

interface ValidationResult {
  section: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  originalValue?: any;
  currentValue?: any;
  recommendations?: string[];
}

interface ValidationReport {
  overall: 'pass' | 'fail';
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  results: ValidationResult[];
  summary: {
    criticalIssues: ValidationResult[];
    warnings: ValidationResult[];
  };
}

class ContentValidator {
  private scrapedDir: string;
  private currentDataPath: string;
  private validationResults: ValidationResult[] = [];

  constructor() {
    this.scrapedDir = path.join(__dirname, '../../data/scraped');
    this.currentDataPath = path.join(__dirname, '../../apps/website/src/data/migrated-data.json');
  }

  async validate(): Promise<ValidationReport> {
    console.log('🔍 开始内容验证检查...');

    // 1. 验证公司基本信息
    await this.validateCompanyInfo();

    // 2. 验证联系方式
    await this.validateContactInfo();

    // 3. 验证产品信息
    await this.validateProducts();

    // 4. 验证新闻内容
    await this.validateNews();

    // 5. 验证技术文献
    await this.validateDocuments();

    // 6. 验证服务信息
    await this.validateServices();

    // 生成报告
    const report = this.generateReport();
    await this.saveReport(report);

    return report;
  }

  private async validateCompanyInfo(): Promise<void> {
    console.log('📋 验证公司基本信息...');

    try {
      // 读取原网站抓取的关于我们页面
      const aboutUsContent = await fs.readFile(
        path.join(this.scrapedDir, 'pages/text/about-us.txt'),
        'utf8'
      );

      // 读取当前网站数据
      const currentData = await fs.readJSON(this.currentDataPath);
      
      // 验证公司名称
      const originalName = this.extractCompanyName(aboutUsContent);
      const currentName = currentData.company.chineseName;
      
      this.addResult({
        section: '公司名称',
        status: originalName === currentName ? 'pass' : 'fail',
        message: `原网站: "${originalName}", 新网站: "${currentName}"`,
        originalValue: originalName,
        currentValue: currentName,
        recommendations: originalName !== currentName ? 
          ['请确认正确的公司名称', '检查营业执照上的准确名称'] : undefined
      });

      // 验证成立时间
      const originalEstablished = this.extractEstablishedYear(aboutUsContent);
      const currentEstablished = currentData.company.established;
      
      this.addResult({
        section: '成立时间',
        status: originalEstablished === currentEstablished ? 'pass' : 'warning',
        message: `原网站: ${originalEstablished}, 新网站: ${currentEstablished}`,
        originalValue: originalEstablished,
        currentValue: currentEstablished,
        recommendations: originalEstablished !== currentEstablished ? 
          ['确认准确的成立年份', '检查公司注册信息'] : undefined
      });

      // 验证公司描述
      const originalDesc = this.extractCompanyDescription(aboutUsContent);
      const currentDesc = currentData.company.description;
      
      const descSimilarity = this.calculateSimilarity(originalDesc, currentDesc);
      
      this.addResult({
        section: '公司描述',
        status: descSimilarity > 0.8 ? 'pass' : descSimilarity > 0.5 ? 'warning' : 'fail',
        message: `相似度: ${(descSimilarity * 100).toFixed(1)}%`,
        originalValue: originalDesc?.substring(0, 100) + '...',
        currentValue: currentDesc?.substring(0, 100) + '...',
        recommendations: descSimilarity < 0.8 ? 
          ['检查公司描述的完整性', '确保关键信息没有遗漏'] : undefined
      });

    } catch (error) {
      this.addResult({
        section: '公司基本信息',
        status: 'fail',
        message: `验证过程出错: ${error}`,
        recommendations: ['检查数据文件是否存在', '确保文件格式正确']
      });
    }
  }

  private async validateContactInfo(): Promise<void> {
    console.log('📞 验证联系方式...');

    try {
      // 读取原网站内容
      const aboutUsContent = await fs.readFile(
        path.join(this.scrapedDir, 'pages/text/about-us.txt'),
        'utf8'
      );

      // 读取当前数据
      const currentData = await fs.readJSON(this.currentDataPath);

      // 验证电话号码
      const originalPhone = this.extractPhone(aboutUsContent);
      const currentPhone = currentData.company.contact.phone;
      
      this.addResult({
        section: '联系电话',
        status: this.comparePhoneNumbers(originalPhone, currentPhone) ? 'pass' : 'warning',
        message: `原网站: ${originalPhone || '未找到'}, 新网站: ${currentPhone}`,
        originalValue: originalPhone,
        currentValue: currentPhone,
        recommendations: !originalPhone || !this.comparePhoneNumbers(originalPhone, currentPhone) ? 
          ['从原网站确认正确的联系电话', '更新联系方式信息'] : undefined
      });

      // 验证邮箱地址
      const originalEmail = this.extractEmail(aboutUsContent);
      const currentEmail = currentData.company.contact.email;
      
      this.addResult({
        section: '邮箱地址',
        status: originalEmail === currentEmail ? 'pass' : 'warning',
        message: `原网站: ${originalEmail || '未找到'}, 新网站: ${currentEmail}`,
        originalValue: originalEmail,
        currentValue: currentEmail,
        recommendations: originalEmail !== currentEmail ? 
          ['确认正确的企业邮箱地址', '检查邮箱是否有效'] : undefined
      });

      // 验证地址信息
      const originalAddress = this.extractAddress(aboutUsContent);
      const currentAddress = currentData.company.contact.address;
      
      this.addResult({
        section: '公司地址',
        status: this.compareAddresses(originalAddress, currentAddress) ? 'pass' : 'warning',
        message: `原网站: ${originalAddress || '未找到'}, 新网站: ${currentAddress}`,
        originalValue: originalAddress,
        currentValue: currentAddress,
        recommendations: !originalAddress || !this.compareAddresses(originalAddress, currentAddress) ? 
          ['确认详细的公司地址', '添加邮编信息'] : undefined
      });

    } catch (error) {
      this.addResult({
        section: '联系方式',
        status: 'fail',
        message: `验证过程出错: ${error}`,
        recommendations: ['检查联系信息数据源', '确保信息格式正确']
      });
    }
  }

  private async validateProducts(): Promise<void> {
    console.log('📦 验证产品信息...');

    try {
      // 读取原网站产品页面
      const productsContent = await fs.readFile(
        path.join(this.scrapedDir, 'pages/text/products.txt'),
        'utf8'
      );

      // 读取当前产品数据
      const currentData = await fs.readJSON(this.currentDataPath);

      // 提取原网站的产品名称
      const originalProducts = this.extractProductNames(productsContent);
      const currentProducts = currentData.products.map((p: any) => p.name);

      // 计算产品覆盖率
      const coverage = this.calculateProductCoverage(originalProducts, currentProducts);
      
      this.addResult({
        section: '产品覆盖率',
        status: coverage > 0.8 ? 'pass' : coverage > 0.5 ? 'warning' : 'fail',
        message: `产品覆盖率: ${(coverage * 100).toFixed(1)}% (${currentProducts.length}/${originalProducts.length})`,
        originalValue: originalProducts,
        currentValue: currentProducts,
        recommendations: coverage < 0.8 ? 
          ['检查是否有产品遗漏', '确认产品分类是否完整', '添加缺失的产品信息'] : undefined
      });

      // 验证重点产品
      const keyProducts = ['DST技术', 'Colilert', 'Filta-Max', 'Quantitray'];
      for (const keyProduct of keyProducts) {
        const originalHas = originalProducts.some(p => p.includes(keyProduct));
        const currentHas = currentProducts.some(p => p.includes(keyProduct));
        
        this.addResult({
          section: `核心产品: ${keyProduct}`,
          status: originalHas === currentHas ? 'pass' : 'fail',
          message: `原网站: ${originalHas ? '存在' : '不存在'}, 新网站: ${currentHas ? '存在' : '不存在'}`,
          recommendations: originalHas && !currentHas ? 
            [`添加${keyProduct}相关产品信息`] : undefined
        });
      }

    } catch (error) {
      this.addResult({
        section: '产品信息',
        status: 'fail',
        message: `验证过程出错: ${error}`,
        recommendations: ['检查产品数据文件', '确保产品信息完整']
      });
    }
  }

  private async validateNews(): Promise<void> {
    console.log('📰 验证新闻内容...');

    try {
      // 读取原网站市场动向页面
      const marketTrendContent = await fs.readFile(
        path.join(this.scrapedDir, 'pages/text/market-trend.txt'),
        'utf8'
      );

      // 读取当前新闻数据
      const currentData = await fs.readJSON(this.currentDataPath);

      // 分析原网站的新闻/动向内容
      const originalNewsTopics = this.extractNewsTopics(marketTrendContent);
      const currentNews = currentData.news || [];

      // 验证新闻数量和内容
      this.addResult({
        section: '新闻内容数量',
        status: currentNews.length >= 3 ? 'pass' : 'warning',
        message: `当前新闻数量: ${currentNews.length}`,
        originalValue: originalNewsTopics.length,
        currentValue: currentNews.length,
        recommendations: currentNews.length < 3 ? 
          ['增加更多新闻内容', '定期更新市场动向信息'] : undefined
      });

      // 验证新闻分类
      const newsCategories = [...new Set(currentNews.map((n: any) => n.category))];
      const expectedCategories = ['市场动向', '技术解读', '公司新闻'];
      
      const categoryMatch = expectedCategories.every(cat => 
        newsCategories.some(existing => existing.includes(cat))
      );

      this.addResult({
        section: '新闻分类',
        status: categoryMatch ? 'pass' : 'warning',
        message: `当前分类: [${newsCategories.join(', ')}]`,
        originalValue: expectedCategories,
        currentValue: newsCategories,
        recommendations: !categoryMatch ? 
          ['完善新闻分类体系', '确保涵盖主要内容类型'] : undefined
      });

    } catch (error) {
      this.addResult({
        section: '新闻内容',
        status: 'fail',
        message: `验证过程出错: ${error}`,
        recommendations: ['检查新闻数据源', '确保内容格式正确']
      });
    }
  }

  private async validateDocuments(): Promise<void> {
    console.log('📄 验证技术文献...');

    try {
      // 读取原网站技术文献页面
      const literatureContent = await fs.readFile(
        path.join(this.scrapedDir, 'pages/text/literature.txt'),
        'utf8'
      );

      // 读取当前文档数据
      const currentData = await fs.readJSON(this.currentDataPath);

      const currentDocuments = currentData.documents || [];
      
      // 验证文档数量
      this.addResult({
        section: '技术文档数量',
        status: currentDocuments.length >= 4 ? 'pass' : 'warning',
        message: `当前文档数量: ${currentDocuments.length}`,
        currentValue: currentDocuments.length,
        recommendations: currentDocuments.length < 4 ? 
          ['增加更多技术文档', '提供产品使用手册', '添加技术规格书'] : undefined
      });

      // 验证文档类型
      const docTypes = [...new Set(currentDocuments.map((d: any) => d.type))];
      const expectedTypes = ['manual', 'specification', 'guide'];
      
      const typesCovered = expectedTypes.filter(type => docTypes.includes(type)).length;
      
      this.addResult({
        section: '文档类型覆盖',
        status: typesCovered >= 2 ? 'pass' : 'warning',
        message: `覆盖类型: ${typesCovered}/${expectedTypes.length}`,
        originalValue: expectedTypes,
        currentValue: docTypes,
        recommendations: typesCovered < 2 ? 
          ['增加操作手册', '提供技术规格书', '添加使用指南'] : undefined
      });

    } catch (error) {
      this.addResult({
        section: '技术文献',
        status: 'fail',
        message: `验证过程出错: ${error}`,
        recommendations: ['检查文献数据源', '确保文档信息完整']
      });
    }
  }

  private async validateServices(): Promise<void> {
    console.log('🛠️ 验证服务信息...');

    try {
      // 读取关于我们页面获取服务信息
      const aboutUsContent = await fs.readFile(
        path.join(this.scrapedDir, 'pages/text/about-us.txt'),
        'utf8'
      );

      // 读取当前数据
      const currentData = await fs.readJSON(this.currentDataPath);

      // 提取原网站提到的服务
      const originalServices = this.extractServices(aboutUsContent);
      const currentServices = currentData.company.services || [];

      // 验证核心服务
      const coreServices = ['技术培训', '设备销售', '技术支持', '质量控制'];
      for (const service of coreServices) {
        const originalHas = originalServices.some(s => s.includes(service));
        const currentHas = currentServices.some((s: string) => s.includes(service));
        
        this.addResult({
          section: `核心服务: ${service}`,
          status: currentHas ? 'pass' : 'warning',
          message: `原网站: ${originalHas ? '提到' : '未提到'}, 新网站: ${currentHas ? '包含' : '未包含'}`,
          recommendations: !currentHas ? 
            [`添加${service}服务信息`] : undefined
        });
      }

      // 验证专业特长
      const specialties = currentData.company.specialties || [];
      
      this.addResult({
        section: '专业特长',
        status: specialties.length >= 5 ? 'pass' : 'warning',
        message: `专业特长数量: ${specialties.length}`,
        currentValue: specialties,
        recommendations: specialties.length < 5 ? 
          ['完善专业领域描述', '突出核心技术优势'] : undefined
      });

    } catch (error) {
      this.addResult({
        section: '服务信息',
        status: 'fail',
        message: `验证过程出错: ${error}`,
        recommendations: ['检查服务数据', '确保信息完整性']
      });
    }
  }

  // 工具方法
  private addResult(result: ValidationResult): void {
    this.validationResults.push(result);
  }

  private extractCompanyName(content: string): string {
    // 从内容中提取公司名称
    const nameMatch = content.match(/上海安净生物技术有限公司|Assay Biotechnology/);
    return nameMatch ? nameMatch[0] : '';
  }

  private extractEstablishedYear(content: string): string {
    // 提取成立时间
    const yearMatch = content.match(/成立于[\s]*(\d{4})/);
    return yearMatch ? yearMatch[1] : '';
  }

  private extractCompanyDescription(content: string): string {
    // 提取公司描述段落
    const lines = content.split('\n').filter(line => line.trim().length > 20);
    const descLine = lines.find(line => line.includes('专业技术服务公司') || line.includes('水中微生物检测'));
    return descLine ? descLine.trim() : '';
  }

  private extractPhone(content: string): string | null {
    const phoneMatch = content.match(/(\+?\d{2,4}[-\s]?\d{3,4}[-\s]?\d{4,8})/);
    return phoneMatch ? phoneMatch[1] : null;
  }

  private extractEmail(content: string): string | null {
    const emailMatch = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return emailMatch ? emailMatch[1] : null;
  }

  private extractAddress(content: string): string | null {
    const addressMatch = content.match(/(上海市[^\\n]{10,50})/);
    return addressMatch ? addressMatch[1] : null;
  }

  private extractProductNames(content: string): string[] {
    const productPatterns = [
      /DST[^\\n]{5,30}/gi,
      /Colilert[^\\n]{5,30}/gi,
      /Filta-Max[^\\n]{5,30}/gi,
      /Quantitray[^\\n]{5,30}/gi,
      /大肠菌[群检测试剂设备]{5,20}/g,
      /菌落[总数检测试剂设备]{5,20}/g
    ];
    
    const products: string[] = [];
    for (const pattern of productPatterns) {
      const matches = content.match(pattern) || [];
      products.push(...matches.map(match => match.trim()));
    }
    
    return [...new Set(products)];
  }

  private extractNewsTopics(content: string): string[] {
    // 从市场动向页面提取新闻主题
    const topics = [];
    const lines = content.split('\n').filter(line => line.trim().length > 10);
    
    // 寻找看起来像标题的行
    for (const line of lines) {
      if (line.length > 15 && line.length < 100 && 
          (line.includes('检测') || line.includes('技术') || line.includes('市场'))) {
        topics.push(line.trim());
      }
    }
    
    return [...new Set(topics)];
  }

  private extractServices(content: string): string[] {
    const serviceKeywords = [
      '技术培训', '设备销售', '技术支持', '质量控制', 
      '检测服务', '咨询服务', '售后服务', '技术开发'
    ];
    
    return serviceKeywords.filter(keyword => content.includes(keyword));
  }

  private calculateSimilarity(str1?: string, str2?: string): number {
    if (!str1 || !str2) return 0;
    
    const words1 = str1.toLowerCase().split(/\\s+/);
    const words2 = str2.toLowerCase().split(/\\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private comparePhoneNumbers(phone1?: string | null, phone2?: string): boolean {
    if (!phone1 || !phone2) return false;
    
    // 移除所有非数字字符进行比较
    const cleaned1 = phone1.replace(/\\D/g, '');
    const cleaned2 = phone2.replace(/\\D/g, '');
    
    return cleaned1.includes(cleaned2) || cleaned2.includes(cleaned1);
  }

  private compareAddresses(addr1?: string | null, addr2?: string): boolean {
    if (!addr1 || !addr2) return false;
    
    // 简单的地址比较，检查是否包含相同的关键词
    const keywords1 = addr1.toLowerCase().split(/[\\s,]+/);
    const keywords2 = addr2.toLowerCase().split(/[\\s,]+/);
    
    const commonKeywords = keywords1.filter(k => keywords2.includes(k));
    return commonKeywords.length >= 2;
  }

  private calculateProductCoverage(original: string[], current: string[]): number {
    if (original.length === 0) return 1;
    
    const matchCount = original.filter(orig => 
      current.some(curr => 
        curr.toLowerCase().includes(orig.toLowerCase()) || 
        orig.toLowerCase().includes(curr.toLowerCase())
      )
    ).length;
    
    return matchCount / original.length;
  }

  private generateReport(): ValidationReport {
    const passedChecks = this.validationResults.filter(r => r.status === 'pass').length;
    const failedChecks = this.validationResults.filter(r => r.status === 'fail').length;
    const warningChecks = this.validationResults.filter(r => r.status === 'warning').length;
    
    const criticalIssues = this.validationResults.filter(r => r.status === 'fail');
    const warnings = this.validationResults.filter(r => r.status === 'warning');
    
    return {
      overall: failedChecks > 0 ? 'fail' : 'pass',
      totalChecks: this.validationResults.length,
      passedChecks,
      failedChecks,
      warningChecks,
      results: this.validationResults,
      summary: {
        criticalIssues,
        warnings
      }
    };
  }

  private async saveReport(report: ValidationReport): Promise<void> {
    const reportPath = path.join(this.scrapedDir, 'validation-report.json');
    await fs.writeJSON(reportPath, report, { spaces: 2 });
    
    // 生成HTML报告
    const htmlReport = this.generateHtmlReport(report);
    await fs.writeFile(
      path.join(this.scrapedDir, 'validation-report.html'),
      htmlReport,
      'utf8'
    );
    
    console.log(`📊 验证报告已保存到: ${reportPath}`);
  }

  private generateHtmlReport(report: ValidationReport): string {
    const statusColor = (status: string) => {
      switch(status) {
        case 'pass': return '#28a745';
        case 'fail': return '#dc3545';
        case 'warning': return '#ffc107';
        default: return '#6c757d';
      }
    };

    const statusIcon = (status: string) => {
      switch(status) {
        case 'pass': return '✅';
        case 'fail': return '❌';
        case 'warning': return '⚠️';
        default: return '❓';
      }
    };

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AssayBio网站内容验证报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .summary-card { background: white; border: 1px solid #dee2e6; border-radius: 6px; padding: 15px; text-align: center; }
        .results { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .result-item { border-bottom: 1px solid #dee2e6; padding: 15px; }
        .result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .status { padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; }
        .recommendations { margin-top: 10px; }
        .recommendations li { margin: 5px 0; }
        .critical { background-color: #f8d7da; border-left: 4px solid #dc3545; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; }
    </style>
</head>
<body>
    <div class="header">
        <h1>AssayBio网站内容验证报告</h1>
        <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        <p>整体状态: <span style="color: ${report.overall === 'pass' ? '#28a745' : '#dc3545'};">
            ${report.overall === 'pass' ? '✅ 通过' : '❌ 需要修复'}
        </span></p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>${report.totalChecks}</h3>
            <p>总检查项</p>
        </div>
        <div class="summary-card">
            <h3 style="color: #28a745;">${report.passedChecks}</h3>
            <p>通过项</p>
        </div>
        <div class="summary-card">
            <h3 style="color: #ffc107;">${report.warningChecks}</h3>
            <p>警告项</p>
        </div>
        <div class="summary-card">
            <h3 style="color: #dc3545;">${report.failedChecks}</h3>
            <p>失败项</p>
        </div>
    </div>

    <div class="results">
        ${report.results.map(result => `
            <div class="result-item ${result.status === 'fail' ? 'critical' : result.status === 'warning' ? 'warning' : ''}">
                <div class="result-header">
                    <h4>${result.section}</h4>
                    <span class="status" style="background-color: ${statusColor(result.status)};">
                        ${statusIcon(result.status)} ${result.status.toUpperCase()}
                    </span>
                </div>
                <p><strong>检查结果:</strong> ${result.message}</p>
                ${result.originalValue ? `<p><strong>原网站值:</strong> ${JSON.stringify(result.originalValue).substring(0, 200)}${JSON.stringify(result.originalValue).length > 200 ? '...' : ''}</p>` : ''}
                ${result.currentValue ? `<p><strong>新网站值:</strong> ${JSON.stringify(result.currentValue).substring(0, 200)}${JSON.stringify(result.currentValue).length > 200 ? '...' : ''}</p>` : ''}
                ${result.recommendations ? `
                    <div class="recommendations">
                        <strong>建议措施:</strong>
                        <ul>
                            ${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>

    ${report.summary.criticalIssues.length > 0 ? `
        <div style="margin-top: 30px; padding: 20px; background: #f8d7da; border-radius: 8px;">
            <h3 style="color: #721c24;">🚨 关键问题 (需要立即修复)</h3>
            <ul>
                ${report.summary.criticalIssues.map(issue => `<li>${issue.section}: ${issue.message}</li>`).join('')}
            </ul>
        </div>
    ` : ''}

    ${report.summary.warnings.length > 0 ? `
        <div style="margin-top: 20px; padding: 20px; background: #fff3cd; border-radius: 8px;">
            <h3 style="color: #856404;">⚠️ 警告项目 (建议优化)</h3>
            <ul>
                ${report.summary.warnings.map(warning => `<li>${warning.section}: ${warning.message}</li>`).join('')}
            </ul>
        </div>
    ` : ''}

    <div style="margin-top: 30px; text-align: center; color: #6c757d;">
        <p>此报告由AssayBio内容验证系统自动生成</p>
    </div>
</body>
</html>`;
  }
}

// 主执行函数
async function main() {
  const validator = new ContentValidator();
  const report = await validator.validate();
  
  console.log('\\n📊 验证报告摘要:');
  console.log(`总检查项: ${report.totalChecks}`);
  console.log(`通过: ${report.passedChecks} | 警告: ${report.warningChecks} | 失败: ${report.failedChecks}`);
  console.log(`整体状态: ${report.overall === 'pass' ? '✅ 通过' : '❌ 需要修复'}`);
  
  if (report.summary.criticalIssues.length > 0) {
    console.log('\\n🚨 关键问题:');
    report.summary.criticalIssues.forEach(issue => {
      console.log(`- ${issue.section}: ${issue.message}`);
    });
  }
  
  if (report.summary.warnings.length > 0) {
    console.log('\\n⚠️ 警告项目:');
    report.summary.warnings.forEach(warning => {
      console.log(`- ${warning.section}: ${warning.message}`);
    });
  }
  
  return report;
}

if (require.main === module) {
  main().catch(console.error);
}

export { ContentValidator };