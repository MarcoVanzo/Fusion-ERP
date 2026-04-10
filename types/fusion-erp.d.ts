/**
 * Fusion ERP — Global Type Definitions
 * 
 * Ambient declarations for the global namespace used by the legacy JS codebase.
 * These allow TypeScript to understand globals without modifying existing code.
 */

// ─── API Response Types ─────────────────────────────────────────────────────

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    perPage?: number;
  };
}

// ─── User & Auth ────────────────────────────────────────────────────────────

interface User {
  id: number;
  email: string;
  role: 'admin' | 'manager' | 'allenatore' | 'operatore' | 'atleta' | 'readonly';
  fullName: string;
  tenant_id?: string;
  parent_user_id?: number | null;
  permissions: Record<string, 'read' | 'write' | 'none'>;
  athlete_id?: number | null;
}

// ─── Athlete ────────────────────────────────────────────────────────────────

interface Athlete {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  team_id?: number;
  status: 'active' | 'inactive' | 'injured' | 'suspended';
  position?: string;
  jersey_number?: number;
  photo_url?: string;
  created_at: string;
  updated_at?: string;
}

// ─── Team ───────────────────────────────────────────────────────────────────

interface Team {
  id: number;
  name: string;
  category?: string;
  season_id?: number;
  coach_id?: number;
  gender?: 'M' | 'F' | 'X';
  created_at: string;
}

// ─── Task ───────────────────────────────────────────────────────────────────

interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: number;
  due_date?: string;
  created_by: number;
  created_at: string;
  updated_at?: string;
}

// ─── Router ─────────────────────────────────────────────────────────────────

interface RouteConfig {
  path: string;
  file: string;
  init: string;
  icon?: string;
  minRole?: string;
  permission?: string;
  module?: boolean;
}

// ─── Store (API Client) ────────────────────────────────────────────────────

interface StoreOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: Record<string, unknown> | FormData;
  cache?: boolean;
  ttl?: number;
}

// ─── Global Window Extensions ──────────────────────────────────────────────

interface Window {
  App: {
    user: User | null;
    config: Record<string, unknown>;
    navigate: (path: string) => void;
    showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  };
  Store: {
    api: (endpoint: string, options?: StoreOptions) => Promise<ApiResponse>;
    get: (endpoint: string, options?: StoreOptions) => Promise<ApiResponse>;
    post: (endpoint: string, body?: Record<string, unknown>) => Promise<ApiResponse>;
    put: (endpoint: string, body?: Record<string, unknown>) => Promise<ApiResponse>;
    delete: (endpoint: string) => Promise<ApiResponse>;
    clearCache: () => void;
  };
  Router: {
    navigate: (path: string) => Promise<void>;
    current: () => string;
    register: (config: RouteConfig) => void;
  };
}
