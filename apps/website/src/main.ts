import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from './router'

// 导入全局样式
import './assets/styles/main.css'

// 导入语言文件
import zhCN from './locales/zh-CN.json'
import en from './locales/en.json'

// 导入SEO工具
import { defaultSEO, updateSEO, optimizePageLoad, setPageLanguage, preloadCriticalResources } from './utils/seo'

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en',
  messages: {
    'zh-CN': zhCN,
    en: en,
  },
})

// 初始化SEO优化
optimizePageLoad()
setPageLanguage('zh-CN')
preloadCriticalResources()
updateSEO(defaultSEO)

// 创建应用实例
const app = createApp(App)

// 安装插件
app.use(createPinia())
app.use(router)
app.use(i18n)

// 挂载应用
app.mount('#app')