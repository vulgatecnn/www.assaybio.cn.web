#!/usr/bin/env python3
"""
Organize Market Trend Images
This script analyzes scraped images and helps match them to appropriate market trends
"""

import os
import shutil
from pathlib import Path
from datetime import datetime

# Configuration
SCRAPED_IMAGES_DIR = Path("D:/vulgate/code/trea/assaybio111/data/scraped/assets/images")
TARGET_DIR = Path("D:/vulgate/code/trea/assaybio111/apps/website/public/images/market-trends")
BACKUP_DIR = Path("D:/vulgate/code/trea/assaybio111/data/scraped/assets/images-backup")

def analyze_image_dates():
    """Analyze image filenames to understand their date patterns"""
    print("Analyzing scraped images...")
    
    if not SCRAPED_IMAGES_DIR.exists():
        print(f"Scraped images directory not found: {SCRAPED_IMAGES_DIR}")
        return
    
    images = list(SCRAPED_IMAGES_DIR.glob("*.jpg")) + list(SCRAPED_IMAGES_DIR.glob("*.png"))
    
    print(f"Found {len(images)} images in scraped directory")
    
    # Group images by year based on filename patterns
    year_groups = {}
    
    for img in images:
        filename = img.name
        print(f"Image: {filename}")
        
        # Extract date patterns from filename
        if len(filename) >= 14 and filename[:8].isdigit():
            # Pattern: 20190415025811117.jpg
            year = filename[:4]
            month = filename[4:6]
            day = filename[6:8]
            date_str = f"{year}-{month}-{day}"
            
            if year not in year_groups:
                year_groups[year] = []
            year_groups[year].append({
                'filename': filename,
                'date': date_str,
                'path': img
            })
    
    # Sort and display by year
    for year in sorted(year_groups.keys(), reverse=True):
        print(f"\n=== {year} ===")
        for img_info in sorted(year_groups[year], key=lambda x: x['date'], reverse=True):
            print(f"  {img_info['date']}: {img_info['filename']}")
    
    return year_groups

def copy_images_by_relevance():
    """Copy relevant images to market trends directory"""
    print("\nCopying relevant images to market trends directory...")
    
    # Ensure target directory exists
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    
    # Images that likely correspond to market trends (2014-2019 range)
    relevant_patterns = [
        "2019*.jpg", "2019*.png",  # 2019 events
        "2017*.jpg", "2017*.png",  # 2017 events
        "2015*.jpg", "2015*.png",  # 2015 events  
        "2014*.jpg", "2014*.png",  # 2014 events
    ]
    
    copied_count = 0
    
    for pattern in relevant_patterns:
        matching_files = list(SCRAPED_IMAGES_DIR.glob(pattern))
        
        for src_file in matching_files:
            dst_file = TARGET_DIR / src_file.name
            
            if not dst_file.exists():
                shutil.copy2(src_file, dst_file)
                print(f"  Copied: {src_file.name}")
                copied_count += 1
            else:
                print(f"  Already exists: {src_file.name}")
    
    print(f"\nCopied {copied_count} images to market trends directory")

def suggest_image_mappings():
    """Suggest mappings between images and market trend items"""
    print("\nSuggesting image mappings based on dates...")
    
    # Market trend dates (from the Vue component)
    market_trends = [
        {"id": "1", "title": "HJ1001-2018 标准方法宣贯会", "date": "2019-06-05"},
        {"id": "2", "title": "《认监委关于开展2019年国家级检验检测能力验证工作的通知》", "date": "2019-04-17"},
        {"id": "3", "title": "2019 HJ1001及CJT51标准宣贯会—5月6日北京", "date": "2019-04-17"},
        {"id": "4", "title": "2017年 美国爱德士公司水中微生物 能力验证全年计划", "date": "2017-02-09"},
        {"id": "5", "title": "两虫操作培训班——第3期开始报名", "date": "2015-08-24"},
        {"id": "6", "title": "恭贺2015年山东省水中微生物检测培训大篷车", "date": "2015-06-24"},
        {"id": "7", "title": "IDEXX 两虫检测培训中心", "date": "2015-03-27"},
        {"id": "8", "title": "IDEXX 水中微生物国标6项实验室间比对通知函", "date": "2015-03-27"},
        {"id": "9", "title": "微信平台上线", "date": "2014-08-12"},
    ]
    
    # Get available images
    images = list(TARGET_DIR.glob("*.jpg")) + list(TARGET_DIR.glob("*.png"))
    
    print("\nSuggested mappings:")
    print("=" * 60)
    
    for trend in market_trends:
        trend_year = trend["date"].split("-")[0]
        
        # Find images from the same year
        year_images = [img for img in images if img.name.startswith(trend_year)]
        
        print(f"\nTrend ID {trend['id']} ({trend['date']}):")
        print(f"  {trend['title']}")
        
        if year_images:
            print(f"  Suggested images from {trend_year}:")
            for img in year_images[:3]:  # Show max 3 suggestions
                print(f"    - {img.name}")
        else:
            print(f"  No images found for year {trend_year}")

def create_image_integration_guide():
    """Create a guide for integrating images into the Vue components"""
    
    guide_content = """
# Market Trends Image Integration Guide

## Available Images
The following images have been copied to `/public/images/market-trends/`:

"""
    
    images = list(TARGET_DIR.glob("*.*"))
    for img in sorted(images):
        guide_content += f"- {img.name}\n"
    
    guide_content += """

## Vue Component Updates

### 1. MarketTrendsView.vue
Add image paths to the marketTrends data array:

```typescript
{
  id: '1',
  title: 'HJ1001-2018 标准方法宣贯会',
  // ... other properties
  image: '/images/market-trends/[SELECTED_IMAGE_NAME]'
}
```

### 2. MarketTrendDetailView.vue  
Add image paths to the marketTrendsData object:

```typescript
'1': {
  id: '1',
  title: 'HJ1001-2018 标准方法宣贯会',
  // ... other properties  
  image: '/images/market-trends/[SELECTED_IMAGE_NAME]'
}
```

## Image Selection Guidelines

1. **Match by date**: Choose images with dates close to the market trend event dates
2. **Content relevance**: Select images that appear to be related to the event type
3. **Quality**: Choose clear, professional-looking images
4. **Format**: Prefer landscape orientation for better display in the UI

## Next Steps

1. Review the suggested mappings above
2. Manually select appropriate images for each market trend
3. Update the Vue components with the selected image paths
4. Test the image display in both list and detail views
5. Add fallback handling for missing images
"""

    guide_path = Path("D:/vulgate/code/trea/assaybio111/tools/image-integration-guide.md")
    with open(guide_path, 'w', encoding='utf-8') as f:
        f.write(guide_content)
    
    print(f"\nCreated integration guide: {guide_path}")

def main():
    """Main function"""
    print("Market Trends Image Organization Tool")
    print("=" * 50)
    
    # Step 1: Analyze existing images
    year_groups = analyze_image_dates()
    
    # Step 2: Copy relevant images
    copy_images_by_relevance()
    
    # Step 3: Suggest mappings
    suggest_image_mappings()
    
    # Step 4: Create integration guide
    create_image_integration_guide()
    
    print("\n" + "=" * 50)
    print("Image organization completed!")
    print(f"Target directory: {TARGET_DIR}")

if __name__ == "__main__":
    main()