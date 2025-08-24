#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复aspx文件和链接问题
1. 将.aspx文件重命名为.html
2. 更新所有HTML文件中的aspx链接为html链接
"""
import os
import re
import glob
from pathlib import Path

def fix_aspx_files(directory):
    """修复aspx文件和链接问题"""
    
    directory = Path(directory)
    if not directory.exists():
        print(f"目录 {directory} 不存在！")
        return
    
    # 第一步：找到所有aspx文件并重命名为html
    aspx_files = list(directory.glob("*.aspx"))
    rename_mapping = {}  # aspx文件名 -> html文件名的映射
    
    print(f"找到 {len(aspx_files)} 个aspx文件")
    
    for aspx_file in aspx_files:
        html_file = aspx_file.with_suffix('.html')
        
        # 如果目标html文件不存在，或者是同名的，进行重命名
        if not html_file.exists() or aspx_file.stem == 'index':
            if aspx_file.stem == 'index':
                # 如果是index.aspx，重命名为main.html避免冲突
                html_file = aspx_file.parent / 'main.html'
            
            print(f"重命名: {aspx_file.name} -> {html_file.name}")
            aspx_file.rename(html_file)
            rename_mapping[aspx_file.name] = html_file.name
        else:
            print(f"目标文件 {html_file.name} 已存在，跳过 {aspx_file.name}")
    
    # 第二步：找到所有HTML文件并更新其中的aspx链接
    html_files = list(directory.glob("*.html"))
    
    print(f"\\n找到 {len(html_files)} 个HTML文件，开始更新链接...")
    
    for html_file in html_files:
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # 更新aspx链接为html链接
            # 处理各种aspx链接格式
            patterns = [
                # href="xxx.aspx"
                (r'href="([^"]*\\.aspx)"', r'href="\\1"'),
                # href='xxx.aspx'  
                (r"href='([^']*\\.aspx)'", r"href='\\1'"),
                # href="xxx.aspx?id=xxx"
                (r'href="([^"]*\\.aspx[^"]*)"', r'href="\\1"'),
                # href='xxx.aspx?id=xxx'
                (r"href='([^']*\\.aspx[^']*)'", r"href='\\1'"),
            ]
            
            # 应用替换规则
            for pattern, replacement in patterns:
                # 将.aspx替换为.html
                content = re.sub(pattern, lambda m: m.group(0).replace('.aspx', '.html'), content)
            
            # 处理特殊情况：info.aspx需要根据参数区分不同页面
            content = re.sub(r'href="info\\.html\\?id=00010001"', 'href="info_about.html"', content)
            content = re.sub(r'href="info\\.html\\?id=00050001"', 'href="info_literature.html"', content)
            content = re.sub(r'href="info\\.html\\?id=00020001"', 'href="info_market.html"', content)
            content = re.sub(r'href="info\\.html\\?id=00070001"', 'href="info_products.html"', content)
            
            # 处理default.aspx
            content = content.replace('default.html', 'index.html')
            
            # 如果内容有变化，写回文件
            if content != original_content:
                with open(html_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"  ✓ 更新了 {html_file.name} 中的链接")
            else:
                print(f"  - {html_file.name} 无需更新")
                
        except Exception as e:
            print(f"  ✗ 处理文件 {html_file.name} 时出错: {e}")
    
    # 第三步：根据参数重命名特定的info页面
    info_files = list(directory.glob("info*.html"))
    if len(info_files) > 0:
        print(f"\\n处理 {len(info_files)} 个info页面的重命名...")
        
        # 需要创建不同的info页面
        info_pages = [
            ("info.html", "info_about.html"),
            ("info.html", "info_literature.html"), 
            ("info.html", "info_market.html"),
            ("info.html", "info_products.html")
        ]
        
        # 检查是否有info.html文件
        info_html = directory / "info.html"
        if info_html.exists():
            # 复制info.html到不同的命名版本
            for original, target in info_pages:
                target_path = directory / target
                if not target_path.exists():
                    import shutil
                    shutil.copy2(info_html, target_path)
                    print(f"  ✓ 创建 {target}")
    
    print(f"\\n修复完成！")
    print("建议检查以下内容：")
    print("1. 所有aspx文件是否已重命名为html")
    print("2. 所有HTML中的链接是否正确更新") 
    print("3. 测试网站导航功能是否正常")

if __name__ == "__main__":
    # 修复assaybio_v2目录
    fix_aspx_files("assaybio_v2")