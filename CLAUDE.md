# CLAUDE.md - AssayBio111 网站爬虫项目开发指南

## 项目概述

本项目是AssayBio企业级网站爬虫和内容迁移项目，专注于从legacy网站抓取内容并构建现代化的Vue3网站。

### 项目架构
- **网站应用**: Vue3 + TypeScript + Vite (apps/website)
- **内容抓取工具**: Python + requests + BeautifulSoup (tools/content-scraper)
- **部署**: Docker + Nginx
- **包管理**: pnpm workspace (前端) + pip (Python工具)

## 网页爬虫工具标准

### 🚨 重要：Python爬虫技术栈

**本项目使用Python技术栈进行网页爬虫开发，严禁使用浏览器自动化工具。**

#### 技术选型
1. **Python + requests + BeautifulSoup** 作为主要爬虫技术栈
2. **严禁使用浏览器自动化工具**，包括但不限于：
   - Playwright
   - Selenium WebDriver
   - Puppeteer
   - Chrome DevTools Protocol (CDP)
   - 任何其他浏览器自动化库

3. **推荐的Python爬虫库**：
   - `requests` - HTTP请求
   - `BeautifulSoup` - HTML解析
   - `lxml` - XML/HTML解析器
   - `urllib` - URL处理
   - `json` - JSON数据处理
   - `time` - 请求延时控制
   - `concurrent.futures` - 并发控制

### Python爬虫最佳实践

#### 基础配置
```python
import requests
from bs4 import BeautifulSoup
import time
from urllib.parse import urljoin, urlparse
from concurrent.futures import ThreadPoolExecutor
import json

# 标准请求配置
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive'
}

session = requests.Session()
session.headers.update(headers)
```

#### 网页抓取模式
```python
def scrape_page(url: str) -> dict:
    """基础页面抓取"""
    try:
        response = session.get(url, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 提取数据
        data = {
            'url': url,
            'title': soup.find('title').text if soup.find('title') else '',
            'content': soup.get_text(),
            'links': [urljoin(url, a.get('href')) for a in soup.find_all('a', href=True)]
        }
        
        return data
    except requests.RequestException as e:
        print(f"Error scraping {url}: {e}")
        return None
```

#### 错误处理和重试机制
```python
def scrape_with_retry(url: str, max_retries: int = 3, delay: float = 2.0) -> dict:
    """带重试机制的页面抓取"""
    for attempt in range(max_retries):
        try:
            response = session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            return extract_page_data(soup, url)
            
        except requests.RequestException as e:
            print(f"Attempt {attempt + 1} failed for {url}: {e}")
            if attempt < max_retries - 1:
                time.sleep(delay * (2 ** attempt))  # 指数退避
            else:
                raise e
```

#### 并发控制和性能优化
```python
def scrape_urls_concurrent(urls: list, max_workers: int = 5, delay: float = 1.0):
    """并发抓取多个URL"""
    results = []
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = []
        
        for url in urls:
            future = executor.submit(scrape_with_delay, url, delay)
            futures.append(future)
        
        for future in futures:
            try:
                result = future.result()
                if result:
                    results.append(result)
            except Exception as e:
                print(f"Error in concurrent scraping: {e}")
    
    return results

def scrape_with_delay(url: str, delay: float = 1.0):
    """带延时的抓取"""
    time.sleep(delay)
    return scrape_page(url)
```

### 项目特定要求

#### AssayBio网站抓取规范
1. **严格遵循robots.txt**
2. **请求间隔**: 每个请求间隔至少2秒
3. **并发限制**: 最多同时3个并发请求
4. **超时设置**: HTTP请求超时30秒
5. **用户代理**: 使用标准Chrome用户代理字符串
6. **编码处理**: 正确处理中文编码

#### 数据提取标准
```python
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

@dataclass
class ScrapedData:
    url: str
    title: str
    content: str
    images: List[str]
    links: List[str]
    scraped_at: datetime
    page_type: str
    language: str = 'zh-CN'
```

#### 文件组织结构
```
web/
├── web_crawler_v3.py          # 主爬虫脚本
├── requirements.txt           # Python依赖
├── assaybio_v5/              # 输出目录
├── logs/                     # 爬取日志
└── config/                   # 配置文件
```

## 开发工作流程

### 1. 开发环境设置
```bash
# 前端依赖
pnpm install

# Python爬虫依赖
cd web
pip install -r requirements.txt
```

### 2. 常用开发命令
```bash
# 网站开发
pnpm dev                    # 启动网站开发服务器

# 内容抓取
cd web
python web_crawler_v3.py http://www.assaybio.cn/info.aspx?id=00070001 -d 10

# 构建和部署
pnpm build                  # 构建网站
pnpm deploy                 # Docker部署
```

### 3. 测试和质量控制
```bash
# 运行测试
pnpm test

# 代码检查
pnpm lint

# 类型检查
pnpm typecheck
```

## 代码质量标准

### Python代码要求
- 使用类型注解
- 遵循PEP 8代码规范
- 使用dataclass或pydantic进行数据建模
- 适当的异常处理

### Python爬虫代码规范
1. **始终使用Session管理连接**
2. **实现适当的错误处理和重试机制**
3. **遵循网站的爬虫礼仪**
4. **正确处理编码问题**
5. **避免硬编码延时，使用配置化的延时设置**

### 错误处理策略
```python
try:
    response = session.get(url, timeout=30)
    response.raise_for_status()
except requests.exceptions.Timeout:
    print(f'Request timeout for {url}')
    return None
except requests.exceptions.RequestException as e:
    print(f'Request failed for {url}: {e}')
    return None
```

## 性能和资源管理

### HTTP连接管理
```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

class WebCrawler:
    def __init__(self):
        self.session = requests.Session()
        
        # 配置重试策略
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
    
    def cleanup(self):
        if self.session:
            self.session.close()
```

### 内存优化
- 使用Session复用HTTP连接
- 及时清理大型响应对象
- 避免在循环中创建过多的Session实例
- 使用生成器处理大量数据

## 部署和监控

### Docker配置
项目已配置Docker部署，确保Python爬虫环境正常运行：

```dockerfile
# 确保安装Python依赖
COPY requirements.txt .
RUN pip install -r requirements.txt
```

### 监控指标
- 抓取成功率
- HTTP响应时间
- 错误率和重试次数
- 资源使用情况

## 安全考虑

### 网页抓取安全
1. **遵循目标网站的robots.txt**
2. **实现适当的请求频率限制**
3. **使用合适的User-Agent**
4. **避免暴露敏感信息在日志中**

### 数据安全
- 敏感数据加密存储
- 定期清理临时文件
- 访问日志记录和审计

## 故障排查

### 常见Python爬虫问题
1. **连接超时**: 检查网络连接和超时设置
2. **编码错误**: 正确处理响应编码
3. **反爬机制**: 调整请求频率和User-Agent
4. **内存占用**: 及时清理大型对象和使用生成器

### 调试技巧
```python
import logging

# 启用调试日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# 保存响应内容用于调试
with open('debug_response.html', 'w', encoding='utf-8') as f:
    f.write(response.text)

# 打印请求详情
print(f"Request URL: {response.url}")
print(f"Status Code: {response.status_code}")
print(f"Headers: {response.headers}")
```

---

**重要提醒**: 本项目的所有网页抓取需求必须严格使用Python + requests + BeautifulSoup技术栈实现。严禁使用任何浏览器自动化工具。