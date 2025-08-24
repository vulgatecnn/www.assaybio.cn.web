# 上海安净生物技术有限公司官网

## 项目简介

上海安净生物技术有限公司现代化官网重建项目，采用 Vue 3 + TypeScript + Vite 技术栈，打造专业、现代、响应式的企业官网。

## 公司简介

上海安净生物技术有限公司 (Assay Biotechnology) 成立于2009年，专注于水中微生物检测技术及方法的研发、引进和推广，服务300+企事业单位用户，覆盖华东区、华北区、西北区。

## 技术栈

- **前端框架**: Vue 3.4+
- **开发语言**: TypeScript
- **构建工具**: Vite 5.0+
- **状态管理**: Pinia
- **路由管理**: Vue Router 4
- **UI组件**: Headless UI + Heroicons
- **样式框架**: Tailwind CSS
- **国际化**: Vue I18n
- **工具库**: VueUse
- **HTTP客户端**: Axios
- **测试框架**: Vitest + Playwright
- **代码规范**: ESLint + Prettier + Stylelint

## 项目结构

```
├── src/
│   ├── components/     # 通用组件
│   │   ├── common/     # 公共组件
│   │   ├── layout/     # 布局组件
│   │   └── ui/         # UI组件
│   ├── views/          # 页面组件
│   │   ├── home/       # 首页
│   │   ├── about/      # 关于我们
│   │   ├── products/   # 产品服务
│   │   ├── services/   # 技术服务
│   │   └── contact/    # 联系我们
│   ├── api/            # API接口
│   ├── stores/         # 状态管理
│   ├── router/         # 路由配置
│   ├── utils/          # 工具函数
│   ├── types/          # 类型定义
│   ├── assets/         # 静态资源
│   └── locales/        # 国际化文件
├── public/             # 公共资源
├── docs/               # 项目文档
└── tests/              # 测试文件
```

## 开发指南

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 开发调试

```bash
npm run dev
```

### 构建生产

```bash
npm run build
```

### 代码检查

```bash
npm run lint          # ESLint检查
npm run lint:style    # Stylelint检查
npm run format        # Prettier格式化
```

### 测试

```bash
npm run test          # 单元测试
npm run test:ui       # 测试UI界面
npm run test:coverage # 覆盖率测试
npm run e2e           # E2E测试
```

## 功能特性

### 核心功能
- 🏠 **现代化首页** - 企业形象展示与核心业务介绍
- 🏢 **公司介绍** - 企业历程、团队文化、资质荣誉
- 🔬 **产品服务** - 检测设备、技术方法、解决方案
- 📚 **技术支持** - 文档资料、培训服务、在线支持
- 📰 **新闻资讯** - 公司动态、行业资讯、技术文章
- 📞 **联系我们** - 多种联系方式、在线咨询、服务预约

### 技术特性
- ⚡ **高性能** - Vite构建，快速开发与部署
- 📱 **响应式** - 移动优先，完美适配各种设备
- 🎨 **现代设计** - 简洁大气，专业可信的视觉风格
- 🔍 **SEO优化** - 完善的元数据配置与搜索引擎优化
- 🌐 **国际化** - 中英双语支持
- 🔒 **类型安全** - TypeScript确保代码质量
- 🧪 **高质量** - 完善的测试覆盖与代码规范

## 部署说明

### 生产环境部署

1. 构建项目
```bash
npm run build
```

2. 部署到服务器
```bash
# 上传 dist 目录到服务器
# 配置 Nginx 或 Apache
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name www.assaybio.cn;
    
    root /var/www/assaybio/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 开发规范

### 代码风格
- 使用 TypeScript 编写类型安全的代码
- 遵循 Vue 3 Composition API 最佳实践
- 组件命名使用 PascalCase
- 文件命名使用 kebab-case
- 使用 ESLint + Prettier 保持代码一致性

### Git 提交规范
```
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式化
refactor: 重构代码
test: 测试相关
chore: 构建工具等
```

## 许可证

Copyright © 2024 上海安净生物技术有限公司. All rights reserved.