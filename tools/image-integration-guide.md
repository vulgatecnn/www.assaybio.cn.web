
# Market Trends Image Integration Guide

## Available Images
The following images have been copied to `/public/images/market-trends/`:

- 00020001_20200103084118_7482.png
- 20140626033311433.jpg
- 20140626033323042.jpg
- 20140626033331464.jpg
- 20140630011559917.jpg
- 20140630112144495.jpg
- 20140630112640683.jpg
- 20140630113403199.jpg
- 20140728035056056.jpg
- 20140728035056385.jpg
- 20140728035056760.jpg
- 20140728035056978.jpg
- 20150729012555203.jpg
- 20150729012555219.jpg
- 20150729032203219.jpg
- 20150729032203234.jpg
- 20150729093525187.jpg
- 20150729093525203.jpg
- 20150729094915375.png
- 20150729094915391.png
- 20150730032542203.jpg
- 20150730032542219.jpg
- 20150810032141374.png
- 20150810032141390.png
- 20190415025811117.jpg
- 20190415025811132.jpg
- 20190415035916890.jpg
- 20190415035916905.jpg
- 20190415043437069.jpg
- 20190415043510258.jpg
- 20190417011809368.png
- 20190417011809383.png
- 20190603043929644.jpg
- 20190603043929659.jpg
- 20200103084118_7482.png


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
