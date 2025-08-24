#!/usr/bin/env python3
"""
Advanced Image Scraper for Assaybio Market Trends
Downloads images from market trends pages and organizes them properly
"""

import os
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
from urllib.error import URLError, HTTPError
from bs4 import BeautifulSoup

# Configuration
BASE_URL = "http://www.assaybio.cn"
OUTPUT_DIR = Path("D:/vulgate/code/trea/assaybio111/apps/website/public/images/market-trends")
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

def setup_directories():
    """Create necessary directories"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def download_page(url, timeout=30):
    """Download a web page and return its content"""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.read().decode('utf-8', errors='ignore')
    except (URLError, HTTPError) as e:
        print(f"Error downloading {url}: {e}")
        return None

def extract_images_from_html(html_content, base_url):
    """Extract all image URLs from HTML content"""
    if not html_content:
        return []
    
    soup = BeautifulSoup(html_content, 'html.parser')
    image_urls = set()
    
    # Find all img tags
    for img in soup.find_all('img'):
        src = img.get('src')
        if src:
            image_urls.add(src)
    
    # Find all elements with background images in style attribute
    for element in soup.find_all(style=True):
        style = element.get('style', '')
        bg_images = re.findall(r'background-image\s*:\s*url\(["\']?([^"\'()]+)["\']?\)', style)
        for bg_img in bg_images:
            image_urls.add(bg_img)
    
    # Convert relative URLs to absolute
    absolute_urls = []
    for url in image_urls:
        if url.startswith('http'):
            absolute_urls.append(url)
        elif url.startswith('//'):
            absolute_urls.append('http:' + url)
        elif url.startswith('/'):
            absolute_urls.append(base_url + url)
        else:
            absolute_urls.append(base_url + '/' + url)
    
    return absolute_urls

def download_image(img_url, output_path, timeout=30):
    """Download an image from URL to local path"""
    try:
        req = urllib.request.Request(img_url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req, timeout=timeout) as response:
            with open(output_path, 'wb') as f:
                f.write(response.read())
        return True
    except (URLError, HTTPError) as e:
        print(f"  Error downloading image {img_url}: {e}")
        return False

def process_page(page_url, page_id):
    """Process a single page and download its images"""
    print(f"Processing page: {page_url} (ID: {page_id})")
    
    # Download page content
    html_content = download_page(page_url)
    if not html_content:
        return
    
    # Extract image URLs
    image_urls = extract_images_from_html(html_content, BASE_URL)
    
    print(f"  Found {len(image_urls)} images")
    
    # Download each image
    for i, img_url in enumerate(image_urls, 1):
        # Get filename and add page ID prefix
        filename = os.path.basename(urllib.parse.urlparse(img_url).path)
        if not filename or '.' not in filename:
            # Generate filename if missing
            ext = 'jpg'  # default extension
            if 'png' in img_url.lower():
                ext = 'png'
            elif 'gif' in img_url.lower():
                ext = 'gif'
            filename = f"image_{i}.{ext}"
        
        prefixed_filename = f"{page_id}_{filename}"
        output_path = OUTPUT_DIR / prefixed_filename
        
        # Skip if file already exists
        if output_path.exists():
            print(f"  Skipping existing file: {prefixed_filename}")
            continue
        
        print(f"  Downloading: {img_url} -> {prefixed_filename}")
        
        if download_image(img_url, output_path):
            print(f"    + Downloaded successfully")
        else:
            print(f"    - Download failed")
        
        # Be respectful to the server
        time.sleep(0.5)

def main():
    """Main function to run the image scraper"""
    print("Starting advanced image scraper for Assaybio market trends...")
    
    # Setup directories
    setup_directories()
    
    # Market trends page IDs to process
    page_ids = [
        "00020001", "00020002", "00020003", "00020004", "00020005",
        "00020006", "00020007", "00020008", "00020009", "00020010"
    ]
    
    # Process each page
    for page_id in page_ids:
        page_url = f"{BASE_URL}/info.aspx?id={page_id}"
        process_page(page_url, page_id)
        time.sleep(1)  # Be respectful to the server
    
    print(f"\nImage scraping completed!")
    print(f"Images saved to: {OUTPUT_DIR}")
    
    # List downloaded files
    if OUTPUT_DIR.exists():
        files = list(OUTPUT_DIR.glob("*"))
        print(f"Downloaded {len(files)} files:")
        for file in sorted(files):
            print(f"  {file.name}")

if __name__ == "__main__":
    main()