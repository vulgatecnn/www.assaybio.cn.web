-- AssayBio 网站数据迁移 SQL 脚本
-- 生成时间: 2025-08-24T06:55:54.823Z

-- 产品分类表
INSERT INTO product_categories (id, name, slug, description) VALUES
('5oC75aSn6IKg', '总大肠菌群检测', '总大肠菌群检测', '总大肠菌群检测产品分类'),
('5qOA5rWL6K6+', '检测设备', '检测设备', '检测设备产品分类');

-- 产品表  
INSERT INTO products (id, slug, name, category_id, description, features, status, created_at, updated_at) VALUES
('prod001', 'dst技术大肠菌群检测系统', 'DST技术大肠菌群检测系统', '5oC75aSn6IKg', 'DST技术大肠菌群检测系统，高精度检测解决方案', '["高精度检测","快速出结果"]', 'active', '2025-08-24T06:55:54.816Z', '2025-08-24T06:55:54.816Z'),
('prod002', '科立得试剂-18小时', '科立得试剂 18小时', '5oC75aSn6IKg', '18小时快速检测试剂，符合国标要求', '["18小时出结果","符合国标"]', 'active', '2025-08-24T06:55:54.816Z', '2025-08-24T06:55:54.816Z'),
('prod003', '电热恒温培养箱', '电热恒温培养箱', '5qOA5rWL6K6+', '专业的恒温培养设备', '["恒温控制","稳定可靠"]', 'active', '2025-08-24T06:55:54.816Z', '2025-08-24T06:55:54.816Z');

-- 新闻文章表
INSERT INTO news_articles (id, slug, title, excerpt, content, author, publish_date, category, tags, featured) VALUES
('bmV3czE3NTYw', '2024年水质检测技术发展趋势', '2024年水质检测技术发展趋势', '随着环保要求的提高，水质检测技术不断发展...', '随着环保要求的提高，水质检测技术不断发展...', 'Assay Bio Team', '2024-03-01', '行业动态', '["技术发展","行业趋势"]', true),
('bmV3czE3NTYw', 'assay-bio参加国际环保展览会', 'Assay Bio参加国际环保展览会', '公司携最新检测设备参加2024国际环保展...', '公司携最新检测设备参加2024国际环保展...', 'Assay Bio Team', '2024-03-15', '公司动态', '["展览会","公司新闻"]', true);

-- 技术文档表
INSERT INTO documents (id, title, type, category, description, file_url, tags, publish_date) VALUES  
('ZG9jLTAxNzU2', 'DST技术应用指南', 'manual', '技术手册', 'DST技术详细应用指南', '', '["技术指南","检测技术"]', '2024-01-15'),
('ZG9jLTExNzU2', '水质检测标准规范', 'specification', '技术规范', '国家标准水质检测规范文件', '', '["国家标准","检测规范"]', '2024-02-01');

-- 页面表
INSERT INTO pages (id, slug, title, content, template, status) VALUES
('cGFnZS0wMTc1', '关于我们-assay-biotechnology', '关于我们 - Assay Biotechnology', 'Assay Biotechnology成立于2009年，专注于水中微生物检测技术...', 'about', 'published');
