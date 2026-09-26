// Single source of truth for all fetch calls — must match docs/API_CONTRACT.md
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";
