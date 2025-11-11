/**
 * API Request/Response Types
 * 
 * TypeScript interfaces for API endpoints
 */

import type { ListingCategory } from '@/config/constants';

// ============================================
// Auth API
// ============================================
export interface WalletConnectRequest {
  signature: string;
  message: string;
  publicKey: string;
}

export interface WalletConnectResponse {
  success: boolean;
  wallet?: string;
  balance?: number;
  required?: number;
  error?: string;
}

export interface TOSAcceptRequest {
  accepted: boolean;
}

export interface TOSAcceptResponse {
  success: boolean;
  error?: string;
}

// ============================================
// Listings API
// ============================================
export interface CreateListingRequest {
  title: string;
  description: string;
  imageUrl: string;
  deliveryUrl: string;
  price: number;
  category: ListingCategory;
  demoVideoUrl?: string;
  whitepaperUrl?: string;
  githubUrl?: string;
}

export interface CreateListingResponse {
  success: boolean;
  listingId?: string;
  state?: string;
  error?: string;
}

export interface UpdateListingRequest extends Partial<CreateListingRequest> {}

export interface DeleteListingResponse {
  success: boolean;
  error?: string;
}

export interface ListingDetailResponse {
  success: boolean;
  listing?: any; // Full listing object
  error?: string;
}

export interface ListingsResponse {
  success: boolean;
  listings: any[];
  totalCount: number;
  page: number;
  perPage: number;
  error?: string;
}

// ============================================
// Purchase API
// ============================================
export interface PurchaseInitRequest {
  listingId: string;
}

export interface Payment402Response {
  statusCode: 402;
  recipient: string;
  amount: number;
  token: string;
  network: string;
  nonce: string;
}

export interface PurchaseSuccessResponse {
  success: true;
  deliveryUrl: string;
  txnHash: string;
}

export interface PurchaseErrorResponse {
  success: false;
  error: string;
  txnHash?: string;
}

export type PurchaseResponse = PurchaseSuccessResponse | PurchaseErrorResponse;

// ============================================
// Reports API
// ============================================
export interface ReportListingRequest {
  listingId: string;
  reason?: string;
}

export interface ReportListingResponse {
  success: boolean;
  error?: string;
}

// ============================================
// Upload API
// ============================================
export interface ImageUploadResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

// ============================================
// Admin API
// ============================================
export interface AdminLoginRequest {
  code: string;
  otp?: string;
}

export interface AdminLoginResponse {
  success: boolean;
  requiresOTP?: boolean;
  error?: string;
}

export interface AdminListingAction {
  action: 'approve' | 'pull' | 'assign_risk' | 'delete';
  listingId: string;
  riskLevel?: string;
}

export interface AdminListingActionResponse {
  success: boolean;
  error?: string;
}

// ============================================
// JWT Payloads
// ============================================
export interface UserJWTPayload {
  wallet: string;
  tosAccepted: boolean;
  exp: number;
  iat: number;
}

export interface AdminJWTPayload {
  isAdmin: true;
  exp: number;
  iat: number;
}

