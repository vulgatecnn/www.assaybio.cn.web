# 爬虫输出目录要求

## 当前问题分析

### 现状问题
1. **文件扁平化存储**：所有文件都放在根目录，没有合理的目录结构
2. **缺少入口页面**：访问 `http://localhost:8080/` 显示文件列表，而不是网站首页
3. **链接修复不完整**：HTML页面内的链接没有正确修复为本地路径
4. **资源文件混乱**：图片、CSS、JS文件与HTML文件混在一起

### 当前文件清单
- **HTML页面**：23个（包括主页、产品详情页、分类页）
- **图片文件**：63张产品图片
- **脚本文件**：4个JS文件（jQuery、common.js等）
- **样式文件**：3个CSS文件（Kd_Common.css等）

## 目标输出目录结构

```
assaybio_final/
├── index.html                          # 网站主入口页面
├── pages/                              # HTML页面目录
│   ├── home/
│   │   └── index.html                  # 首页（info.aspx?id=00070001）
│   ├── about/
│   │   ├── company.html                # 关于我们（info.aspx?id=00010001）
│   │   └── details.html                # 公司详情（Info.aspx?id=00010003）
│   ├── products/                       # 产品页面
│   │   ├── index.html                  # 产品主页（info.aspx?id=00070001）
│   │   └── details/                    # 产品详情页
│   │       ├── dst-system.html         # DST技术大肠菌群检测系统
│   │       ├── colilert-250.html       # Colilert® 250
│   │       ├── sealing-machine.html    # 程控定量封口机
│   │       └── ...                     # 其他产品详情
│   ├── literature/                     # 文献资料
│   │   ├── index.html                  # 文献主页
│   │   └── documents/                  # 具体文献
│   └── market-trends/                  # 市场动向
│       ├── index.html                  # 市场动向主页
│       └── articles/                   # 具体文章
├── assets/                             # 静态资源目录
│   ├── images/                         # 图片资源
│   │   ├── products/                   # 产品图片
│   │   │   ├── dst-system/            # 按产品分类
│   │   │   ├── colilert-250/
│   │   │   └── ...
│   │   ├── market-trends/             # 市场动向图片
│   │   └── common/                     # 通用图片（logo、icons等）
│   ├── css/                           # 样式文件
│   │   ├── Kd_Common.css
│   │   ├── Kd_Default.css
│   │   ├── Kd_Inside.css
│   │   └── custom.css                 # 自定义样式修复
│   └── js/                            # 脚本文件
│       ├── jquery-1.7.2.min.js
│       ├── jquery-1.8.2.min.js
│       ├── jquery.scrbar.js
│       ├── jquery.SuperSlide.2.1.js
│       ├── common.js
│       └── link-fix.js               # 链接修复脚本
├── docs/                             # 文档目录
│   ├── README.md                     # 使用说明
│   ├── site-map.md                   # 网站地图
│   └── crawl-report.json            # 爬取报告
└── backup/                          # 备份目录
    ├── original-files/              # 原始下载文件
    └── logs/                        # 爬取日志
```

## 页面链接映射规则

### 原始URL → 本地路径映射
```
http://www.assaybio.cn/info.aspx?id=00070001     → pages/products/index.html
http://www.assaybio.cn/info.aspx?id=00010001     → pages/about/company.html
http://www.assaybio.cn/info.aspx?id=00020001     → pages/market-trends/index.html
http://www.assaybio.cn/info.aspx?id=00050001     → pages/literature/index.html
http://www.assaybio.cn/display.aspx?id=1998      → pages/products/details/sealing-machine.html
http://www.assaybio.cn/display.aspx?id=1721      → pages/products/details/colilert-250.html
... 依此类推
```

### 产品详情页面命名规则
```
display.aspx?id=1998  → sealing-machine.html      # 程控定量封口机
display.aspx?id=1721  → colilert-250.html         # Colilert® 250  
display.aspx?id=1774  → dst-system.html           # DST技术大肠菌群检测系统
display.aspx?id=1772  → colilert-18h.html         # 科立得试剂 18小时
display.aspx?id=1719  → colilert-24h.html         # 科立得试剂 24小时
display.aspx?id=1722  → colisure.html             # Colisure®
display.aspx?id=1723  → quantray-51.html          # 51孔定量盘®
display.aspx?id=1724  → quantray-97.html          # 97孔定量盘®
display.aspx?id=1725  → sampling-bottle.html      # 无菌取样瓶
display.aspx?id=1726  → standard-control.html     # 标准阳性品
display.aspx?id=1728  → uv-lamp.html              # 紫外灯及灯箱
display.aspx?id=1729  → incubator-water.html      # 隔水式电热培养箱
display.aspx?id=2005  → incubator-electric.html   # 电热恒温培养箱
display.aspx?id=1992  → vortex-mixer.html         # 涡旋振荡器
display.aspx?id=1990  → incubator-separate.html   # 隔水式恒温培养箱
```

## 主入口页面要求

### index.html 结构
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>上海安净生物技术有限公司 - Assay Biotechnology</title>
    <link rel="stylesheet" href="assets/css/Kd_Common.css">
    <link rel="stylesheet" href="assets/css/custom.css">
</head>
<body>
    <div class="main-navigation">
        <h1>上海安净生物技术有限公司</h1>
        <nav>
            <ul>
                <li><a href="pages/home/index.html">首页</a></li>
                <li><a href="pages/about/company.html">关于我们</a></li>
                <li><a href="pages/products/index.html">产品中心</a></li>
                <li><a href="pages/literature/index.html">文献资料</a></li>
                <li><a href="pages/market-trends/index.html">市场动向</a></li>
            </ul>
        </nav>
    </div>
    
    <div class="quick-links">
        <h2>产品快速导航</h2>
        <div class="product-categories">
            <div class="category">
                <h3>总大肠菌群/耐热大肠菌/大肠埃希氏菌</h3>
                <ul>
                    <li><a href="pages/products/details/dst-system.html">DST技术大肠菌群检测系统</a></li>
                    <li><a href="pages/products/details/colilert-24h.html">科立得试剂 24小时</a></li>
                    <li><a href="pages/products/details/colilert-18h.html">科立得试剂 18小时</a></li>
                    <li><a href="pages/products/details/colilert-250.html">Colilert® 250</a></li>
                    <li><a href="pages/products/details/colisure.html">Colisure®</a></li>
                    <!-- 更多产品链接 -->
                </ul>
            </div>
        </div>
    </div>
</body>
</html>
```

## 链接修复要求

### HTML内部链接修复规则
1. **相对路径转换**：所有内部链接转换为相对路径
2. **资源路径统一**：图片、CSS、JS使用统一的assets路径
3. **断链处理**：未下载的页面显示友好提示
4. **锚点保留**：页面内锚点链接保持不变

### CSS路径修复
```css
/* 原始路径 */
background-image: url('20150729094915375.png');

/* 修复后路径 */
background-image: url('../assets/images/products/dst-system/20150729094915375.png');
```

## 爬虫改进目标

### 核心改进点
1. **智能目录分类**：根据页面内容自动分类到合适目录
2. **链接全局修复**：修复所有HTML页面内的链接引用
3. **资源文件整理**：按类型和用途组织资源文件
4. **友好入口页面**：创建用户友好的主导航页面
5. **完整性检查**：确保所有引用的资源都已下载

### 实现优先级
1. **高优先级**：目录结构重组、主入口页面创建
2. **中优先级**：链接修复、资源路径统一
3. **低优先级**：美化样式、添加搜索功能

## 验收标准

### 功能性要求
- [x] 能够在本地完整浏览网站
- [x] 所有内部链接都能正常工作
- [x] 图片、CSS、JS资源正常加载
- [x] 页面布局与原网站基本一致

### 可用性要求
- [x] 有清晰的导航结构
- [x] 支持从任意页面返回主页
- [x] 产品页面之间能够相互跳转
- [x] 断链页面有友好提示

### 完整性要求
- [x] 下载了所有重要页面（产品详情、公司介绍等）
- [x] 下载了所有使用到的图片资源
- [x] 保留了原始的页面样式
- [x] 生成了完整的站点地图

## 下一步执行计划

1. **分析当前文件**：统计现有HTML页面和资源文件
2. **创建目录结构**：按照上述要求重新组织文件
3. **修复页面链接**：更新所有HTML文件中的链接
4. **创建入口页面**：生成用户友好的index.html
5. **测试验证**：确保本地网站完全可用