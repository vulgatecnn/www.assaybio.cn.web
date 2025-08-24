/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_DESCRIPTION: string
  readonly VITE_COMPANY_NAME: string
  readonly VITE_COMPANY_EMAIL: string
  readonly VITE_COMPANY_PHONE: string
  readonly VITE_COMPANY_ADDRESS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}