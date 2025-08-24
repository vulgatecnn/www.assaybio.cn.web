#!/usr/bin/env python3
"""
Web Crawler Tool v2 - 保持原始路径结构的网站下载工具
功能：下载网站完整内容，保持原始目录结构，便于本地浏览
"""

import argparse
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urlunparse
import json
import os
import time
import sys
from typing import List, Dict, Set, Optional, Tuple
import logging
import mimetypes
from pathlib import Path
import re
from concurrent.futures import ThreadPoolExecutor, as_completed


class WebCrawlerV2:
    def __init__(self, base_url: str, output_dir: str = "downloaded_site", max_depth: int = 1, 
                 delay: float = 1.0, max_workers: int = 5):
        """
        初始化网络爬虫 v2 - 保持原始路径结构
        """
        self.base_url = base_url
        self.base_domain = urlparse(base_url).netloc
        self.base_path = urlparse(base_url).path
        self.max_depth = max_depth
        self.delay = delay
        self.max_workers = max_workers
        
        # 创建输出目录
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # 存储结果
        self.internal_links: Set[str] = set()
        self.external_links: Set[str] = set()
        self.downloaded_files: Dict[str, str] = {}  # URL -> local_path
        self.visited_urls: Set[str] = set()
        self.failed_downloads: Set[str] = set()
        
        # 配置请求头
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        }
        
        # 配置日志
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)

    def is_valid_url(self, url: str) -> bool:
        """检查URL是否有效"""
        try:
            parsed = urlparse(url)
            return bool(parsed.netloc) and bool(parsed.scheme)
        except:
            return False

    def normalize_url(self, url: str) -> str:
        """标准化URL"""
        parsed = urlparse(url)
        # 移除fragment部分
        normalized = urlunparse((parsed.scheme, parsed.netloc, parsed.path, 
                               parsed.params, parsed.query, ''))
        return normalized

    def is_internal_url(self, url: str) -> bool:
        """判断是否为内部链接"""
        try:
            parsed = urlparse(url)
            return parsed.netloc == self.base_domain or parsed.netloc == ''
        except:
            return False

    def create_local_path(self, url: str, content_type: str = None) -> Path:
        """根据原始URL路径创建本地文件路径，保持原始目录结构"""
        parsed = urlparse(url)
        url_path = parsed.path.lstrip('/')
        
        # 如果URL路径为空或以/结尾，使用index.html
        if not url_path or url_path.endswith('/'):
            if url_path.endswith('/'):
                local_path = self.output_dir / url_path / 'index.html'
            else:
                local_path = self.output_dir / 'index.html'
        else:
            # 使用原始路径
            local_path = self.output_dir / url_path
            
            # 如果没有扩展名且是HTML内容，添加.html
            if not local_path.suffix and content_type and 'text/html' in content_type:
                # 对于类似 default.aspx, info.aspx 这样的文件，保持原名
                if not any(ext in url_path.lower() for ext in ['.aspx', '.php', '.jsp', '.htm']):
                    local_path = local_path.with_suffix('.html')
        
        # 确保目录存在
        local_path.parent.mkdir(parents=True, exist_ok=True)
        
        return local_path

    def get_relative_path(self, from_path: str, to_url: str) -> str:
        """计算从一个文件到另一个URL的相对路径"""
        if not self.is_internal_url(to_url):
            return to_url
            
        to_parsed = urlparse(to_url)
        to_path = to_parsed.path.lstrip('/')
        
        # 如果目标URL是根目录或空，指向index.html
        if not to_path or to_path == '/':
            to_path = 'index.html'
        elif to_path.endswith('/'):
            to_path = to_path + 'index.html'
            
        from_dir = os.path.dirname(from_path)
        if from_dir:
            relative = os.path.relpath(to_path, from_dir)
        else:
            relative = to_path
            
        # 将Windows路径分隔符转换为URL格式
        relative = relative.replace('\\', '/')
        return relative

    def download_file(self, url: str, force_download: bool = False) -> Optional[str]:
        """下载文件到本地，保持原始路径结构"""
        if url in self.downloaded_files and not force_download:
            return self.downloaded_files[url]
        
        if url in self.failed_downloads:
            return None
            
        try:
            self.logger.info(f"正在下载: {url}")
            response = requests.get(url, headers=self.headers, timeout=30, stream=True)
            response.raise_for_status()
            
            # 获取内容类型
            content_type = response.headers.get('content-type', '')
            
            # 创建本地路径
            local_path = self.create_local_path(url, content_type)
            
            # 下载文件
            with open(local_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            # 记录下载的文件
            relative_path = os.path.relpath(local_path, self.output_dir)
            self.downloaded_files[url] = relative_path.replace('\\', '/')
            
            self.logger.info(f"下载完成: {url} -> {relative_path}")
            return self.downloaded_files[url]
            
        except requests.exceptions.RequestException as e:
            self.logger.error(f"下载失败 {url}: {e}")
            self.failed_downloads.add(url)
            return None
        except Exception as e:
            self.logger.error(f"保存文件失败 {url}: {e}")
            self.failed_downloads.add(url)
            return None

    def get_page_content(self, url: str) -> Optional[BeautifulSoup]:
        """获取页面内容"""
        try:
            self.logger.info(f"正在获取页面: {url}")
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            # 检查内容类型
            content_type = response.headers.get('content-type', '').lower()
            
            # 如果是HTML页面，解析并返回BeautifulSoup对象
            if 'text/html' in content_type:
                soup = BeautifulSoup(response.content, 'html.parser')
                return soup
            else:
                # 如果不是HTML，直接下载文件
                if self.is_internal_url(url):
                    self.download_file(url)
                return None
                
        except requests.exceptions.RequestException as e:
            self.logger.error(f"获取页面失败 {url}: {e}")
            return None
        except Exception as e:
            self.logger.error(f"解析页面失败 {url}: {e}")
            return None

    def extract_all_resources(self, soup: BeautifulSoup, base_url: str) -> Dict[str, List[str]]:
        """提取页面中的所有资源链接"""
        resources = {
            'links': [],
            'images': [],
            'css': [],
            'js': [],
            'other': []
        }
        
        # 提取<a>标签链接
        for link in soup.find_all('a', href=True):
            href = link['href'].strip()
            if not href or href.startswith('#') or href.startswith('mailto:') or href.startswith('tel:'):
                continue
                
            absolute_url = urljoin(base_url, href)
            absolute_url = self.normalize_url(absolute_url)
            
            if self.is_valid_url(absolute_url):
                resources['links'].append(absolute_url)
        
        # 提取图片资源
        for img in soup.find_all('img'):
            for attr in ['src', 'data-src', 'data-original']:
                if img.get(attr):
                    src = img[attr].strip()
                    if src:
                        absolute_url = urljoin(base_url, src)
                        absolute_url = self.normalize_url(absolute_url)
                        if self.is_valid_url(absolute_url):
                            resources['images'].append(absolute_url)
                        break
        
        # 提取CSS文件
        for link in soup.find_all('link', rel='stylesheet'):
            if link.get('href'):
                href = link['href'].strip()
                absolute_url = urljoin(base_url, href)
                absolute_url = self.normalize_url(absolute_url)
                if self.is_valid_url(absolute_url):
                    resources['css'].append(absolute_url)
        
        # 提取JavaScript文件
        for script in soup.find_all('script', src=True):
            src = script['src'].strip()
            absolute_url = urljoin(base_url, src)
            absolute_url = self.normalize_url(absolute_url)
            if self.is_valid_url(absolute_url):
                resources['js'].append(absolute_url)
        
        # 提取CSS中的背景图片
        for element in soup.find_all(style=True):
            style = element['style']
            if 'url(' in style:
                matches = re.findall(r'url\\(["\']?(.*?)["\']?\\)', style)
                for match in matches:
                    absolute_url = urljoin(base_url, match.strip())
                    absolute_url = self.normalize_url(absolute_url)
                    if self.is_valid_url(absolute_url):
                        resources['images'].append(absolute_url)
        
        # 去重
        for key in resources:
            resources[key] = list(set(resources[key]))
            
        return resources

    def update_html_content(self, soup: BeautifulSoup, base_url: str, current_file_path: str) -> str:
        """更新HTML内容，将内部资源链接转换为相对路径"""
        
        # 更新图片链接
        for img in soup.find_all('img'):
            for attr in ['src', 'data-src', 'data-original']:
                if img.get(attr):
                    original_url = urljoin(base_url, img[attr])
                    if self.is_internal_url(original_url):
                        relative_path = self.get_relative_path(current_file_path, original_url)
                        img[attr] = relative_path
                    break
        
        # 更新CSS链接
        for link in soup.find_all('link', rel='stylesheet'):
            if link.get('href'):
                original_url = urljoin(base_url, link['href'])
                if self.is_internal_url(original_url):
                    relative_path = self.get_relative_path(current_file_path, original_url)
                    link['href'] = relative_path
        
        # 更新JavaScript链接
        for script in soup.find_all('script', src=True):
            original_url = urljoin(base_url, script['src'])
            if self.is_internal_url(original_url):
                relative_path = self.get_relative_path(current_file_path, original_url)
                script['src'] = relative_path
        
        # 更新<a>标签链接
        for link in soup.find_all('a', href=True):
            original_url = urljoin(base_url, link['href'])
            if self.is_internal_url(original_url):
                relative_path = self.get_relative_path(current_file_path, original_url)
                link['href'] = relative_path
        
        return str(soup)

    def crawl_page(self, url: str, depth: int = 0) -> None:
        """爬取单个页面"""
        if depth > self.max_depth or url in self.visited_urls:
            return
            
        self.visited_urls.add(url)
        
        # 获取页面内容
        soup = self.get_page_content(url)
        if not soup:
            return
            
        # 提取所有资源
        resources = self.extract_all_resources(soup, url)
        
        # 分类处理资源
        all_urls_to_download = []
        
        # 处理链接
        for link in resources['links']:
            if self.is_internal_url(link):
                self.internal_links.add(link)
            else:
                self.external_links.add(link)
        
        # 收集所有需要下载的内部资源
        for resource_type in ['images', 'css', 'js']:
            for resource_url in resources[resource_type]:
                if self.is_internal_url(resource_url):
                    all_urls_to_download.append(resource_url)
                else:
                    self.external_links.add(resource_url)
        
        # 并发下载所有资源
        if all_urls_to_download:
            self.logger.info(f"开始下载 {len(all_urls_to_download)} 个资源文件")
            self.download_resources_parallel(all_urls_to_download)
        
        # 创建HTML文件的本地路径
        html_local_path = self.create_local_path(url, 'text/html')
        current_file_path = os.path.relpath(html_local_path, self.output_dir).replace('\\', '/')
        
        # 更新HTML内容并保存
        updated_html = self.update_html_content(soup, url, current_file_path)
        
        try:
            with open(html_local_path, 'w', encoding='utf-8') as f:
                f.write(updated_html)
            
            self.downloaded_files[url] = current_file_path
            self.logger.info(f"HTML页面保存: {url} -> {current_file_path}")
            
        except Exception as e:
            self.logger.error(f"保存HTML页面失败 {url}: {e}")
        
        self.logger.info(f"页面 {url} - 发现 {len(resources['links'])} 个链接, "
                        f"{len(all_urls_to_download)} 个内部资源")
        
        # 如果需要深度爬取，继续爬取同域名下的HTML页面
        if depth < self.max_depth:
            internal_html_links = [link for link in resources['links'] 
                                 if self.is_internal_url(link)
                                 and link not in self.visited_urls]
            
            for link in internal_html_links[:10]:  # 限制每页最多爬取10个子页面
                time.sleep(self.delay)
                self.crawl_page(link, depth + 1)
    
    def download_resources_parallel(self, urls: List[str]) -> None:
        """并发下载资源"""
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_url = {executor.submit(self.download_file, url): url for url in urls}
            
            for future in as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    result = future.result()
                    if result:
                        self.logger.debug(f"资源下载完成: {url}")
                except Exception as e:
                    self.logger.error(f"并发下载失败 {url}: {e}")

    def crawl(self) -> Dict:
        """开始爬取"""
        self.logger.info(f"开始下载网站: {self.base_url}")
        self.logger.info(f"最大深度: {self.max_depth}, 延时: {self.delay}秒")
        self.logger.info(f"输出目录: {self.output_dir}")
        
        start_time = time.time()
        
        try:
            self.crawl_page(self.base_url)
        except KeyboardInterrupt:
            self.logger.info("用户中断下载...")
        
        end_time = time.time()
        
        result = {
            'base_url': self.base_url,
            'output_directory': str(self.output_dir),
            'crawl_time': end_time - start_time,
            'total_pages_visited': len(self.visited_urls),
            'total_internal_links': len(self.internal_links),
            'total_external_links': len(self.external_links),
            'total_downloaded_files': len(self.downloaded_files),
            'total_failed_downloads': len(self.failed_downloads),
            'internal_links': sorted(list(self.internal_links)),
            'external_links': sorted(list(self.external_links)),
            'downloaded_files': dict(self.downloaded_files),
            'failed_downloads': sorted(list(self.failed_downloads)),
            'visited_pages': sorted(list(self.visited_urls))
        }
        
        self.logger.info(f"下载完成! 用时: {result['crawl_time']:.2f}秒")
        self.logger.info(f"访问页面: {result['total_pages_visited']} 个")
        self.logger.info(f"内部链接: {result['total_internal_links']} 个")
        self.logger.info(f"外部链接: {result['total_external_links']} 个")
        self.logger.info(f"下载文件: {result['total_downloaded_files']} 个")
        self.logger.info(f"下载失败: {result['total_failed_downloads']} 个")
        
        # 创建索引页面
        self.create_index_page(result)
        
        return result
    
    def create_index_page(self, result: Dict) -> None:
        """创建索引页面"""
        try:
            index_html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>网站下载完成 - {self.base_domain}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }}
        h1, h2 {{ color: #333; }}
        .stats {{ background: #f4f4f4; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        .file-list {{ max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; }}
        .external-link {{ color: #e74c3c; }}
        .internal-link {{ color: #27ae60; }}
        .main-link {{ font-size: 18px; font-weight: bold; color: #2980b9; }}
    </style>
</head>
<body>
    <h1>网站下载完成</h1>
    <div class="stats">
        <h2>下载统计</h2>
        <p><strong>原始网站:</strong> <a href="{result['base_url']}" target="_blank">{result['base_url']}</a></p>
        <p><strong>下载时间:</strong> {result['crawl_time']:.2f} 秒</p>
        <p><strong>访问页面:</strong> {result['total_pages_visited']} 个</p>
        <p><strong>下载文件:</strong> {result['total_downloaded_files']} 个</p>
        <p><strong>内部链接:</strong> {result['total_internal_links']} 个</p>
        <p><strong>外部链接:</strong> {result['total_external_links']} 个</p>
        <p><strong>下载失败:</strong> {result['total_failed_downloads']} 个</p>
    </div>

    <h2>主页面</h2>
    <p><a href="index.html" class="main-link">点击这里访问下载的网站主页</a></p>

    <h2>已下载的页面</h2>
    <div class="file-list">
        <ul>
"""
            
            # 添加HTML页面链接
            html_files = [(url, path) for url, path in result['downloaded_files'].items() 
                         if path.endswith('.html') or '.aspx' in path]
            
            for original_url, local_path in sorted(html_files):
                index_html += f'<li><a href="{local_path}" class="internal-link">{original_url}</a></li>\\n'
            
            index_html += f"""
        </ul>
    </div>

    <h2>外部链接 (未下载)</h2>
    <div class="file-list">
        <ul>
"""
            
            for external_link in sorted(result['external_links'])[:20]:  # 最多显示20个外部链接
                index_html += f'<li><a href="{external_link}" target="_blank" class="external-link">{external_link}</a></li>\\n'
            
            index_html += """
        </ul>
    </div>

    <h2>使用说明</h2>
    <p>网站已按原始目录结构保存，可以直接用浏览器打开主页面浏览。</p>
    <p>所有内部链接和资源文件已转换为相对路径，确保本地正常访问。</p>
</body>
</html>
"""
            
            index_path = self.output_dir / 'site_index.html'
            with open(index_path, 'w', encoding='utf-8') as f:
                f.write(index_html)
                
            self.logger.info(f"索引页面已创建: {index_path}")
            
        except Exception as e:
            self.logger.error(f"创建索引页面失败: {e}")


def main():
    parser = argparse.ArgumentParser(description='Web Crawler v2 - 保持原始路径结构的网站下载工具')
    parser.add_argument('url', help='要下载的网站URL')
    parser.add_argument('-d', '--depth', type=int, default=1, help='爬取深度 (默认: 1)')
    parser.add_argument('-o', '--output-dir', default='downloaded_site_v2', help='输出目录 (默认: downloaded_site_v2)')
    parser.add_argument('--delay', type=float, default=1.0, help='请求间隔时间(秒) (默认: 1.0)')
    parser.add_argument('--max-workers', type=int, default=5, help='并发下载线程数 (默认: 5)')
    parser.add_argument('-v', '--verbose', action='store_true', help='详细输出')
    
    args = parser.parse_args()
    
    # 设置日志级别
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # 验证URL格式
    if not args.url.startswith(('http://', 'https://')):
        args.url = 'http://' + args.url
    
    try:
        # 创建爬虫实例
        crawler = WebCrawlerV2(
            base_url=args.url, 
            output_dir=args.output_dir,
            max_depth=args.depth, 
            delay=args.delay,
            max_workers=args.max_workers
        )
        
        print(f"开始下载网站: {args.url}")
        print(f"输出目录: {args.output_dir}")
        print(f"保持原始路径结构，便于本地浏览")
        print("-" * 50)
        
        # 开始下载
        result = crawler.crawl()
        
        # 保存详细报告
        report_file = "download_report_v2.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        # 打印概要信息
        print("\\n" + "="*60)
        print("下载完成!")
        print("="*60)
        print(f"原始网站: {result['base_url']}")
        print(f"输出目录: {result['output_directory']}")
        print(f"下载耗时: {result['crawl_time']:.2f}秒")
        print(f"访问页面: {result['total_pages_visited']} 个")
        print(f"下载文件: {result['total_downloaded_files']} 个")
        
        main_index = os.path.join(args.output_dir, 'index.html')
        if os.path.exists(main_index):
            print(f"\\n🌐 打开主页面: {main_index}")
        print(f"📋 查看下载索引: {os.path.join(args.output_dir, 'site_index.html')}")
        
    except KeyboardInterrupt:
        print("\\n用户中断下载")
        sys.exit(1)
    except Exception as e:
        print(f"程序执行错误: {e}")
        logging.exception("详细错误信息:")
        sys.exit(1)


if __name__ == '__main__':
    main()