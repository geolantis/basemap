// Type definitions for save functionality

export interface MapStyle {
  version: number;
  name?: string;
  metadata?: Record<string, any>;
  sources: Record<string, any>;
  layers: Array<any>;
  sprite?: string;
  glyphs?: string;
  bearing?: number;
  pitch?: number;
  center?: [number, number];
  zoom?: number;
  [key: string]: any;
}

export interface SaveResponse {
  success: boolean;
  styleId: string;
  url: string;
  message: string;
  metadata?: {
    name: string;
    description: string;
    category: string;
    isPublic: boolean;
    createdAt: string;
    modifiedAt: string;
    [key: string]: any;
  };
}

export interface SaveError extends Error {
  statusCode: number;
  code: string;
}

export interface SaveState {
  isLoading: boolean;
  error: string | null;
  lastSavedId: string | null;
  lastSavedAt: Date | null;
  isDirty: boolean;
  userStyles: UserStyle[];
}

export interface UserStyle {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  modifiedAt: string;
  url: string;
  thumbnail?: string;
  isPublic: boolean;
}

export interface SaveDialogOptions {
  name: string;
  description: string;
  category: string;
  isPublic: boolean;
  overwrite: boolean;
  tags?: string[];
}

export interface AuthToken {
  token: string;
  refreshToken?: string;
  expiresAt: number;
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}