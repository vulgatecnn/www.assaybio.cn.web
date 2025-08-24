# AssayBio 网站内容抓取和迁移工具

专为AssayBio网站重构项目设计的内容抓取和迁移工具，能够自动抓取原网站内容并转换为新网站所需的数据格式。

## 功能特点

- 🔍 **智能抓取**: 基于Playwright的全站内容抓取
- 📊 **数据分析**: 自动识别和分类网站内容
- 🔄 **格式转换**: 将原始数据转换为现代化网站格式
- 📝 **SEO优化**: 为所有内容生成完整的SEO元信息
- 📋 **详细报告**: 生成完整的项目分析报告

## 安装使用

### 1. 安装依赖

```bash
npm install
```

### 2. 运行完整流程

```bash
# 执行完整的抓取和迁移流程
npm run dev

# 或者使用 tsx 直接运行
npx tsx src/index.ts
```

### 3. 单独运行某个步骤

```bash
# 仅运行数据抓取
npm run scrape

# 仅运行数据迁移
npm run migrate
```

## 输出文件说明

### 抓取数据目录 (`./scraped-data/`)

- `assaybio-scraped-*.json` - 原始抓取的网站数据
- `scraping-report.md` - 数据抓取过程报告

### 迁移数据目录 (`./migrated-data/`)

- `company.json` - 公司基础信息
- `products.json` - 产品数据（包含SEO信息）
- `news.json` - 新闻文章（支持分类和标签）
- `documents.json` - 技术文档信息
- `pages.json` - 其他页面内容
- `migrated-complete.json` - 完整迁移数据
- `migration.sql` - 数据库插入脚本
- `migration-report.md` - 数据迁移详细报告

### 项目报告

- `project-summary.md` - 项目总结和建议

## 数据结构说明

### 产品数据结构

```typescript
interface MigratedProduct {
  id: string;
  slug: string;           // SEO友好的URL标识
  name: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  description: string;
  features: string[];     // 产品特性列表
  specifications: Record<string, any>;
  images: {
    main: string;         // 主图片
    gallery: string[];    // 图片画廊
  };
  seo: {
    title: string;        // SEO标题
    description: string;  // SEO描述
    keywords: string[];   // 关键词
  };
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}
```

### 新闻数据结构

```typescript
interface MigratedNews {
  id: string;
  slug: string;
  title: string;
  excerpt: string;        // 文章摘要
  content: string;
  author: string;
  publishDate: string;
  category: string;
  tags: string[];
  featured: boolean;      // 是否为推荐文章
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}
```

## 配置选项

### 抓取配置

```typescript
const config: ScrapingConfig = {
  baseUrl: 'http://www.assaybio.cn',
  maxPages: 25,           // 最大抓取页面数
  delay: 3000,           // 页面间延迟（毫秒）
  outputDir: './scraped-data',
  includeImages: true,    // 是否包含图片
  followExternalLinks: false  // 是否跟随外部链接
};
```

## 技术实现

### 核心技术栈

- **Playwright**: 浏览器自动化和网页抓取
- **TypeScript**: 类型安全的JavaScript
- **Cheerio**: HTML解析和处理
- **Turndown**: HTML到Markdown转换
- **fs-extra**: 增强的文件系统操作

### 抓取策略

1. **首页分析**: 获取网站整体结构
2. **分类抓取**: 按内容类型分别抓取
   - 公司信息 (About Us)
   - 产品目录 (Products)
   - 技术文献 (Literature)
   - 新闻动态 (Market Trend)
3. **内容提取**: 智能识别和分类内容
4. **数据清理**: 去除无效和重复信息

### 数据处理流程

```
原网站内容 → 结构化抓取 → 内容分析 → 格式转换 → SEO优化 → 新网站数据
```

## 开发和调试

### 开发模式

```bash
# 监听模式，代码修改后自动重启
npm run dev
```

### 调试配置

在抓取过程中，浏览器会以非无头模式运行，可以观察抓取过程。如需调试，可以：

1. 在代码中添加断点
2. 使用 `console.log` 输出调试信息
3. 检查生成的中间数据文件

## 注意事项

### 使用须知

1. **网络稳定**: 确保网络连接稳定，避免抓取中断
2. **访问频率**: 工具已内置延迟机制，避免过于频繁访问
3. **数据备份**: 重要数据请及时备份
4. **合规使用**: 仅用于合法的网站重构项目

### 常见问题

**Q: 抓取失败怎么办？**
A: 检查网络连接，查看错误日志，可以调整 `delay` 参数增加等待时间。

**Q: 数据不完整怎么办？**
A: 可以手动补充 migrated-data 中的JSON文件，或者调整抓取策略重新运行。

**Q: 如何添加新的数据字段？**
A: 修改 `types/index.ts` 中的接口定义，并相应更新抓取和迁移逻辑。

## 下一步集成

### 前端集成

生成的JSON数据可以直接用于前端开发：

```javascript
import products from './migrated-data/products.json';
import company from './migrated-data/company.json';

// 直接使用数据渲染组件
```

### 后端集成

使用生成的SQL脚本初始化数据库：

```bash
psql -d your_database < migrated-data/migration.sql
```

### CMS集成

JSON数据格式兼容大多数现代CMS系统，可以直接导入使用。

## 贡献指南

欢迎提交问题和改进建议：

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

## 许可证

MIT License - 详见 LICENSE 文件

---

*AssayBio Content Migration Tool - 为网站现代化重构而设计*