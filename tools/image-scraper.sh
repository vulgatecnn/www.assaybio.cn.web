#!/bin/bash

# Image Scraper for Assaybio Market Trends
# This script downloads missing images from the assaybio.cn website

set -e  # Exit on any error

# Configuration
BASE_URL="http://www.assaybio.cn"
OUTPUT_DIR="D:/vulgate/code/trea/assaybio111/apps/website/public/images/market-trends"
SCRAPED_DIR="D:/vulgate/code/trea/assaybio111/data/scraped/assets/images"
USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "Starting image download for market trends pages..."

# Market trends main page and subpages
MARKET_PAGES=(
    "http://www.assaybio.cn/info.aspx?id=00020001"
    "http://www.assaybio.cn/info.aspx?id=00020002" 
    "http://www.assaybio.cn/info.aspx?id=00020003"
    "http://www.assaybio.cn/info.aspx?id=00020004"
    "http://www.assaybio.cn/info.aspx?id=00020005"
    "http://www.assaybio.cn/info.aspx?id=00020006"
    "http://www.assaybio.cn/info.aspx?id=00020007"
    "http://www.assaybio.cn/info.aspx?id=00020008"
    "http://www.assaybio.cn/info.aspx?id=00020009"
    "http://www.assaybio.cn/info.aspx?id=00020010"
)

# Function to extract and download images from a page
download_images_from_page() {
    local page_url="$1"
    local page_id=$(echo "$page_url" | grep -o 'id=[^&]*' | cut -d'=' -f2)
    
    echo "Processing page: $page_url (ID: $page_id)"
    
    # Create temporary file for page content
    temp_file="/tmp/page_$page_id.html"
    
    # Download page content
    wget --user-agent="$USER_AGENT" \
         --timeout=30 \
         --tries=3 \
         --quiet \
         --output-document="$temp_file" \
         "$page_url" || {
        echo "Warning: Failed to download $page_url"
        return 1
    }
    
    # Extract image URLs from the page
    # Look for img src attributes and background images
    grep -oE '(src|background)[[:space:]]*=[[:space:]]*["\'][^"'\'']*\.(jpg|jpeg|png|gif|bmp|webp)[^"'\'']*["\']' "$temp_file" | \
    sed 's/.*=[[:space:]]*["\'\'']\([^"'\'']*\)["\'\'']/\1/' | \
    sort | uniq | while read -r img_url; do
        
        # Handle relative URLs
        if [[ "$img_url" == /* ]]; then
            img_url="$BASE_URL$img_url"
        elif [[ "$img_url" != http* ]]; then
            img_url="$BASE_URL/$img_url"
        fi
        
        # Get filename
        filename=$(basename "$img_url")
        # Add page ID prefix to avoid conflicts
        prefixed_filename="${page_id}_${filename}"
        
        echo "  Downloading: $img_url -> $prefixed_filename"
        
        # Download the image
        wget --user-agent="$USER_AGENT" \
             --timeout=30 \
             --tries=3 \
             --quiet \
             --output-document="$OUTPUT_DIR/$prefixed_filename" \
             "$img_url" || {
            echo "    Warning: Failed to download image $img_url"
        }
    done
    
    # Clean up temp file
    rm -f "$temp_file"
}

# Download images from all market trend pages
for page in "${MARKET_PAGES[@]}"; do
    download_images_from_page "$page"
    sleep 1  # Be respectful to the server
done

# Also try to download common image patterns that might be missed
echo "Downloading common image patterns..."

# Common image directories to check
IMAGE_DIRS=(
    "/upload/image/"
    "/images/"
    "/img/"
    "/assets/images/"
    "/files/image/"
)

# Common image patterns for market trends
for dir in "${IMAGE_DIRS[@]}"; do
    for year in {2019..2024}; do
        for month in {01..12}; do
            for day in {01..31}; do
                # Try common timestamp patterns
                pattern1="${year}${month}${day}"
                pattern2="${year}${month}${day}0"
                
                for ext in jpg jpeg png gif; do
                    for pattern in "$pattern1" "$pattern2"; do
                        img_url="${BASE_URL}${dir}${pattern}*.${ext}"
                        
                        # Try to download (this will fail for most, but might catch some)
                        wget --user-agent="$USER_AGENT" \
                             --timeout=10 \
                             --tries=1 \
                             --quiet \
                             --directory-prefix="$OUTPUT_DIR" \
                             --no-clobber \
                             "$img_url" 2>/dev/null || true
                    done
                done
            done
        done
    done
done

echo "Image download completed!"
echo "Images saved to: $OUTPUT_DIR"
ls -la "$OUTPUT_DIR"