#!/usr/bin/env python3
"""
全面的网站结构分析工具
分析原始网站和本地下载版本的差异
"""
import requests
from bs4 import BeautifulSoup
import os
from pathlib import Path
import re
from urllib.parse import urljoin, urlparse
import json
from datetime import datetime

class WebsiteAnalyzer:
    def __init__(self, base_url="http://www.assaybio.cn", local_dir="assaybio_v4"):
        self.base_url = base_url
        self.local_dir = Path(local_dir)
        self.original_pages = {}
        self.local_files = {}
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
    def analyze_original_website(self):
        """分析原始网站结构"""
        print("正在分析原始网站结构...")
        
        # 主要页面URL列表
        main_pages = {
            "首页": "/",
            "关于我们": "/info.aspx?id=00010001", 
            "关于我们2": "/info.aspx?id=00010002",
            "关于我们3": "/info.aspx?id=00010003", 
            "文献资料": "/info.aspx?id=00050001",
            "文献资料2": "/info.aspx?id=00050002",
            "文献资料3": "/info.aspx?id=00050003",
            "市场动向": "/info.aspx?id=00020001",
            "产品": "/info.aspx?id=00070001",
        }
        
        # 产品详情页
        product_pages = {
            "产品详情1748": "/display.aspx?id=1748",
            "产品详情1749": "/display.aspx?id=1749", 
            "产品详情1750": "/display.aspx?id=1750",
        }
        
        all_pages = {**main_pages, **product_pages}
        
        for name, url_path in all_pages.items():
            full_url = urljoin(self.base_url, url_path)
            try:
                print(f"分析: {name} - {full_url}")
                response = requests.get(full_url, headers=self.headers, timeout=10)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    self.original_pages[name] = {
                        'url': full_url,
                        'title': soup.title.string if soup.title else "",
                        'content_length': len(response.text),
                        'status': 'success',
                        'links_found': self.extract_links(soup, full_url)
                    }
                else:
                    self.original_pages[name] = {
                        'url': full_url, 
                        'status': f'error_{response.status_code}',
                        'title': '',
                        'content_length': 0,
                        'links_found': []
                    }
            except Exception as e:
                print(f"访问失败 {full_url}: {e}")
                self.original_pages[name] = {
                    'url': full_url,
                    'status': f'error_{str(e)}',
                    'title': '',
                    'content_length': 0,
                    'links_found': []
                }
                
    def extract_links(self, soup, base_url):
        """提取页面中的链接"""
        links = []
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href'].strip()
            if href and not href.startswith('#') and not href.startswith('mailto:'):
                full_url = urljoin(base_url, href)
                if 'assaybio.cn' in full_url:
                    links.append(full_url)
        return list(set(links))
    
    def analyze_local_files(self):
        """分析本地下载的文件"""
        print("正在分析本地文件...")
        
        if not self.local_dir.exists():
            print(f"本地目录不存在: {self.local_dir}")
            return
            
        # HTML文件
        html_files = list(self.local_dir.glob("*.html"))
        for html_file in html_files:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
                soup = BeautifulSoup(content, 'html.parser')
                
                self.local_files[html_file.name] = {
                    'path': str(html_file),
                    'title': soup.title.string if soup.title else "",
                    'content_length': len(content),
                    'file_size': html_file.stat().st_size,
                    'type': 'html'
                }
        
        # 图片文件
        image_files = []
        for ext in ['*.jpg', '*.png', '*.gif']:
            image_files.extend(self.local_dir.glob(ext))
        
        for img_file in image_files:
            self.local_files[img_file.name] = {
                'path': str(img_file),
                'file_size': img_file.stat().st_size,
                'type': 'image'
            }
            
        # CSS和JS文件
        for ext in ['*.css', '*.js']:
            for file_path in self.local_dir.glob(ext):
                self.local_files[file_path.name] = {
                    'path': str(file_path),
                    'file_size': file_path.stat().st_size, 
                    'type': 'resource'
                }
    
    def create_mapping_table(self):
        """创建原始URL到本地文件的映射表"""
        url_to_file_mapping = {
            "/": "index.html",
            "/info.aspx?id=00010001": "info.aspx_id_00010001.html",
            "/info.aspx?id=00010002": "info.aspx_id_00010002_1.html", 
            "/info.aspx?id=00010003": "info.aspx_id_00010003.html",
            "/info.aspx?id=00050001": "info.aspx_id_00050001.html",
            "/info.aspx?id=00050002": "info.aspx_id_00050002.html",
            "/info.aspx?id=00050003": "info.aspx_id_00050003.html", 
            "/info.aspx?id=00020001": "info.aspx_id_00020001.html",
            "/info.aspx?id=00070001": "info.aspx_id_00070001.html",
            "/display.aspx?id=1748": "display.aspx_id_1748.html",
            "/display.aspx?id=1749": "display.aspx_id_1749.html",
            "/display.aspx?id=1750": "display.aspx_id_1750.html",
        }
        return url_to_file_mapping
        
    def compare_content(self):
        """比较内容一致性"""
        print("正在比较内容一致性...")
        mapping = self.create_mapping_table()
        comparison_results = {}
        
        for page_name, page_data in self.original_pages.items():
            if page_data['status'] != 'success':
                comparison_results[page_name] = {
                    'status': 'original_inaccessible',
                    'reason': page_data['status']
                }
                continue
                
            # 找到对应的本地文件
            url_path = page_data['url'].replace(self.base_url, "")
            local_filename = mapping.get(url_path)
            
            if local_filename and local_filename in self.local_files:
                local_file_data = self.local_files[local_filename]
                
                # 比较标题
                title_match = page_data['title'] == local_file_data['title']
                
                # 比较内容长度
                length_diff = abs(page_data['content_length'] - local_file_data['content_length'])
                length_similarity = 1 - (length_diff / max(page_data['content_length'], 1))
                
                comparison_results[page_name] = {
                    'status': 'found',
                    'local_file': local_filename,
                    'title_match': title_match,
                    'original_title': page_data['title'],
                    'local_title': local_file_data['title'], 
                    'original_length': page_data['content_length'],
                    'local_length': local_file_data['content_length'],
                    'length_similarity': length_similarity,
                    'assessment': 'good' if length_similarity > 0.9 and title_match else 'needs_review'
                }
            else:
                comparison_results[page_name] = {
                    'status': 'missing',
                    'expected_filename': local_filename,
                    'original_url': page_data['url']
                }
                
        return comparison_results
    
    def generate_report(self):
        """生成详细的MD格式报告"""
        print("正在生成检查报告...")
        
        self.analyze_original_website()
        self.analyze_local_files()
        comparison_results = self.compare_content()
        
        # 生成报告
        report = f"""# 网站结构对比检查报告

**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**原始网站**: {self.base_url}  
**本地目录**: {self.local_dir}

## 1. 网站结构概览

### 1.1 原始网站分析结果
- **总页面数**: {len(self.original_pages)}
- **成功访问**: {sum(1 for p in self.original_pages.values() if p['status'] == 'success')}
- **访问失败**: {sum(1 for p in self.original_pages.values() if p['status'] != 'success')}

### 1.2 本地文件分析结果  
- **HTML文件数**: {len([f for f in self.local_files.values() if f.get('type') == 'html'])}
- **图片文件数**: {len([f for f in self.local_files.values() if f.get('type') == 'image'])}
- **资源文件数**: {len([f for f in self.local_files.values() if f.get('type') == 'resource'])}
- **总文件数**: {len(self.local_files)}

## 2. 页面对比详情

"""
        
        # 成功对比的页面
        successful_comparisons = [k for k, v in comparison_results.items() if v['status'] == 'found']
        if successful_comparisons:
            report += "### 2.1 ✅ 成功下载的页面\n\n"
            for page_name in successful_comparisons:
                result = comparison_results[page_name]
                status_icon = "✅" if result['assessment'] == 'good' else "⚠️"
                report += f"{status_icon} **{page_name}**\n"
                report += f"- 本地文件: `{result['local_file']}`\n"
                report += f"- 标题匹配: {'✅' if result['title_match'] else '❌'}\n"
                report += f"- 内容相似度: {result['length_similarity']:.2%}\n"
                report += f"- 原始长度: {result['original_length']:,} 字符\n"
                report += f"- 本地长度: {result['local_length']:,} 字符\n\n"
        
        # 缺失的页面
        missing_pages = [k for k, v in comparison_results.items() if v['status'] == 'missing']
        if missing_pages:
            report += "### 2.2 ❌ 缺失的页面\n\n"
            for page_name in missing_pages:
                result = comparison_results[page_name]
                report += f"❌ **{page_name}**\n"
                report += f"- 原始URL: `{result['original_url']}`\n"
                report += f"- 期望文件名: `{result.get('expected_filename', '未知')}`\n\n"
        
        # 访问失败的页面
        failed_pages = [k for k, v in comparison_results.items() if v['status'] == 'original_inaccessible']
        if failed_pages:
            report += "### 2.3 🔴 无法访问的原始页面\n\n"
            for page_name in failed_pages:
                result = comparison_results[page_name]
                report += f"🔴 **{page_name}**\n"
                report += f"- 错误原因: `{result['reason']}`\n\n"
        
        # 本地文件清单
        report += "## 3. 本地文件详细清单\n\n"
        
        # HTML文件
        html_files = [f for f, data in self.local_files.items() if data.get('type') == 'html']
        if html_files:
            report += "### 3.1 HTML文件\n\n"
            for filename in sorted(html_files):
                data = self.local_files[filename]
                report += f"- `{filename}` - {data['file_size']:,} bytes\n"
                if data.get('title'):
                    report += f"  - 标题: {data['title']}\n"
        
        # 图片文件 
        image_files = [f for f, data in self.local_files.items() if data.get('type') == 'image']
        if image_files:
            report += f"\n### 3.2 图片文件 ({len(image_files)} 个)\n\n"
            for filename in sorted(image_files):
                data = self.local_files[filename]
                report += f"- `{filename}` - {data['file_size']:,} bytes\n"
        
        # 资源文件
        resource_files = [f for f, data in self.local_files.items() if data.get('type') == 'resource']
        if resource_files:
            report += f"\n### 3.3 资源文件 ({len(resource_files)} 个)\n\n"
            for filename in sorted(resource_files):
                data = self.local_files[filename]
                report += f"- `{filename}` - {data['file_size']:,} bytes\n"
        
        # 修复建议
        report += "\n## 4. 修复建议\n\n"
        
        needs_review = [k for k, v in comparison_results.items() if v.get('assessment') == 'needs_review']
        if needs_review:
            report += "### 4.1 需要检查的页面\n\n"
            for page_name in needs_review:
                result = comparison_results[page_name]
                report += f"- **{page_name}**: "
                if not result['title_match']:
                    report += "标题不匹配 "
                if result['length_similarity'] < 0.9:
                    report += f"内容差异较大({result['length_similarity']:.1%}) "
                report += "\n"
        
        if missing_pages:
            report += "\n### 4.2 缺失页面处理\n\n"
            report += "建议重新运行爬虫下载以下页面:\n"
            for page_name in missing_pages:
                result = comparison_results[page_name]
                report += f"- {result['original_url']}\n"
        
        # 总结
        report += f"\n## 5. 总结\n\n"
        report += f"- ✅ 成功下载页面: {len(successful_comparisons)} 个\n"
        report += f"- ❌ 缺失页面: {len(missing_pages)} 个\n"
        report += f"- 🔴 无法访问页面: {len(failed_pages)} 个\n"
        report += f"- ⚠️ 需要检查页面: {len(needs_review)} 个\n\n"
        
        if len(successful_comparisons) == len(self.original_pages) and not needs_review:
            report += "🎉 **网站下载完整，内容一致性良好！**\n"
        else:
            report += "⚠️ **需要进一步优化和修复**\n"
        
        return report

def main():
    analyzer = WebsiteAnalyzer()
    report = analyzer.generate_report()
    
    # 保存报告
    report_file = "website_comparison_report.md"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"\n报告已生成: {report_file}")
    print("\n" + "="*60)
    print(report[:1000] + "..." if len(report) > 1000 else report)

if __name__ == "__main__":
    main()