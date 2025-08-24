#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量修复HTML文件中的资源路径，使其与原网站保持一致
"""
import os
import re
import glob

def fix_html_paths():
    """修复HTML文件中的资源路径"""
    
    # HTML文件目录
    html_dir = "backup_site/html"
    
    if not os.path.exists(html_dir):
        print(f"目录 {html_dir} 不存在！")
        return
    
    # 获取所有HTML文件
    html_files = glob.glob(os.path.join(html_dir, "*.html")) + \
                 glob.glob(os.path.join(html_dir, "*.aspx"))
    
    print(f"找到 {len(html_files)} 个HTML文件")
    
    # 路径替换规则
    replacements = [
        # CSS文件路径
        (r'href="\.\.\/assets\/css\/', 'href="images/'),
        (r"href='\.\.\/assets\/css\/", "href='images/"),
        
        # JS文件路径  
        (r'src="\.\.\/assets\/js\/', 'src="js/'),
        (r"src='\.\.\/assets\/js\/", "src='js/"),
        
        # 图片路径 - 将assets/images转为Upload路径
        (r'src="\.\.\/assets\/images\/(\d{14}_\d+\.(?:jpg|png|gif))"', r'src="/Upload/\1"'),
        (r"src='\.\.\/assets\/images\/(\d{14}_\d+\.(?:jpg|png|gif))'", r"src='/Upload/\1'"),
        
        # 特殊图片路径处理
        (r'src="\.\.\/assets\/images\/20140626033311433\.jpg"', 'src="/Upload/201406/20140626033311433.jpg"'),
        (r'src="\.\.\/assets\/images\/20140626033323042\.jpg"', 'src="/Upload/201406/20140626033323042.jpg"'),
        (r'src="\.\.\/assets\/images\/20140626033331464\.jpg"', 'src="/Upload/201406/20140626033331464.jpg"'),
        (r'src="\.\.\/assets\/images\/20200103084118_7482\.png"', 'src="/Upload/editor/image/20200103/20200103084118_7482.png"'),
    ]
    
    # 处理每个文件
    for file_path in html_files:
        print(f"处理文件: {file_path}")
        
        try:
            # 读取文件内容
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 应用所有替换规则
            original_content = content
            for pattern, replacement in replacements:
                content = re.sub(pattern, replacement, content)
            
            # 如果内容有变化，写回文件
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"  ✓ 已修复路径")
            else:
                print(f"  - 无需修复")
                
        except Exception as e:
            print(f"  ✗ 处理失败: {e}")

def create_symlinks():
    """创建符号链接，将原始资源路径映射到下载的文件"""
    
    base_dir = "backup_site"
    
    # 创建images目录并链接到assets/css
    images_dir = os.path.join(base_dir, "images")
    if not os.path.exists(images_dir):
        os.makedirs(images_dir)
    
    # 复制CSS文件到images目录（因为原网站CSS在images目录下）
    css_files = ["Kd_Common.css", "Kd_Default.css", "Kd_Inside.css"]
    for css_file in css_files:
        src_path = os.path.join(base_dir, "assets", "css", css_file)
        dst_path = os.path.join(images_dir, css_file)
        
        if os.path.exists(src_path) and not os.path.exists(dst_path):
            import shutil
            shutil.copy2(src_path, dst_path)
            print(f"复制 {css_file} 到 images 目录")
    
    # 创建js目录并复制JS文件
    js_dir = os.path.join(base_dir, "js")
    if not os.path.exists(js_dir):
        os.makedirs(js_dir)
    
    js_files = ["jquery-1.8.2.min.js", "common.js", "jquery.SuperSlide.2.1.js", "jquery-1.7.2.min.js", "jquery.scrbar.js"]
    for js_file in js_files:
        src_path = os.path.join(base_dir, "assets", "js", js_file)
        dst_path = os.path.join(js_dir, js_file)
        
        if os.path.exists(src_path) and not os.path.exists(dst_path):
            import shutil
            shutil.copy2(src_path, dst_path)
            print(f"复制 {js_file} 到 js 目录")

if __name__ == "__main__":
    print("开始修复HTML文件路径...")
    
    # 切换到正确的工作目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # 创建必要的目录和文件副本
    create_symlinks()
    
    # 修复HTML文件路径
    fix_html_paths()
    
    print("路径修复完成！")