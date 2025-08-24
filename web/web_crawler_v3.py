#!/usr/bin/env python3
"""
Web Crawler Tool v3 - 正确处理服务器端文件和参数
功能：正确处理.aspx等服务器端文件，将带参数的页面保存为不同的HTML文件
"""

import argparse
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urlunparse, parse_qs
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
import hashlib


class WebCrawlerV3:
    def __init__(self, base_url: str, output_dir: str = "downloaded_site", max_depth: int = 1, 
                 delay: float = 1.0, max_workers: int = 5):
        """
        初始化网络爬虫 v3 - 正确处理服务器端文件
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

    def generate_local_filename_from_url(self, url: str, content_type: str = None) -> str:
        """根据URL生成合适的本地文件名"""
        parsed = urlparse(url)
        path = parsed.path.lstrip('/')
        query = parsed.query
        
        # 如果URL路径为空或以/结尾，使用index.html
        if not path or path.endswith('/'):
            return 'index.html'
        
        # 获取文件名和扩展名
        path_parts = Path(path)
        filename = path_parts.stem
        extension = path_parts.suffix.lower()
        
        # 处理带参数的服务器端文件
        if extension in ['.aspx', '.php', '.jsp', '.htm'] and query:
            # 将查询参数转换为文件名的一部分
            # 格式：filename.aspx_param1_value1_param2_value2.html
            query_params = parse_qs(query)
            query_parts = []
            
            for param_name, param_values in query_params.items():
                for param_value in param_values:
                    # 清理参数值，移除特殊字符
                    clean_value = re.sub(r'[^a-zA-Z0-9]', '', param_value)
                    query_parts.append(f"{param_name}_{clean_value}")
            
            if query_parts:
                # 使用原始扩展名_参数_参数.html的格式
                query_suffix = "_".join(query_parts)
                filename = f"{filename}{extension}_{query_suffix}"
            else:
                # 如果无法解析参数，使用查询字符串的哈希值
                query_hash = hashlib.md5(query.encode()).hexdigest()[:8]
                filename = f"{filename}{extension}_{query_hash}"
        
        # 将服务器端扩展名转换为.html
        if extension in ['.aspx', '.php', '.jsp']:
            extension = '.html'
        elif extension == '':
            # 如果没有扩展名且是HTML内容，添加.html
            if content_type and 'text/html' in content_type:
                extension = '.html'
        
        return f"{filename}{extension}"

    def create_local_path(self, url: str, content_type: str = None) -> Path:
        """创建本地文件路径，保持URL目录结构"""
        parsed = urlparse(url)
        url_path = parsed.path.lstrip('/')
        
        # 如果URL路径为空或以/结尾，使用index.html
        if not url_path or url_path.endswith('/'):
            if parsed.query:
                # 处理带参数的根目录请求
                filename = self.generate_local_filename_from_url(url, content_type)
                local_path = self.output_dir / filename
            else:
                local_path = self.output_dir / 'index.html'
        else:
            # 分离目录和文件名
            url_dir = os.path.dirname(url_path)
            url_filename = os.path.basename(url_path)
            
            # 处理带参数的文件
            if parsed.query:
                filename = self.generate_local_filename_from_url(url, content_type)
            else:
                filename = url_filename if url_filename else 'index.html'
                
                # 将服务器端扩展名转换为.html
                if filename.endswith(('.aspx', '.php', '.jsp')):
                    filename = os.path.splitext(filename)[0] + '.html'
            
            # 创建目录结构
            if url_dir:
                target_dir = self.output_dir / url_dir
                target_dir.mkdir(parents=True, exist_ok=True)
                local_path = target_dir / filename
            else:
                local_path = self.output_dir / filename
        
        # 确保文件名唯一
        counter = 1
        original_path = local_path
        while local_path.exists():
            stem = original_path.stem
            suffix = original_path.suffix
            local_path = original_path.parent / f"{stem}_{counter}{suffix}"
            counter += 1
        
        return local_path

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
            
            # 创建本地路径
            local_path = self.create_local_path(url, content_type)
            
            # 下载文件
            with open(local_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            # 记录下载的文件
            relative_path = os.path.relpath(local_path, self.output_dir)
            self.downloaded_files[url] = relative_path.replace('\\\\', '/')
            
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

    def download_css_resources(self, css_urls: List[str]) -> None:
        """下载CSS文件并提取其中的资源链接，同时更新CSS文件中的路径"""
        for css_url in css_urls:
            if not self.is_internal_url(css_url):
                continue
                
            try:
                response = requests.get(css_url, headers=self.headers, timeout=10)
                response.raise_for_status()
                css_content = response.text
                original_content = css_content
                
                # 提取CSS中的url()引用（支持多种引号格式）
                url_patterns = [
                    r'url\(\s*["\']([^"\']+)["\']\s*\)',  # url("path") 或 url('path')
                    r'url\(\s*([^)]+)\s*\)'               # url(path)
                ]
                
                updated_content = css_content
                css_resources = []
                
                for pattern in url_patterns:
                    matches = re.findall(pattern, css_content)
                    for match in matches:
                        # 清理路径中的引号和空格
                        clean_match = match.strip().strip('"\'')
                        if clean_match:
                            resource_url = urljoin(css_url, clean_match)
                            if self.is_internal_url(resource_url):
                                css_resources.append((clean_match, resource_url))
                
                # 下载CSS中引用的资源
                for original_path, resource_url in css_resources:
                    downloaded_path = self.download_file(resource_url)
                    if downloaded_path and css_url in self.downloaded_files:
                        # 计算从CSS文件到资源文件的相对路径
                        css_local_path = self.downloaded_files[css_url]
                        relative_path = self.get_relative_path(css_local_path, downloaded_path)
                        
                        # 替换CSS中的路径
                        # 处理各种url()格式
                        patterns_to_replace = [
                            f'url("{original_path}")',
                            f"url('{original_path}')",
                            f"url({original_path})"
                        ]
                        
                        for old_pattern in patterns_to_replace:
                            if old_pattern in updated_content:
                                new_pattern = f'url("{relative_path}")'
                                updated_content = updated_content.replace(old_pattern, new_pattern)
                
                # 如果CSS内容有更新，重新保存文件
                if updated_content != original_content and css_url in self.downloaded_files:
                    css_local_file = self.output_dir / self.downloaded_files[css_url]
                    try:
                        with open(css_local_file, 'w', encoding='utf-8') as f:
                            f.write(updated_content)
                        self.logger.info(f"已更新CSS文件中的资源路径: {css_local_file}")
                    except Exception as e:
                        self.logger.error(f"更新CSS文件失败 {css_local_file}: {e}")
                        
            except Exception as e:
                self.logger.error(f"处理CSS文件 {css_url} 时出错: {e}")

    def get_relative_path(self, from_path: str, to_path: str) -> str:
        """计算从from_path到to_path的相对路径"""
        try:
            from_dir = os.path.dirname(from_path) if from_path != '.' else ''
            rel_path = os.path.relpath(to_path, from_dir)
            return rel_path.replace('\\', '/')
        except:
            return to_path
    
    def update_html_content(self, soup: BeautifulSoup, base_url: str, current_file_path: str) -> str:
        """更新HTML内容，将内部资源链接转换为相对路径"""
        
        # 更新图片链接
        for img in soup.find_all('img'):
            for attr in ['src', 'data-src', 'data-original']:
                if img.get(attr):
                    original_url = urljoin(base_url, img[attr])
                    if self.is_internal_url(original_url) and original_url in self.downloaded_files:
                        target_path = self.downloaded_files[original_url]
                        relative_path = self.get_relative_path(current_file_path, target_path)
                        img[attr] = relative_path
                    break
        
        # 更新CSS链接
        for link in soup.find_all('link', rel='stylesheet'):
            if link.get('href'):
                original_url = urljoin(base_url, link['href'])
                if self.is_internal_url(original_url) and original_url in self.downloaded_files:
                    target_path = self.downloaded_files[original_url]
                    relative_path = self.get_relative_path(current_file_path, target_path)
                    link['href'] = relative_path
        
        # 更新JavaScript链接
        for script in soup.find_all('script', src=True):
            original_url = urljoin(base_url, script['src'])
            if self.is_internal_url(original_url) and original_url in self.downloaded_files:
                target_path = self.downloaded_files[original_url]
                relative_path = self.get_relative_path(current_file_path, target_path)
                script['src'] = relative_path
        
        # 更新<a>标签链接
        for link in soup.find_all('a', href=True):
            original_href = link['href'].strip()
            
            # 跳过特殊链接
            if not original_href or original_href.startswith(('#', 'mailto:', 'tel:', 'javascript:')):
                continue
                
            original_url = urljoin(base_url, original_href)
            
            if self.is_internal_url(original_url):
                # 如果这个URL已经被下载，使用相对路径
                if original_url in self.downloaded_files:
                    target_path = self.downloaded_files[original_url]
                    relative_path = self.get_relative_path(current_file_path, target_path)
                    link['href'] = relative_path
                    self.logger.debug(f"链接更新: {original_href} -> {relative_path}")
                else:
                    # 如果URL没有被下载，但是是aspx/php/jsp等服务器端文件，尝试转换为html文件名
                    parsed_url = urlparse(original_url)
                    if parsed_url.path.endswith(('.aspx', '.php', '.jsp')):
                        # 生成对应的本地文件名
                        expected_local_path = self.create_local_path(original_url, 'text/html')
                        expected_relative_path = os.path.relpath(expected_local_path, self.output_dir).replace('\\', '/')
                        
                        # 检查这个预期的本地文件是否存在
                        if expected_local_path.exists():
                            relative_path = self.get_relative_path(current_file_path, expected_relative_path)
                            link['href'] = relative_path
                            self.logger.debug(f"ASPX链接转换: {original_href} -> {relative_path}")
                        else:
                            # 即使文件不存在，也转换链接格式为预期的html文件名格式
                            # 这样用户就知道如果下载了这个页面，链接应该指向哪里
                            relative_path = self.get_relative_path(current_file_path, expected_relative_path)
                            link['href'] = relative_path
                            self.logger.info(f"链接预转换（目标文件未下载）: {original_href} -> {relative_path}")
                    else:
                        # 对于非服务器端文件，保持原链接
                        self.logger.warning(f"未找到对应的本地文件: {original_href}")
        
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
        
        # 下载CSS中的资源
        css_urls = [url for url in resources['css'] if self.is_internal_url(url)]
        if css_urls:
            self.download_css_resources(css_urls)
        
        # 创建HTML文件的本地路径
        html_local_path = self.create_local_path(url, 'text/html')
        current_file_path = os.path.relpath(html_local_path, self.output_dir).replace('\\\\', '/')
        
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
            
            for link in internal_html_links[:20]:  # 限制每页最多爬取20个子页面
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
    <h1>网站下载完成 (v3)</h1>
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
                         if path.endswith('.html')]
            
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
    <p><strong>v3版本改进：</strong></p>
    <ul>
        <li>正确处理带参数的aspx页面，每个不同参数生成不同的HTML文件</li>
        <li>自动下载CSS中引用的背景图片</li>
        <li>服务器端文件(.aspx, .php等)自动转换为.html文件</li>
        <li>确保所有链接在本地正常工作</li>
    </ul>
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
    parser = argparse.ArgumentParser(description='Web Crawler v3 - 正确处理服务器端文件和参数')
    parser.add_argument('url', help='要下载的网站URL')
    parser.add_argument('-d', '--depth', type=int, default=10, help='爬取深度 (默认: 10)')
    parser.add_argument('-o', '--output-dir', default='assaybio_structured', help='输出目录 (默认: assaybio_structured)')
    parser.add_argument('--delay', type=float, default=2.0, help='请求间隔时间(秒) (默认: 2.0)')
    parser.add_argument('--max-workers', type=int, default=3, help='并发下载线程数 (默认: 3)')
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
        crawler = WebCrawlerV3(
            base_url=args.url, 
            output_dir=args.output_dir,
            max_depth=args.depth, 
            delay=args.delay,
            max_workers=args.max_workers
        )
        
        print(f"开始下载网站: {args.url}")
        print(f"输出目录: {args.output_dir}")
        print(f"v3版本改进：正确处理带参数的服务器端文件")
        print("-" * 50)
        
        # 开始下载
        result = crawler.crawl()
        
        # 保存详细报告
        report_file = "download_report_v3.json"
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
            print(f"\\n访问主页面: {main_index}")
        print(f"查看下载索引: {os.path.join(args.output_dir, 'site_index.html')}")
        
    except KeyboardInterrupt:
        print("\\n用户中断下载")
        sys.exit(1)
    except Exception as e:
        print(f"程序执行错误: {e}")
        logging.exception("详细错误信息:")
        sys.exit(1)


if __name__ == '__main__':
    main()