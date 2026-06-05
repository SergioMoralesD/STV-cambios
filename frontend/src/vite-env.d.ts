/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_BACKEND_URL_PROD?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DEV_BYPASS_AUTH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
