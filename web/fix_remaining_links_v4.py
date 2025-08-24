#!/usr/bin/env python3
"""
修复剩余的链接问题 - display.aspx 和 Info.aspx 链接
"""
import os
import re
from pathlib import Path

def fix_remaining_links(directory="assaybio_v4"):
    """修复剩余的链接问题"""
    
    directory_path = Path(directory)
    
    if not directory_path.exists():
        print(f"目录 {directory} 不存在!")
        return
    
    # 查找所有HTML文件
    html_files = list(directory_path.glob("*.html"))
    print(f"找到 {len(html_files)} 个HTML文件需要处理")
    
    # 定义链接映射规则
    display_mappings = {
        # display.aspx?id=xxxx -> display.aspx_id_xxxx.html
        'display.aspx?id=1748': 'display.aspx_id_1748.html',
        'display.aspx?id=1749': 'display.aspx_id_1749.html',
        'display.aspx?id=1750': 'display.aspx_id_1750.html',
        'display.aspx?id=2005': 'display.aspx_id_2005.html',  # 如果存在
        'display.aspx?id=1998': 'display.aspx_id_1998.html',
        'display.aspx?id=1992': 'display.aspx_id_1992.html',
        'display.aspx?id=1990': 'display.aspx_id_1990.html',
        'display.aspx?id=1774': 'display.aspx_id_1774.html',
        'display.aspx?id=1772': 'display.aspx_id_1772.html',
        'display.aspx?id=1719': 'display.aspx_id_1719.html',
        'display.aspx?id=1721': 'display.aspx_id_1721.html',
        'display.aspx?id=1722': 'display.aspx_id_1722.html',
        'display.aspx?id=1723': 'display.aspx_id_1723.html',
        'display.aspx?id=1724': 'display.aspx_id_1724.html',
        'display.aspx?id=1725': 'display.aspx_id_1725.html',
        'display.aspx?id=1726': 'display.aspx_id_1726.html',
        'display.aspx?id=1727': 'display.aspx_id_1727.html',
        'display.aspx?id=1728': 'display.aspx_id_1728.html',
        'display.aspx?id=1729': 'display.aspx_id_1729.html',
    }
    
    info_mappings = {
        # Info.aspx?id=xxxx -> info.aspx_id_xxxx.html (注意大小写)
        'Info.aspx?id=00070002': 'info.aspx_id_00070002.html',
        'Info.aspx?id=00070003': 'info.aspx_id_00070003.html', 
        'Info.aspx?id=00070004': 'info.aspx_id_00070004.html',
        'Info.aspx?id=00070005': 'info.aspx_id_00070005.html',
        'Info.aspx?id=00070006': 'info.aspx_id_00070006.html',
        'Info.aspx?id=00070007': 'info.aspx_id_00070007.html',
        'Info.aspx?id=00070008': 'info.aspx_id_00070008.html',
        # 具体产品页面
        'Info.aspx?id=000700010001': 'info.aspx_id_000700010001.html',
        'Info.aspx?id=000700010002': 'info.aspx_id_000700010002.html',
        'Info.aspx?id=000700010003': 'info.aspx_id_000700010003.html',
        'Info.aspx?id=000700010004': 'info.aspx_id_000700010004.html',
        'Info.aspx?id=000700010005': 'info.aspx_id_000700010005.html',
        'Info.aspx?id=000700010006': 'info.aspx_id_000700010006.html',
        'Info.aspx?id=000700010007': 'info.aspx_id_000700010007.html',
        'Info.aspx?id=000700010008': 'info.aspx_id_000700010008.html',
        'Info.aspx?id=000700010009': 'info.aspx_id_000700010009.html',
        'Info.aspx?id=000700010010': 'info.aspx_id_000700010010.html',
        'Info.aspx?id=000700010011': 'info.aspx_id_000700010011.html',
        'Info.aspx?id=000700010012': 'info.aspx_id_000700010012.html',
        'Info.aspx?id=000700010013': 'info.aspx_id_000700010013.html',
        'Info.aspx?id=000700010014': 'info.aspx_id_000700010014.html',
        'Info.aspx?id=000700010015': 'info.aspx_id_000700010015.html',
    }
    
    total_replacements = 0
    
    for html_file in html_files:
        print(f"处理文件: {html_file.name}")
        
        try:
            # 读取文件内容
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            file_replacements = 0
            
            # 替换display.aspx链接
            for old_link, new_link in display_mappings.items():
                # 检查目标文件是否存在
                target_file = directory_path / new_link
                if target_file.exists():
                    old_href = f'href="{old_link}"'
                    new_href = f'href="{new_link}"'
                    if old_href in content:
                        content = content.replace(old_href, new_href)
                        file_replacements += 1
                        print(f"  -> 替换: {old_link} -> {new_link}")
                else:
                    # 如果文件不存在，替换为#以避免404
                    old_href = f'href="{old_link}"'
                    new_href = f'href="#" title="页面未下载: {old_link}"'
                    if old_href in content:
                        content = content.replace(old_href, new_href)
                        file_replacements += 1
                        print(f"  -> 禁用链接: {old_link} (文件不存在)")
            
            # 替换Info.aspx链接
            for old_link, new_link in info_mappings.items():
                target_file = directory_path / new_link
                if target_file.exists():
                    old_href = f'href="{old_link}"'
                    new_href = f'href="{new_link}"'
                    if old_href in content:
                        content = content.replace(old_href, new_href)
                        file_replacements += 1
                        print(f"  -> 替换: {old_link} -> {new_link}")
                else:
                    # 如果文件不存在，替换为#以避免404
                    old_href = f'href="{old_link}"'
                    new_href = f'href="#" title="页面未下载: {old_link}"'
                    if old_href in content:
                        content = content.replace(old_href, new_href)
                        file_replacements += 1
                        print(f"  -> 禁用链接: {old_link} (文件不存在)")
            
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
    parser = argparse.ArgumentParser(description='修复剩余的链接问题')
    parser.add_argument('-d', '--directory', default='assaybio_v4', help='目标目录 (默认: assaybio_v4)')
    
    args = parser.parse_args()
    
    print("开始修复剩余的链接问题...")
    print(f"目标目录: {args.directory}")
    print("-" * 50)
    
    fix_remaining_links(args.directory)