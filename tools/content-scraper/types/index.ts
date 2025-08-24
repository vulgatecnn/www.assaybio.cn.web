/**
 * 网站内容数据结构定义
 */

export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  htmlContent: string;
  metadata: PageMetadata;
  timestamp: string;
}

export interface PageMetadata {
  description?: string;
  keywords?: string[];
  author?: string;
  publishDate?: string;
  category?: string;
  language?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  features: string[];
  specifications?: Record<string, any>;
  images: string[];
  documents: string[];
  price?: string;
  url: string;
}

export interface Company {
  name: string;
  description: string;
  established?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  businessScope: string[];
}

export interface TechnicalDocument {
  title: string;
  type: 'manual' | 'specification' | 'research' | 'case-study';
  category: string;
  description: string;
  downloadUrl?: string;
  publishDate?: string;
  tags: string[];
}

export interface NewsArticle {
  title: string;
  content: string;
  publishDate: string;
  category: string;
  author?: string;
  tags: string[];
  url: string;
}

export interface ScrapingResult {
  company: Company;
  products: Product[];
  technicalDocs: TechnicalDocument[];
  news: NewsArticle[];
  pages: ScrapedPage[];
  metadata: {
    totalPages: number;
    scrapedAt: string;
    duration: string;
    errors: string[];
  };
}

export interface ScrapingConfig {
  baseUrl: string;
  maxPages?: number;
  delay?: number;
  outputDir?: string;
  includeImages?: boolean;
  followExternalLinks?: boolean;
  userAgent?: string;
}