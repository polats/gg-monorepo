/**
 * Platform types for multi-platform support
 */
export enum Platform {
  World = 'world',
  Reddit = 'reddit',
  Local = 'local',
}

export type PlatformType = Platform.World | Platform.Reddit | Platform.Local;

/**
 * User types
 */
export interface BaseUser {
  id: string;
  username: string;
  createdAt: Date;
}

export interface WorldUser extends BaseUser {
  platform: Platform.World;
  worldId: string;
  walletAddress?: string;
  verified: boolean;
}

export interface RedditUser extends BaseUser {
  platform: Platform.Reddit;
  redditUsername: string;
  subreddit?: string;
}

export type User = WorldUser | RedditUser;

/**
 * Game types
 */
export enum GameType {
  DiamondHands = 'diamond-hands',
  GoblinGardens = 'goblin-gardens',
}

export interface GameSession {
  id: string;
  userId: string;
  gameType: GameType;
  startedAt: Date;
  lastActiveAt: Date;
  platform: PlatformType;
}

/**
 * Authentication types
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  platform: PlatformType;
  isLoading: boolean;
}

export interface AuthToken {
  token: string;
  expiresAt: Date;
  userId: string;
}

/**
 * Common API response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Environment types
 */
export interface EnvironmentConfig {
  platform: PlatformType;
  isDevelopment: boolean;
  isProduction: boolean;
  apiBaseUrl?: string;
  features: {
    mockMode: boolean;
    debugMode: boolean;
  };
}

/**
 * Common utility types
 */
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

/**
 * Error types
 */
export enum ErrorCode {
  Unknown = 'UNKNOWN',
  Unauthorized = 'UNAUTHORIZED',
  NotFound = 'NOT_FOUND',
  ValidationError = 'VALIDATION_ERROR',
  NetworkError = 'NETWORK_ERROR',
  PlatformError = 'PLATFORM_ERROR',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}
