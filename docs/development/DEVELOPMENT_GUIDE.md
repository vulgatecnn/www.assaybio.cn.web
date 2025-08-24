# 开发指南

## 开发环境配置

### 必需工具
- Node.js 18+ 
- npm 9+
- Git
- VS Code (推荐)

### VS Code 插件推荐
- Vue - Official
- TypeScript Vue Plugin (Vetur)
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- Auto Rename Tag
- Bracket Pair Colorizer

## 编码规范

### Vue 组件开发

#### 1. 组件结构
```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup lang="ts">
// 导入
import { ref, computed, onMounted } from 'vue'
import type { ComponentProps } from './types'

// 接口定义
interface Props {
  title: string
  count?: number
}

// Props
const props = withDefaults(defineProps<Props>(), {
  count: 0
})

// Emits
const emit = defineEmits<{
  change: [value: string]
  update: [data: any]
}>()

// 响应式数据
const isLoading = ref(false)

// 计算属性
const displayTitle = computed(() => 
  `${props.title} (${props.count})`
)

// 方法
const handleClick = () => {
  emit('change', 'new-value')
}

// 生命周期
onMounted(() => {
  console.log('Component mounted')
})
</script>

<style scoped>
/* 组件样式 */
</style>
```

#### 2. 组件命名规范
- 组件文件：`PascalCase.vue` (例如：`UserProfile.vue`)
- 组件目录：使用小写加连字符 (例如：`user-profile/`)
- 组件内部使用：`<UserProfile />` 

#### 3. Props 定义
```typescript
// 推荐：使用 TypeScript 接口
interface Props {
  title: string
  isActive?: boolean
  items: Array<{
    id: string
    name: string
  }>
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false
})
```

### TypeScript 使用规范

#### 1. 类型定义
```typescript
// types/index.ts
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// 使用
import type { User, ApiResponse } from '@/types'
```

#### 2. API 接口定义
```typescript
// api/user.ts
import type { User, ApiResponse } from '@/types'

export const getUserList = async (): Promise<ApiResponse<User[]>> => {
  const response = await axios.get('/api/users')
  return response.data
}
```

### 样式开发规范

#### 1. Tailwind CSS 使用
```vue
<!-- 推荐：使用 Tailwind 实用类 -->
<div class="max-w-4xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold text-gray-900 mb-6">
    标题
  </h1>
  <p class="text-gray-600 leading-relaxed">
    内容
  </p>
</div>

<!-- 复杂样式：创建组件类 -->
<div class="card">
  <!-- 内容 -->
</div>

<style scoped>
.card {
  @apply bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow;
}
</style>
```

#### 2. 响应式设计断点
```css
/* Tailwind 默认断点 */
/* sm: 640px */
/* md: 768px */
/* lg: 1024px */
/* xl: 1280px */
/* 2xl: 1536px */

/* 移动优先设计 */
<div class="text-sm md:text-base lg:text-lg">
  响应式文本
</div>
```

### 状态管理规范

#### 1. Pinia Store 结构
```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import type { User } from '@/types'

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref<User | null>(null)
  const isLoading = ref(false)
  
  // Getters
  const isLoggedIn = computed(() => currentUser.value !== null)
  const userName = computed(() => currentUser.value?.name ?? '')
  
  // Actions
  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    try {
      const response = await api.login(credentials)
      currentUser.value = response.data.user
    } finally {
      isLoading.value = false
    }
  }
  
  const logout = () => {
    currentUser.value = null
  }
  
  return {
    // State
    currentUser,
    isLoading,
    // Getters  
    isLoggedIn,
    userName,
    // Actions
    login,
    logout
  }
})
```

### 路由配置规范

#### 1. 路由定义
```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/home/HomePage.vue'),
    meta: {
      title: '首页',
      requiresAuth: false
    }
  },
  {
    path: '/about',
    name: 'About', 
    component: () => import('@/views/about/AboutPage.vue'),
    meta: {
      title: '关于我们',
      requiresAuth: false
    }
  }
]
```

#### 2. 路由守卫
```typescript
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 上海安净生物技术有限公司`
  }
  
  // 权限检查
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
    return
  }
  
  next()
})
```

## 项目结构约定

### 1. 目录命名
```
src/
├── components/           # 通用组件
│   ├── common/          # 公共组件 (Button, Input 等)
│   ├── layout/          # 布局组件 (Header, Footer 等)
│   └── ui/              # UI组件 (Modal, Toast 等)
├── views/               # 页面组件  
│   ├── home/           # 首页相关
│   ├── about/          # 关于页面
│   └── products/       # 产品页面
├── api/                # API 接口
├── stores/             # Pinia 状态管理
├── composables/        # 组合式函数
├── utils/              # 工具函数
├── types/              # TypeScript 类型定义
└── assets/             # 静态资源
```

### 2. 文件命名约定
- 组件：`PascalCase.vue`
- 页面：`PageName.vue` 或 `page-name.vue`
- 工具函数：`camelCase.ts`
- 类型定义：`camelCase.ts` 或 `index.ts`
- 常量：`UPPER_SNAKE_CASE.ts`

## Git 工作流程

### 1. 分支命名
```bash
main                    # 主分支
develop                 # 开发分支
feature/user-login     # 功能分支
hotfix/fix-header-bug  # 修复分支
release/v1.0.0         # 发布分支
```

### 2. 提交规范
```bash
feat: 添加用户登录功能
fix: 修复头部导航样式问题
docs: 更新开发文档
style: 代码格式化
refactor: 重构用户组件
test: 添加单元测试
chore: 更新构建配置
```

### 3. Pull Request 流程
1. 从 develop 分支创建功能分支
2. 开发完成后推送到远程分支
3. 创建 Pull Request 到 develop 分支
4. 代码审查通过后合并
5. 删除功能分支

## 测试规范

### 1. 单元测试
```typescript
// tests/unit/components/Button.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import Button from '@/components/common/Button.vue'

describe('Button.vue', () => {
  it('renders properly', () => {
    const wrapper = mount(Button, {
      props: { 
        type: 'primary',
        text: '按钮文本'
      }
    })
    
    expect(wrapper.text()).toContain('按钮文本')
    expect(wrapper.classes()).toContain('btn-primary')
  })
  
  it('emits click event', async () => {
    const wrapper = mount(Button)
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
```

### 2. E2E 测试
```typescript
// tests/e2e/home.spec.ts
import { test, expect } from '@playwright/test'

test('home page loads correctly', async ({ page }) => {
  await page.goto('/')
  
  await expect(page).toHaveTitle(/上海安净生物技术有限公司/)
  await expect(page.getByRole('heading', { name: '专业水质检测' })).toBeVisible()
})
```

## 性能优化指南

### 1. 组件懒加载
```typescript
// 路由懒加载
const HomePage = () => import('@/views/home/HomePage.vue')

// 组件懒加载
const HeavyComponent = defineAsyncComponent(() => 
  import('@/components/HeavyComponent.vue')
)
```

### 2. 图片优化
```vue
<!-- 响应式图片 -->
<img 
  src="/images/logo.jpg"
  srcset="/images/logo@2x.jpg 2x"
  alt="公司Logo"
  loading="lazy"
  class="w-32 h-auto"
>

<!-- WebP 格式支持 -->
<picture>
  <source srcset="/images/hero.webp" type="image/webp">
  <img src="/images/hero.jpg" alt="首页图片">
</picture>
```

### 3. 代码分割
```typescript
// 按路由分割
const routes = [
  {
    path: '/products',
    component: () => import('@/views/products/ProductsPage.vue')
  }
]

// 按功能分割
const ChartComponent = defineAsyncComponent(() => 
  import('@/components/charts/ChartComponent.vue')
)
```

## 调试技巧

### 1. Vue DevTools
- 安装 Vue DevTools 浏览器扩展
- 查看组件树、状态、事件

### 2. 控制台调试
```typescript
// 开发环境调试
if (import.meta.env.DEV) {
  console.log('调试信息:', data)
}

// 条件断点
const debugUser = (user: User) => {
  if (user.role === 'admin') {
    debugger // 只有管理员用户时触发断点
  }
}
```

### 3. 错误处理
```typescript
// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Global error:', err, info)
  // 发送错误到监控服务
}

// 组件错误边界
onErrorCaptured((err, instance, info) => {
  console.error('Component error:', err, info)
  return false // 阻止错误继续传播
})
```

## 部署注意事项

### 1. 环境变量
```typescript
// .env.development
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_TITLE=安净生物（开发环境）

// .env.production  
VITE_API_BASE_URL=https://api.assaybio.cn
VITE_APP_TITLE=上海安净生物技术有限公司
```

### 2. 构建优化
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['@headlessui/vue', '@heroicons/vue']
        }
      }
    }
  }
})
```