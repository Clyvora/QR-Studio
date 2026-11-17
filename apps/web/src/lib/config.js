/** Public links. Override at build time with VITE_* environment variables. */
export const REPO_URL = import.meta.env.VITE_REPO_URL || "https://github.com/Clyvora/QRCODE";
export const DOCS_URL = import.meta.env.VITE_DOCS_URL || "https://github.com/Clyvora/QRCODE/tree/main/apps/docs";
/** This demo runs as a browser-only tool unless a server is explicitly enabled. */
export const STATIC_ONLY = import.meta.env.VITE_STATIC_ONLY !== "false";
export const VERSION = "0.1.0";
