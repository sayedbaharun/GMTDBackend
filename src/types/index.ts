import * as express from 'express';
type Request = express.Request;

// Import the AuthenticatedRequest from express.ts
export { AuthenticatedRequest } from './express';

export enum OnboardingStep {
  NOT_STARTED = 'not_started',
  BASIC_INFO = 'basic_info',
  ADDITIONAL_DETAILS = 'additional_details',
  PAYMENT = 'payment',
  COMPLETED = 'completed',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export enum ConciergeRequestType {
  RESTAURANT = 'RESTAURANT',
  ACTIVITY = 'ACTIVITY',
  TRANSPORT = 'TRANSPORT',
  SPECIAL_OCCASION = 'SPECIAL_OCCASION',
  OTHER = 'OTHER',
}

export enum ConciergeRequestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  companyName?: string;
  industry?: string;
  companySize?: string;
  role?: string;
  goals?: string[];
  referralSource?: string;
  onboardingStep?: string;
  onboardingComplete?: boolean;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  updatedAt?: string;
}

export interface UserInfoPayload {
  fullName: string;
  email: string;
  phone_number?: string;
  company_name?: string;
}

export interface AdditionalDetailsPayload {
  industry?: string;
  company_size?: string;
  role?: string;
  goals?: string[];
  referral_source?: string;
}

export interface SubscriptionStatus {
  active: boolean;
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  subscription_id: string | null;
  product_name: string | null;
  price_id: string | null;
}

export enum StripeWebhookEvents {
  SUBSCRIPTION_CREATED = 'customer.subscription.created',
  SUBSCRIPTION_UPDATED = 'customer.subscription.updated',
  SUBSCRIPTION_DELETED = 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED = 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED = 'invoice.payment_failed'
}

// Travel Request types
export interface TravelRequest {
  id: string;
  userId: string;
  conversationId?: string;
  messageId?: string;
  status: TravelRequestStatus;
  requestType: TravelRequestType;
  description: string;
  requirementsSummary?: string;
  searchParams?: Record<string, any>;
  adminId?: string;
  priority: TravelRequestPriority;
  deadline?: Date;
  presentedOptions?: TravelOption[];
  selectedOptionId?: string;
  createdAt: Date;
  updatedAt: Date;
  relatedBookingId?: string;
}

export enum TravelRequestStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  OPTIONS_PRESENTED = 'OPTIONS_PRESENTED',
  BOOKED = 'BOOKED',
  CANCELLED = 'CANCELLED'
}

export enum TravelRequestType {
  FLIGHT = 'FLIGHT',
  HOTEL = 'HOTEL',
  CAR_RENTAL = 'CAR_RENTAL',
  YACHT = 'YACHT',
  RESTAURANT = 'RESTAURANT',
  TRANSPORTATION = 'TRANSPORTATION',
  PACKAGE = 'PACKAGE',
  OTHER = 'OTHER'
}

export enum TravelRequestPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface TravelOption {
  id: string;
  type: TravelRequestType;
  provider: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  details: Record<string, any>;
  availableUntil?: Date;
  thumbnailUrl?: string;
  externalId?: string;
}
