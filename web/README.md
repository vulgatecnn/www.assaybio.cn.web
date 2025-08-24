# 完整网站内容下载工具

一个强大的Python命令行工具，可以完整下载网站的所有内容，包括HTML页面、图片、CSS、JavaScript、PDF文档等所有资源文件。

## 核心特性

🌐 **完整网站镜像**
- 下载网站的所有HTML页面
- 自动下载所有内部资源（图片、CSS、JS、PDF等）
- 保留外部链接不下载，避免无限扩展

📂 **智能文件组织**
- 自动创建规整的目录结构
- 按文件类型分类存储（html、images、css、js、documents）
- 生成索引页面便于浏览

🔄 **链接自动修复**
- 自动将内部资源链接指向本地文件
- 外部链接保持原样，确保功能完整
- HTML内容自动更新，离线可用

⚡ **高效下载**
- 多线程并发下载提升速度
- 智能去重避免重复下载
- 支持断点续传和错误重试

## 安装依赖

```bash
pip install -r requirements.txt
```

## 使用方法

### 基本用法

```bash
# 下载单个网站页面
python web_crawler.py https://example.com

# 深度下载网站（爬取子页面）
python web_crawler.py https://example.com -d 2

# 指定输出目录
python web_crawler.py https://example.com -o my_website

# 加快下载速度（增加并发线程）
python web_crawler.py https://example.com --max-workers 10
```

### 高级用法

```bash
# 完整参数示例
python web_crawler.py https://example.com \
    --depth 3 \
    --output-dir "downloaded_sites/example" \
    --max-workers 8 \
    --delay 0.5 \
    --format txt \
    --verbose
```

### 实际使用案例

```bash
# 下载个人博客
python web_crawler.py https://myblog.com -d 2 -o my_blog

# 下载企业官网
python web_crawler.py https://company.com -d 3 --max-workers 5

# 下载在线文档站点
python web_crawler.py https://docs.example.com -d 4 -o documentation
```

## 参数说明

| 参数 | 描述 | 默认值 |
|------|------|--------|
| `url` | 要下载的网站URL（必需） | - |
| `-d, --depth` | 爬取深度（子页面层级） | 1 |
| `-o, --output-dir` | 输出目录名称 | downloaded_site |
| `-f, --format` | 报告文件格式（json/csv/txt） | json |
| `--delay` | 请求间隔时间（秒） | 1.0 |
| `--max-workers` | 并发下载线程数 | 5 |
| `--report` | 下载报告文件名前缀 | download_report |
| `-v, --verbose` | 详细输出模式 | False |

## 输出结构

下载完成后，会创建以下目录结构：

```
downloaded_site/
├── index.html              # 索引页面（浏览入口）
├── html/                   # HTML页面文件
│   ├── index.html          # 主页
│   ├── about.html          # 其他页面...
│   └── ...
└── assets/                 # 资源文件
    ├── images/             # 图片文件
    │   ├── logo.png
    │   └── ...
    ├── css/                # CSS样式文件
    │   ├── style.css
    │   └── ...
    ├── js/                 # JavaScript文件
    │   ├── main.js
    │   └── ...
    └── documents/          # 文档文件
        ├── manual.pdf
        └── ...
```

### 报告文件格式

**JSON 格式**
```json
{
  "base_url": "https://example.com",
  "output_directory": "downloaded_site",
  "crawl_time": 12.45,
  "total_pages_visited": 5,
  "total_downloaded_files": 23,
  "total_internal_links": 15,
  "total_external_links": 8,
  "downloaded_files": {"url": "local_path", ...},
  "external_links": ["https://external.com", ...],
  "failed_downloads": []
}
```

**TXT 格式**
人类可读的文本格式，包含完整的下载统计和文件清单。

**CSV 格式**  
表格格式，便于数据分析和处理。

## 使用场景

### 1. 网站备份
```bash
# 完整备份公司官网
python web_crawler.py https://company.com -d 2 -o company_backup

# 备份个人博客
python web_crawler.py https://myblog.com -d 3 -o blog_backup --max-workers 8
```

### 2. 离线浏览
```bash
# 下载在线文档以供离线阅读
python web_crawler.py https://docs.framework.com -d 4 -o offline_docs

# 下载教程网站
python web_crawler.py https://tutorial.com -d 2 -o tutorial_offline
```

### 3. 网站分析
```bash
# 分析网站结构并生成详细报告
python web_crawler.py https://target-site.com -v --format csv --report analysis
```

## 工作原理

### 智能分类下载
1. **内部资源**：同域名下的所有文件自动下载到本地
2. **外部资源**：跨域链接保持原URL，确保功能完整
3. **链接修复**：自动更新HTML中的内部链接指向本地文件

### 并发下载优化
- 使用线程池进行并发下载，提升效率
- 智能限速，避免对服务器造成压力
- 自动重试机制，确保下载成功率

### 文件去重机制
- URL标准化避免重复下载
- 智能文件命名避免冲突
- 增量下载支持（已存在文件跳过）

## 注意事项

⚠️ **重要提醒**
1. **合法使用**：仅用于合法目的，遵守网站使用条款
2. **尊重robots.txt**：遵守网站爬虫协议
3. **合理限速**：避免对目标服务器造成负担
4. **版权意识**：下载的内容仅供个人学习研究

🔧 **使用建议**
- 首次使用建议设置较小的depth值进行测试
- 网络不稳定时可以适当增加delay参数
- 大型网站建议使用较少的max-workers避免被限制
- 定期检查下载失败的文件并手动处理

## 错误处理

工具内置完善的错误处理：
- **网络错误**：自动重试和超时处理
- **文件冲突**：智能重命名避免覆盖
- **编码问题**：自动检测和转换编码
- **链接解析**：容错处理异常URL格式

## 技术架构

- **HTTP客户端**：requests + 会话管理
- **HTML解析**：BeautifulSoup4 + lxml
- **并发处理**：ThreadPoolExecutor
- **文件管理**：pathlib + 自动目录创建
- **日志系统**：Python logging模块

## 许可证

此工具采用MIT许可证，开源免费使用。请在遵守当地法律法规和网站服务条款的前提下使用。