/**
 * Business Metrics Logging
 * Tracks business-critical events: bookings, revenue, customer interactions
 */

import { getLogger } from "../logger";
import * as Sentry from "@sentry/nextjs";

const logger = getLogger("metrics:business");

/**
 * Business metrics events
 */
export enum BusinessMetricEvent {
  // Booking events
  BOOKING_CREATED = "booking.created",
  BOOKING_CONFIRMED = "booking.confirmed",
  BOOKING_CANCELLED = "booking.cancelled",
  BOOKING_RESCHEDULED = "booking.rescheduled",
  BOOKING_COMPLETED = "booking.completed",

  // Revenue events
  PAYMENT_RECEIVED = "payment.received",
  PAYMENT_FAILED = "payment.failed",
  REFUND_ISSUED = "refund.issued",

  // Customer events
  CUSTOMER_SIGNUP = "customer.signup",
  CUSTOMER_PROFILE_UPDATED = "customer.profile_updated",
  CUSTOMER_DELETED = "customer.deleted",

  // System events
  SERVICE_AVAILABILITY_CHANGED = "service.availability_changed",
  EXPERT_ASSIGNED = "expert.assigned",
  NOTIFICATION_SENT = "notification.sent",
}

interface BusinessMetricData {
  event: BusinessMetricEvent;
  timestamp: string;
  businessId?: number;
  customerId?: string;
  userId?: string;
  value?: number;
  currency?: string;
  metadata?: Record<string, any>;
}

/**
 * Log a business metric event
 */
export function logBusinessMetric(data: Omit<BusinessMetricData, "timestamp">) {
  const metric: BusinessMetricData = {
    ...data,
    timestamp: new Date().toISOString(),
  };

  // Structured log
  logger.info({
    msg: `Business Metric: ${data.event}`,
    event: data.event,
    businessId: data.businessId,
    customerId: data.customerId,
    value: data.value,
    currency: data.currency,
    ...data.metadata,
  });

  // Send to Sentry as transaction
  const transaction = Sentry.startTransaction({
    name: `business_metric.${data.event}`,
    op: "business_event",
  });

  if (transaction) {
    transaction.setData("metric", metric);
    transaction.finish();
  }
}

/**
 * BOOKING METRICS
 */

export function logBookingCreated(params: {
  bookingId: string;
  customerId?: string;
  businessId?: number;
  serviceType: string;
  technicianId?: number;
  bookingTime: string;
  estimatedDuration?: number;
}) {
  logBusinessMetric({
    event: BusinessMetricEvent.BOOKING_CREATED,
    businessId: params.businessId,
    customerId: params.customerId,
    metadata: {
      booking_id: params.bookingId,
      service_type: params.serviceType,
      technician_id: params.technicianId,
      booking_time: params.bookingTime,
      estimated_duration_minutes: params.estimatedDuration,
    },
  });
}

export function logBookingConfirmed(params: {
  bookingId: string;
  customerId?: string;
  businessId?: number;
  confirmationCode: string;
}) {
  logBusinessMetric({
    event: BusinessMetricEvent.BOOKING_CONFIRMED,
    businessId: params.businessId,
    customerId: params.customerId,
    metadata: {
      booking_id: params.bookingId,
      confirmation_code: params.confirmationCode,
    },
  });
}

export function logBookingCancelled(params: {
  bookingId: string;
  customerId?: string;
  businessId?: number;
  reason?: string;
  refundAmount?: number;
}) {
  logBusinessMetric({
    event: BusinessMetricEvent.BOOKING_CANCELLED,
    businessId: params.businessId,
    customerId: params.customerId,
    value: params.refundAmount,
    currency: params.refundAmount ? "USD" : undefined,
    metadata: {
      booking_id: params.bookingId,
      reason: params.reason,
    },
  });
}

export function logBookingRescheduled(params: {
  bookingId: string;
  originalTime: string;
  newTime: string;
  customerId?: string;
  businessId?: number;
}) {
  logBusinessMetric({
    event: BusinessMetricEvent.BOOKING_RESCHEDULED,
    businessId: params.businessId,
    customerId: params.customerId,
    metadata: {
      booking_id: params.bookingId,
      original_time: params.originalTime,
      new_time: params.newTime,
    },
  });
}

export function logBookingCompleted(params: {
  bookingId: string;
  customerId?: string;
  businessId?: number;
  serviceType: string;
  duration: number;
  rating?: number;
}) {
  logBusinessMetric({
    event: BusinessMetricEvent.BOOKING_COMPLETED,
    businessId: params.businessId,
    customerId: params.customerId,
    metadata: {
      booking_id: params.bookingId,
      service_type: params.serviceType,
      duration_minutes: params.duration,
      customer_rating: params.rating,
    },
  });
}

/**
 * REVENUE METRICS
 */

export function logPaymentReceived(params: {
  transactionId: string;
  amount: number;
  currency?: string;
  businessId?: number;
  customerId?: string;
  bookingId?: string;
}) {
  logBusinessMetric({
    event: BusinessMetricEvent.PAYMENT_RECEIVED,
    businessId: params.businessId,
    customerId: params.customerId,
    value: params.amount,
    currency: params.currency || "USD",
    metadata: {
      transaction_id: params.transactionId,
      booking_id: params.bookingId,
    },
  });

  // Log revenue in analytics
  Sentry.setContext("revenue_event", {
    amount: params.amount,
    currency: params.currency || "USD",
    transaction_id: params.transactionId,
  });
}

export function logPaymentFailed(params: {
  transactionId: string;
  amount: number;
  currency?: string;
  businessId?: number;
  customerId?: string;
  reason?: string;
}) {
  logBusinessMetric({
    event: BusinessMetricEvent.PAYMENT_FAILED,
    businessId: params.businessId,
    customerId: params.customerId,
    value: params.amount,
    currency: params.currency || "USD",
    metadata: {
      transaction_id: params.transactionId,
      reason: params.reason,
    },
  });

  // Alert on payment failures
  logger.error({
    msg: "Payment failed",
    transaction_id: params.transactionId,
    amount: params.amount,
    reason: params.reason,
  });
}

export function logRefundIssued(params: {
  refundId: string;
  amount: number;
  currency?: string;
  businessId?: number;
  customerId?: string;
  bookingId?: string;
  reason?: string;
}) {
  logBusinessMetric({
    event: BusinessMetricEvent.REFUND_ISSUED,
    businessId: params.businessId,
    customerId: params.customerId,
    value: -params.amount, // Negative for refund
    currency: params.currency || "USD",
    metadata: {
      refund_id: params.refundId,
      booking_id: params.bookingId,
      reason: params.reason,
    },
  });
}

/**
 * CUSTOMER METRICS
 */

export function logCustomerSignup(params: {
  customerId: string;
  email?: string;
  signupSource?: string;
  businessId?: number;
}) {
  logBusinessMetric({
    event: BusinessMetricEvent.CUSTOMER_SIGNUP,
    businessId: params.businessId,
    customerId: params.customerId,
    metadata: {
      email: params.email,
      signup_source: params.signupSource,
    },
  });
}

export function logCustomerProfileUpdated(params: {
  customerId: string;
  businessId?: number;
  changedFields?: string[];
}) {
  logBusinessMetric({
    event: BusinessMetricEvent.CUSTOMER_PROFILE_UPDATED,
    businessId: params.businessId,
    customerId: params.customerId,
    metadata: {
      changed_fields: params.changedFields,
    },
  });
}

/**
 * SYSTEM METRICS
 */

export function logServiceAvailabilityChanged(params: {
  serviceType: string;
  businessId?: number;
  newStatus: "available" | "unavailable";
  reason?: string;
}) {
  logBusinessMetric({
    event: BusinessMetricEvent.SERVICE_AVAILABILITY_CHANGED,
    businessId: params.businessId,
    metadata: {
      service_type: params.serviceType,
      new_status: params.newStatus,
      reason: params.reason,
    },
  });
}

export function logExpertAssigned(params: {
  bookingId: string;
  technicianId: number;
  businessId?: number;
  customerId?: string;
  serviceType?: string;
}) {
  logBusinessMetric({
    event: BusinessMetricEvent.EXPERT_ASSIGNED,
    businessId: params.businessId,
    customerId: params.customerId,
    metadata: {
      booking_id: params.bookingId,
      technician_id: params.technicianId,
      service_type: params.serviceType,
    },
  });
}

export function logNotificationSent(params: {
  notificationType: "email" | "sms" | "push";
  recipientId: string;
  businessId?: number;
  customerId?: string;
  relatedBookingId?: string;
  success: boolean;
}) {
  logBusinessMetric({
    event: BusinessMetricEvent.NOTIFICATION_SENT,
    businessId: params.businessId,
    customerId: params.customerId,
    metadata: {
      notification_type: params.notificationType,
      recipient_id: params.recipientId,
      related_booking_id: params.relatedBookingId,
      success: params.success,
    },
  });
}

/**
 * Get business metrics summary (dashboard data)
 */
export interface BusinessMetricsSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  bookings: {
    created: number;
    confirmed: number;
    cancelled: number;
    completed: number;
  };
  revenue: {
    total: number;
    received: number;
    failed: number;
    refunded: number;
  };
  customers: {
    total: number;
    new: number;
    active: number;
  };
}

/**
 * Aggregate metrics for dashboard
 * In production, these would come from a time-series database
 */
export async function getBusinessMetricsSummary(
  businessId: number,
  period: "day" | "week" | "month" = "month"
): Promise<BusinessMetricsSummary> {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case "day":
      startDate.setDate(startDate.getDate() - 1);
      break;
    case "week":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
  }

  // TODO: Query from metrics database
  // For now, return template
  return {
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    bookings: {
      created: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
    },
    revenue: {
      total: 0,
      received: 0,
      failed: 0,
      refunded: 0,
    },
    customers: {
      total: 0,
      new: 0,
      active: 0,
    },
  };
}
