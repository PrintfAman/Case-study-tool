/// <reference types="vite/client" />

/**
 * TYPED ENVIRONMENT VARIABLES
 * ---------------------------
 * Vite exposes env vars to browser code only if they start with `VITE_`.
 * That prefix is a safety feature: anything without it (like a Groq or Tavily
 * key) stays on the server and is never bundled into JavaScript a user could
 * read in DevTools.
 *
 * Declaring them here gives autocomplete and a compile error on typos, instead
 * of a silent `undefined` at runtime.
 */
interface ImportMetaEnv {
  /** Full base URL of the backend API, e.g. http://localhost:5000/api/v1 */
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
