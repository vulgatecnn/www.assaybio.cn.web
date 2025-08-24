#!/usr/bin/env python3
"""
Web Crawler Tool - 完整网站内容下载工具
功能：下载网站完整内容，包括HTML、图片、文档等所有文件
内部链接下载到本地，外部链接保持原样
"""

import argparse
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urlunparse, quote
import json
import csv
import os
import time
import sys
from typing import List, Dict, Set, Optional, Tuple
import logging
import hashlib
import mimetypes
from pathlib import Path
import shutil
import re
from concurrent.futures import ThreadPoolExecutor, as_completed


class WebCrawler:
    def __init__(self, base_url: str, output_dir: str = "downloaded_site", max_depth: int = 1, 
                 delay: float = 1.0, max_workers: int = 5):
        """
        初始化网络爬虫
        
        Args:
            base_url: 基础URL
            output_dir: 输出目录
            max_depth: 最大爬取深度
            delay: 请求间隔时间（秒）
            max_workers: 并发下载线程数
        """
        self.base_url = base_url
        self.base_domain = urlparse(base_url).netloc
        self.max_depth = max_depth
        self.delay = delay
        self.max_workers = max_workers
        
        # 创建输出目录
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # 创建子目录
        self.html_dir = self.output_dir / "html"
        self.assets_dir = self.output_dir / "assets"
        self.images_dir = self.assets_dir / "images"
        self.documents_dir = self.assets_dir / "documents"
        self.css_dir = self.assets_dir / "css"
        self.js_dir = self.assets_dir / "js"
        
        for dir_path in [self.html_dir, self.assets_dir, self.images_dir, 
                        self.documents_dir, self.css_dir, self.js_dir]:
            dir_path.mkdir(exist_ok=True)
        
        # 存储结果
        self.internal_links: Set[str] = set()
        self.external_links: Set[str] = set()
        self.downloaded_files: Dict[str, str] = {}  # URL -> local_path
        self.visited_urls: Set[str] = set()
        self.failed_downloads: Set[str] = set()
        
        # 文件类型映射
        self.file_extensions = {
            'images': {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico'},
            'documents': {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf'},
            'css': {'.css'},
            'js': {'.js'},
            'html': {'.html', '.htm', '.php', '.asp', '.jsp'}
        }
        
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

    def get_file_extension(self, url: str) -> str:
        """获取文件扩展名"""
        parsed = urlparse(url)
        path = parsed.path.lower()
        if '.' in path:
            return Path(path).suffix
        return ''

    def get_file_type(self, url: str) -> str:
        """根据URL确定文件类型"""
        ext = self.get_file_extension(url)
        
        for file_type, extensions in self.file_extensions.items():
            if ext in extensions:
                return file_type
        
        # 默认返回html类型
        return 'html'

    def generate_local_filename(self, url: str, content_type: str = None) -> Tuple[str, Path]:
        """生成本地文件名和完整路径"""
        parsed = urlparse(url)
        path = parsed.path
        
        # 如果路径为空或以/结尾，使用index.html
        if not path or path.endswith('/'):
            filename = 'index.html'
            file_type = 'html'
        else:
            # 提取文件名
            filename = Path(path).name
            if not filename:
                filename = 'index.html'
            file_type = self.get_file_type(url)
        
        # 如果没有扩展名，根据content-type添加
        if '.' not in filename and content_type:
            if 'text/html' in content_type:
                filename += '.html'
                file_type = 'html'
            elif 'text/css' in content_type:
                filename += '.css'
                file_type = 'css'
            elif 'application/javascript' in content_type:
                filename += '.js'
                file_type = 'js'
            elif content_type.startswith('image/'):
                ext = mimetypes.guess_extension(content_type)
                if ext:
                    filename += ext
                    file_type = 'images'
        
        # 处理特殊字符
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        
        # 选择目标目录
        if file_type == 'html':
            target_dir = self.html_dir
        elif file_type == 'images':
            target_dir = self.images_dir
        elif file_type == 'documents':
            target_dir = self.documents_dir
        elif file_type == 'css':
            target_dir = self.css_dir
        elif file_type == 'js':
            target_dir = self.js_dir
        else:
            target_dir = self.assets_dir
        
        # 生成唯一文件名
        counter = 1
        original_filename = filename
        while (target_dir / filename).exists():
            name, ext = os.path.splitext(original_filename)
            filename = f"{name}_{counter}{ext}"
            counter += 1
        
        full_path = target_dir / filename
        return filename, full_path

    def download_file(self, url: str, force_download: bool = False) -> Optional[str]:
        """下载文件到本地"""
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
            
            # 生成本地文件名
            filename, full_path = self.generate_local_filename(url, content_type)
            
            # 下载文件
            with open(full_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            # 记录下载的文件
            relative_path = os.path.relpath(full_path, self.output_dir)
            self.downloaded_files[url] = relative_path
            
            self.logger.info(f"下载完成: {url} -> {relative_path}")
            return relative_path
            
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
            'documents': [],
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
        
        # 提取其他资源（video, audio, source, iframe等）
        for tag_name, attr in [('video', 'src'), ('audio', 'src'), ('source', 'src'), 
                              ('iframe', 'src'), ('embed', 'src'), ('object', 'data')]:
            for element in soup.find_all(tag_name):
                if element.get(attr):
                    src = element[attr].strip()
                    absolute_url = urljoin(base_url, src)
                    absolute_url = self.normalize_url(absolute_url)
                    if self.is_valid_url(absolute_url):
                        resources['other'].append(absolute_url)
        
        # 提取CSS中的背景图片
        for element in soup.find_all(style=True):
            style = element['style']
            if 'url(' in style:
                matches = re.findall(r'url\(["\']?(.*?)["\']?\)', style)
                for match in matches:
                    absolute_url = urljoin(base_url, match.strip())
                    absolute_url = self.normalize_url(absolute_url)
                    if self.is_valid_url(absolute_url):
                        resources['images'].append(absolute_url)
        
        # 去重
        for key in resources:
            resources[key] = list(set(resources[key]))
            
        return resources

    def update_html_content(self, soup: BeautifulSoup, base_url: str) -> str:
        """更新HTML内容，将内部资源链接指向本地文件"""
        
        # 更新图片链接
        for img in soup.find_all('img'):
            for attr in ['src', 'data-src', 'data-original']:
                if img.get(attr):
                    original_url = urljoin(base_url, img[attr])
                    if self.is_internal_url(original_url) and original_url in self.downloaded_files:
                        img[attr] = self.downloaded_files[original_url]
                    break
        
        # 更新CSS链接
        for link in soup.find_all('link', rel='stylesheet'):
            if link.get('href'):
                original_url = urljoin(base_url, link['href'])
                if self.is_internal_url(original_url) and original_url in self.downloaded_files:
                    link['href'] = self.downloaded_files[original_url]
        
        # 更新JavaScript链接
        for script in soup.find_all('script', src=True):
            original_url = urljoin(base_url, script['src'])
            if self.is_internal_url(original_url) and original_url in self.downloaded_files:
                script['src'] = self.downloaded_files[original_url]
        
        # 更新<a>标签链接
        for link in soup.find_all('a', href=True):
            original_url = urljoin(base_url, link['href'])
            if self.is_internal_url(original_url) and original_url in self.downloaded_files:
                link['href'] = self.downloaded_files[original_url]
        
        # 更新其他资源链接
        for tag_name, attr in [('video', 'src'), ('audio', 'src'), ('source', 'src'), 
                              ('iframe', 'src'), ('embed', 'src'), ('object', 'data')]:
            for element in soup.find_all(tag_name):
                if element.get(attr):
                    original_url = urljoin(base_url, element[attr])
                    if self.is_internal_url(original_url) and original_url in self.downloaded_files:
                        element[attr] = self.downloaded_files[original_url]
        
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
        for resource_type in ['images', 'css', 'js', 'other']:
            for resource_url in resources[resource_type]:
                if self.is_internal_url(resource_url):
                    all_urls_to_download.append(resource_url)
                else:
                    self.external_links.add(resource_url)
        
        # 并发下载所有资源
        if all_urls_to_download:
            self.logger.info(f"开始下载 {len(all_urls_to_download)} 个资源文件")
            self.download_resources_parallel(all_urls_to_download)
        
        # 更新HTML内容并保存
        updated_html = self.update_html_content(soup, url)
        html_filename, html_path = self.generate_local_filename(url, 'text/html')
        
        try:
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(updated_html)
            
            relative_path = os.path.relpath(html_path, self.output_dir)
            self.downloaded_files[url] = relative_path
            self.logger.info(f"HTML页面保存: {url} -> {relative_path}")
            
        except Exception as e:
            self.logger.error(f"保存HTML页面失败 {url}: {e}")
        
        self.logger.info(f"页面 {url} - 发现 {len(resources['links'])} 个链接, "
                        f"{len(all_urls_to_download)} 个内部资源")
        
        # 如果需要深度爬取，继续爬取同域名下的HTML页面
        if depth < self.max_depth:
            internal_html_links = [link for link in resources['links'] 
                                 if self.is_internal_url(link)
                                 and link not in self.visited_urls
                                 and self.get_file_type(link) == 'html']
            
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
        self.logger.info(f"开始完整下载网站: {self.base_url}")
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
            index_html = f"""
<!DOCTYPE html>
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
        .failed {{ color: #e74c3c; }}
        table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #f2f2f2; }}
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

    <h2>已下载的页面</h2>
    <div class="file-list">
        <ul>
"""
            
            # 添加HTML页面链接
            html_files = [(url, path) for url, path in result['downloaded_files'].items() 
                         if path.startswith('html/')]
            
            for original_url, local_path in sorted(html_files):
                index_html += f'<li><a href="{local_path}" target="_blank">{original_url}</a></li>\n'
            
            index_html += """
        </ul>
    </div>

    <h2>外部链接 (未下载)</h2>
    <div class="file-list">
        <ul>
"""
            
            for external_link in sorted(result['external_links'])[:50]:  # 最多显示50个外部链接
                index_html += f'<li><a href="{external_link}" target="_blank" class="external-link">{external_link}</a></li>\n'
            
            index_html += """
        </ul>
    </div>

    <h2>文件结构</h2>
    <p>下载的文件按以下结构组织:</p>
    <ul>
        <li><strong>html/</strong> - HTML页面文件</li>
        <li><strong>assets/</strong> - 资源文件
            <ul>
                <li><strong>images/</strong> - 图片文件</li>
                <li><strong>css/</strong> - CSS样式文件</li>
                <li><strong>js/</strong> - JavaScript文件</li>
                <li><strong>documents/</strong> - 文档文件 (PDF, DOC等)</li>
            </ul>
        </li>
    </ul>
</body>
</html>
"""
            
            index_path = self.output_dir / 'index.html'
            with open(index_path, 'w', encoding='utf-8') as f:
                f.write(index_html)
                
            self.logger.info(f"索引页面已创建: {index_path}")
            
        except Exception as e:
            self.logger.error(f"创建索引页面失败: {e}")

    def save_results(self, result: Dict, output_format: str, output_file: str) -> None:
        """保存结果"""
        try:
            if output_format.lower() == 'json':
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(result, f, ensure_ascii=False, indent=2)
                    
            elif output_format.lower() == 'csv':
                with open(output_file, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    
                    # 写入概要信息
                    writer.writerow(['概要信息'])
                    writer.writerow(['基础URL', result['base_url']])
                    writer.writerow(['输出目录', result['output_directory']])
                    writer.writerow(['下载时间(秒)', f"{result['crawl_time']:.2f}"])
                    writer.writerow(['访问页面数', result['total_pages_visited']])
                    writer.writerow(['下载文件数', result['total_downloaded_files']])
                    writer.writerow(['内部链接数', result['total_internal_links']])
                    writer.writerow(['外部链接数', result['total_external_links']])
                    writer.writerow(['下载失败数', result['total_failed_downloads']])
                    writer.writerow([])
                    
                    # 写入已下载文件
                    writer.writerow(['已下载文件', '本地路径'])
                    for url, local_path in result['downloaded_files'].items():
                        writer.writerow([url, local_path])
                    writer.writerow([])
                    
                    # 写入外部链接
                    writer.writerow(['外部链接'])
                    for link in result['external_links']:
                        writer.writerow([link])
                    writer.writerow([])
                    
                    # 写入下载失败的文件
                    if result['failed_downloads']:
                        writer.writerow(['下载失败的文件'])
                        for url in result['failed_downloads']:
                            writer.writerow([url])
                        
            elif output_format.lower() == 'txt':
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(f"网站完整下载结果\n")
                    f.write(f"="*60 + "\n")
                    f.write(f"基础URL: {result['base_url']}\n")
                    f.write(f"输出目录: {result['output_directory']}\n")
                    f.write(f"下载时间: {result['crawl_time']:.2f}秒\n")
                    f.write(f"访问页面: {result['total_pages_visited']} 个\n")
                    f.write(f"下载文件: {result['total_downloaded_files']} 个\n")
                    f.write(f"内部链接: {result['total_internal_links']} 个\n")
                    f.write(f"外部链接: {result['total_external_links']} 个\n")
                    f.write(f"下载失败: {result['total_failed_downloads']} 个\n\n")
                    
                    f.write("已下载的文件:\n")
                    f.write("-"*40 + "\n")
                    for i, (url, local_path) in enumerate(result['downloaded_files'].items(), 1):
                        f.write(f"{i}. {url}\n   -> {local_path}\n")
                    
                    f.write("\n外部链接 (未下载):\n")
                    f.write("-"*40 + "\n")
                    for i, link in enumerate(result['external_links'], 1):
                        f.write(f"{i}. {link}\n")
                    
                    if result['failed_downloads']:
                        f.write("\n下载失败的文件:\n")
                        f.write("-"*40 + "\n")
                        for i, url in enumerate(result['failed_downloads'], 1):
                            f.write(f"{i}. {url}\n")
                        
            self.logger.info(f"详细结果已保存到: {output_file}")
            
        except Exception as e:
            self.logger.error(f"保存文件失败: {e}")


def main():
    parser = argparse.ArgumentParser(description='完整网站内容下载工具')
    parser.add_argument('url', help='要下载的网站URL')
    parser.add_argument('-d', '--depth', type=int, default=1, help='爬取深度 (默认: 1)')
    parser.add_argument('-o', '--output-dir', default='downloaded_site', help='输出目录 (默认: downloaded_site)')
    parser.add_argument('-f', '--format', choices=['json', 'csv', 'txt'], default='json', 
                       help='结果文件输出格式 (默认: json)')
    parser.add_argument('--delay', type=float, default=1.0, help='请求间隔时间(秒) (默认: 1.0)')
    parser.add_argument('--max-workers', type=int, default=5, help='并发下载线程数 (默认: 5)')
    parser.add_argument('-v', '--verbose', action='store_true', help='详细输出')
    parser.add_argument('--report', default='download_report', help='下载报告文件名前缀 (默认: download_report)')
    
    args = parser.parse_args()
    
    # 设置日志级别
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # 验证URL格式
    if not args.url.startswith(('http://', 'https://')):
        args.url = 'https://' + args.url
    
    try:
        # 创建爬虫实例
        crawler = WebCrawler(
            base_url=args.url, 
            output_dir=args.output_dir,
            max_depth=args.depth, 
            delay=args.delay,
            max_workers=args.max_workers
        )
        
        print(f"开始下载网站: {args.url}")
        print(f"输出目录: {args.output_dir}")
        print(f"最大深度: {args.depth}")
        print(f"并发线程: {args.max_workers}")
        print("-" * 50)
        
        # 开始下载
        result = crawler.crawl()
        
        # 保存详细报告
        report_file = f"{args.report}.{args.format}"
        crawler.save_results(result, args.format, report_file)
        
        # 打印概要信息
        print("\n" + "="*60)
        print("下载完成!")
        print("="*60)
        print(f"原始网站: {result['base_url']}")
        print(f"输出目录: {result['output_directory']}")
        print(f"下载耗时: {result['crawl_time']:.2f}秒")
        print(f"访问页面: {result['total_pages_visited']} 个")
        print(f"下载文件: {result['total_downloaded_files']} 个")
        print(f"内部链接: {result['total_internal_links']} 个") 
        print(f"外部链接: {result['total_external_links']} 个")
        if result['total_failed_downloads'] > 0:
            print(f"下载失败: {result['total_failed_downloads']} 个")
        
        print(f"\n文件结构:")
        print(f"├── {args.output_dir}/")
        print(f"│   ├── index.html (索引页面)")
        print(f"│   ├── html/ (网页文件)")
        print(f"│   └── assets/ (资源文件)")
        print(f"│       ├── images/ (图片)")
        print(f"│       ├── css/ (样式表)")
        print(f"│       ├── js/ (脚本文件)")
        print(f"│       └── documents/ (文档)")
        print(f"└── {report_file} (详细报告)")
        
        print(f"\n👆 请打开 {args.output_dir}/index.html 查看下载的网站")
        
    except KeyboardInterrupt:
        print("\n用户中断下载")
        sys.exit(1)
    except Exception as e:
        print(f"程序执行错误: {e}")
        logging.exception("详细错误信息:")
        sys.exit(1)


if __name__ == '__main__':
    main()