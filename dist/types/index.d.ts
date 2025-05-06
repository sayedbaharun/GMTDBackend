export { AuthenticatedRequest } from './express';
export declare enum OnboardingStep {
    NOT_STARTED = "not_started",
    BASIC_INFO = "basic_info",
    ADDITIONAL_DETAILS = "additional_details",
    PAYMENT = "payment",
    COMPLETED = "completed"
}
export declare enum BookingStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED",
    COMPLETED = "COMPLETED"
}
export declare enum PaymentStatus {
    UNPAID = "UNPAID",
    PAID = "PAID",
    REFUNDED = "REFUNDED"
}
export declare enum ConciergeRequestType {
    RESTAURANT = "RESTAURANT",
    ACTIVITY = "ACTIVITY",
    TRANSPORT = "TRANSPORT",
    SPECIAL_OCCASION = "SPECIAL_OCCASION",
    OTHER = "OTHER"
}
export declare enum ConciergeRequestStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare class ApiError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
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
    stripe_customer_id?: string;
    subscriptionId?: string;
    subscription_id?: string;
    subscriptionStatus?: string;
    subscription_status?: string;
    onboarding_step?: string;
    onboarding_complete?: boolean;
    phone_number?: string;
    company_name?: string;
    company_size?: string;
    referral_source?: string;
    updated_at?: string;
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
export declare enum StripeWebhookEvents {
    SUBSCRIPTION_CREATED = "customer.subscription.created",
    SUBSCRIPTION_UPDATED = "customer.subscription.updated",
    SUBSCRIPTION_DELETED = "customer.subscription.deleted",
    INVOICE_PAYMENT_SUCCEEDED = "invoice.payment_succeeded",
    INVOICE_PAYMENT_FAILED = "invoice.payment_failed"
}
