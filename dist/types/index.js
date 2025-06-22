"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelRequestPriority = exports.TravelRequestType = exports.TravelRequestStatus = exports.StripeWebhookEvents = exports.ApiError = exports.ConciergeRequestStatus = exports.ConciergeRequestType = exports.PaymentStatus = exports.BookingStatus = exports.OnboardingStep = void 0;
var OnboardingStep;
(function (OnboardingStep) {
    OnboardingStep["NOT_STARTED"] = "not_started";
    OnboardingStep["BASIC_INFO"] = "basic_info";
    OnboardingStep["ADDITIONAL_DETAILS"] = "additional_details";
    OnboardingStep["PAYMENT"] = "payment";
    OnboardingStep["COMPLETED"] = "completed";
})(OnboardingStep || (exports.OnboardingStep = OnboardingStep = {}));
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "PENDING";
    BookingStatus["CONFIRMED"] = "CONFIRMED";
    BookingStatus["CANCELLED"] = "CANCELLED";
    BookingStatus["COMPLETED"] = "COMPLETED";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["UNPAID"] = "UNPAID";
    PaymentStatus["PAID"] = "PAID";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var ConciergeRequestType;
(function (ConciergeRequestType) {
    ConciergeRequestType["RESTAURANT"] = "RESTAURANT";
    ConciergeRequestType["ACTIVITY"] = "ACTIVITY";
    ConciergeRequestType["TRANSPORT"] = "TRANSPORT";
    ConciergeRequestType["SPECIAL_OCCASION"] = "SPECIAL_OCCASION";
    ConciergeRequestType["OTHER"] = "OTHER";
})(ConciergeRequestType || (exports.ConciergeRequestType = ConciergeRequestType = {}));
var ConciergeRequestStatus;
(function (ConciergeRequestStatus) {
    ConciergeRequestStatus["PENDING"] = "PENDING";
    ConciergeRequestStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ConciergeRequestStatus["COMPLETED"] = "COMPLETED";
    ConciergeRequestStatus["CANCELLED"] = "CANCELLED";
})(ConciergeRequestStatus || (exports.ConciergeRequestStatus = ConciergeRequestStatus = {}));
class ApiError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ApiError';
    }
}
exports.ApiError = ApiError;
var StripeWebhookEvents;
(function (StripeWebhookEvents) {
    StripeWebhookEvents["SUBSCRIPTION_CREATED"] = "customer.subscription.created";
    StripeWebhookEvents["SUBSCRIPTION_UPDATED"] = "customer.subscription.updated";
    StripeWebhookEvents["SUBSCRIPTION_DELETED"] = "customer.subscription.deleted";
    StripeWebhookEvents["INVOICE_PAYMENT_SUCCEEDED"] = "invoice.payment_succeeded";
    StripeWebhookEvents["INVOICE_PAYMENT_FAILED"] = "invoice.payment_failed";
})(StripeWebhookEvents || (exports.StripeWebhookEvents = StripeWebhookEvents = {}));
var TravelRequestStatus;
(function (TravelRequestStatus) {
    TravelRequestStatus["PENDING"] = "PENDING";
    TravelRequestStatus["PROCESSING"] = "PROCESSING";
    TravelRequestStatus["OPTIONS_PRESENTED"] = "OPTIONS_PRESENTED";
    TravelRequestStatus["BOOKED"] = "BOOKED";
    TravelRequestStatus["CANCELLED"] = "CANCELLED";
})(TravelRequestStatus || (exports.TravelRequestStatus = TravelRequestStatus = {}));
var TravelRequestType;
(function (TravelRequestType) {
    TravelRequestType["FLIGHT"] = "FLIGHT";
    TravelRequestType["HOTEL"] = "HOTEL";
    TravelRequestType["CAR_RENTAL"] = "CAR_RENTAL";
    TravelRequestType["YACHT"] = "YACHT";
    TravelRequestType["RESTAURANT"] = "RESTAURANT";
    TravelRequestType["TRANSPORTATION"] = "TRANSPORTATION";
    TravelRequestType["PACKAGE"] = "PACKAGE";
    TravelRequestType["OTHER"] = "OTHER";
})(TravelRequestType || (exports.TravelRequestType = TravelRequestType = {}));
var TravelRequestPriority;
(function (TravelRequestPriority) {
    TravelRequestPriority["LOW"] = "LOW";
    TravelRequestPriority["NORMAL"] = "NORMAL";
    TravelRequestPriority["HIGH"] = "HIGH";
    TravelRequestPriority["URGENT"] = "URGENT";
})(TravelRequestPriority || (exports.TravelRequestPriority = TravelRequestPriority = {}));
//# sourceMappingURL=index.js.map