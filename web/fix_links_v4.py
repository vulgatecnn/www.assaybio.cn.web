#!/usr/bin/env python3
"""
批量修复HTML文件中的链接，将.aspx?id=参数格式转换为对应的.html文件名
"""
import os
import re
from pathlib import Path

def fix_links_in_directory(directory="assaybio_v4"):
    """批量修复目录中所有HTML文件的链接"""
    
    # 定义链接映射规则
    link_mappings = {
        # 基本页面链接 (小写)
        'info.aspx?id=00010001': 'info.aspx_id_00010001.html',  # About Us
        'info.aspx?id=00050001': 'info.aspx_id_00050001.html',  # Literature  
        'info.aspx?id=00020001': 'info.aspx_id_00020001.html',  # Market Trend
        'info.aspx?id=00070001': 'info.aspx_id_00070001.html',  # Products
        'info.aspx?id=00010002': 'info.aspx_id_00010002_1.html', # About Us 2
        'info.aspx?id=00050002': 'info.aspx_id_00050002.html',  # Literature 2
        'info.aspx?id=00050003': 'info.aspx_id_00050003.html',  # Literature 3
        'info.aspx?id=00010003': 'info.aspx_id_00010003.html',  # About Us 3
        
        # 首字母大写的链接 (Info.aspx)
        'Info.aspx?id=00010001': 'info.aspx_id_00010001.html',
        'Info.aspx?id=00050001': 'info.aspx_id_00050001.html',
        'Info.aspx?id=00020001': 'info.aspx_id_00020001.html',
        'Info.aspx?id=00070001': 'info.aspx_id_00070001.html',
        'Info.aspx?id=00010002': 'info.aspx_id_00010002_1.html',
        'Info.aspx?id=00050002': 'info.aspx_id_00050002.html',
        'Info.aspx?id=00050003': 'info.aspx_id_00050003.html',
        'Info.aspx?id=00010003': 'info.aspx_id_00010003.html',
        
        # display.aspx页面
        'display.aspx?id=1748': 'display.aspx_id_1748.html',
        'display.aspx?id=1749': 'display.aspx_id_1749.html', 
        'display.aspx?id=1750': 'display.aspx_id_1750.html',
        
        # 其他可能的链接
        'default.aspx': 'index.html'  # 主页链接
    }
    
    directory_path = Path(directory)
    
    if not directory_path.exists():
        print(f"目录 {directory} 不存在!")
        return
    
    # 查找所有HTML文件
    html_files = list(directory_path.glob("*.html"))
    print(f"找到 {len(html_files)} 个HTML文件需要处理")
    
    total_replacements = 0
    
    for html_file in html_files:
        print(f"处理文件: {html_file.name}")
        
        try:
            # 读取文件内容
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            file_replacements = 0
            
            # 替换每个映射
            for old_link, new_link in link_mappings.items():
                # 查找 href="old_link" 和 href='old_link' 格式
                patterns = [
                    f'href="{old_link}"',
                    f"href='{old_link}'",
                    f'href="{old_link.replace("?", "\\?")}"',  # 转义问号
                    f"href='{old_link.replace('?', '\\?')}'"
                ]
                
                for pattern in patterns:
                    if old_link in content:
                        # 使用简单字符串替换
                        old_href = f'href="{old_link}"'
                        new_href = f'href="{new_link}"'
                        if old_href in content:
                            content = content.replace(old_href, new_href)
                            file_replacements += 1
                        
                        old_href = f"href='{old_link}'"
                        new_href = f"href='{new_link}'"
                        if old_href in content:
                            content = content.replace(old_href, new_href)
                            file_replacements += 1
            
            # 如果有修改，写回文件
            if content != original_content:
                with open(html_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"  -> 完成 {file_replacements} 个链接替换")
                total_replacements += file_replacements
            else:
                print(f"  -> 无需修改")
                
        except Exception as e:
            print(f"  -> 处理失败: {e}")
    
    print(f"\n批量处理完成!")
    print(f"总共处理了 {len(html_files)} 个HTML文件")
    print(f"总共完成了 {total_replacements} 个链接替换")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='批量修复HTML文件中的链接')
    parser.add_argument('-d', '--directory', default='assaybio_v4', help='目标目录 (默认: assaybio_v4)')
    
    args = parser.parse_args()
    
    print("开始批量修复HTML文件中的链接...")
    print(f"目标目录: {args.directory}")
    print("-" * 50)
    
    fix_links_in_directory(args.directory)