// 产品相关类型
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProductImages {
  main: string;
  gallery: string[];
}

export interface ProductSEO {
  title: string;
  description: string;
  keywords: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  description: string;
  features: string[];
  specifications: Record<string, any>;
  images: ProductImages;
  seo: ProductSEO;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// 新闻相关类型
export interface NewsSEO {
  title: string;
  description: string;
  keywords: string[];
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishDate: string;
  category: string;
  tags: string[];
  featured: boolean;
  seo: NewsSEO;
}

// 文档相关类型
export interface Document {
  id: string;
  title: string;
  type: 'manual' | 'specification' | 'guide' | 'report';
  category: string;
  description: string;
  fileUrl: string;
  downloadCount: number;
  tags: string[];
  publishDate: string;
}

// 页面相关类型
export interface PageSEO {
  title: string;
  description: string;
  keywords: string[];
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  template: string;
  seo: PageSEO;
  status: 'published' | 'draft';
}

// 公司信息类型
export interface CompanyOffice {
  name: string;
  address: string;
  phone: string;
  fax?: string;
  qq?: string;
}

export interface CompanyContact {
  address: string;
  phone: string;
  email: string;
  offices?: CompanyOffice[];
}

export interface Company {
  name: string;
  description: string;
  established: string;
  services: string[];
  contact: CompanyContact;
}

// API响应类型
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// 分页相关类型
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  tags?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 搜索和过滤类型
export interface SearchFilters {
  keyword?: string;
  category?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

// 联系表单类型
export interface ContactForm {
  name: string;
  email: string;
  phone: string;
  company?: string;
  subject: string;
  message: string;
}

// 完整数据结构类型
export interface MigratedData {
  company: Company;
  products: Product[];
  news: NewsArticle[];
  documents: Document[];
  pages: Page[];
}