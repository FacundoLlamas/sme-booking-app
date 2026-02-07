/**
 * Google Analytics 4 Integration
 * Tracks user flows, booking funnels, and custom events
 */

/**
 * Initialize Google Analytics 4
 * Call this in your app layout or _document file
 */
export function initGoogleAnalytics(measurementId: string) {
  if (typeof window === "undefined") {
    return;
  }

  // Load gtag script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize gtag function
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(arguments);
  }
  (window as any).gtag = gtag;
  gtag("js", new Date());
  gtag("config", measurementId, {
    page_path: window.location.pathname,
    anonymize_ip: true,
  });
}

/**
 * Get gtag function for tracking
 */
function getGtag() {
  return (window as any).gtag;
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string) {
  const gtag = getGtag();
  if (!gtag) return;

  gtag("event", "page_view", {
    page_path: path,
    page_title: title || document.title,
  });
}

/**
 * Track custom event
 */
export function trackEvent(
  eventName: string,
  eventData?: Record<string, any>
) {
  const gtag = getGtag();
  if (!gtag) return;

  gtag("event", eventName, eventData);
}

/**
 * BOOKING FLOW TRACKING
 */

/**
 * Track when user starts chat
 */
export function trackChatStarted(params?: {
  service_type?: string;
  conversation_id?: string;
}) {
  trackEvent("chat_started", {
    event_category: "booking",
    event_label: "chat_flow_initiated",
    ...params,
  });
}

/**
 * Track when user navigates to booking form
 */
export function trackBookingFormOpened(params?: {
  service_type?: string;
  source?: string;
}) {
  trackEvent("booking_form_opened", {
    event_category: "booking",
    event_label: "booking_form_start",
    ...params,
  });
}

/**
 * Track when user completes a booking step (multi-step form)
 */
export function trackBookingStepCompleted(step: number, totalSteps: number) {
  trackEvent("booking_step_completed", {
    event_category: "booking",
    event_label: `step_${step}_of_${totalSteps}`,
    step_number: step,
    total_steps: totalSteps,
    progress_percent: Math.round((step / totalSteps) * 100),
  });
}

/**
 * Track when user creates a booking
 */
export function trackBookingCreated(params: {
  booking_id: string;
  confirmation_code: string;
  service_type: string;
  booking_time: string;
  customer_id?: string;
  business_id?: number;
}) {
  trackEvent("booking_created", {
    event_category: "booking",
    event_label: "booking_confirmed",
    value: 1, // Can be replaced with booking price
    transaction_id: params.booking_id,
    currency: "USD",
    ...params,
  });
}

/**
 * Track when user confirms booking
 */
export function trackBookingConfirmed(params: {
  booking_id: string;
  confirmation_code: string;
  service_type: string;
}) {
  trackEvent("booking_confirmed", {
    event_category: "booking",
    event_label: "customer_confirmation",
    transaction_id: params.booking_id,
    ...params,
  });
}

/**
 * Track when user cancels booking
 */
export function trackBookingCancelled(params: {
  booking_id: string;
  service_type: string;
  reason?: string;
}) {
  trackEvent("booking_cancelled", {
    event_category: "booking",
    event_label: "booking_cancellation",
    ...params,
  });
}

/**
 * Track when user reschedules booking
 */
export function trackBookingRescheduled(params: {
  booking_id: string;
  original_time: string;
  new_time: string;
  service_type: string;
}) {
  trackEvent("booking_rescheduled", {
    event_category: "booking",
    event_label: "booking_modification",
    ...params,
  });
}

/**
 * FUNNEL TRACKING
 */

/**
 * Track funnel steps: chat → booking → confirmation → dashboard
 */
export function trackFunnelStep(
  step: "chat_start" | "booking_form" | "booking_created" | "confirmation" | "dashboard",
  value?: Record<string, any>
) {
  const labels: Record<string, string> = {
    chat_start: "Step 1: Chat Initiated",
    booking_form: "Step 2: Booking Form",
    booking_created: "Step 3: Booking Created",
    confirmation: "Step 4: Confirmation",
    dashboard: "Step 5: Dashboard",
  };

  trackEvent("funnel_step", {
    event_category: "funnel",
    event_label: labels[step],
    funnel_step: step,
    ...value,
  });
}

/**
 * Track funnel drop-off
 */
export function trackFunnelDropoff(
  fromStep: string,
  toStep: string,
  reason?: string
) {
  trackEvent("funnel_dropoff", {
    event_category: "funnel",
    event_label: `dropoff_${fromStep}_to_${toStep}`,
    from_step: fromStep,
    to_step: toStep,
    reason,
  });
}

/**
 * USER INTERACTION TRACKING
 */

/**
 * Track form submission error
 */
export function trackFormError(formName: string, fieldName: string, errorType: string) {
  trackEvent("form_error", {
    event_category: "form",
    event_label: `${formName}_${fieldName}`,
    form_name: formName,
    field_name: fieldName,
    error_type: errorType,
  });
}

/**
 * Track API error
 */
export function trackAPIError(
  endpoint: string,
  statusCode: number,
  errorType: string
) {
  trackEvent("api_error", {
    event_category: "error",
    event_label: `${endpoint}_${statusCode}`,
    endpoint,
    status_code: statusCode,
    error_type: errorType,
  });
}

/**
 * Track user engagement metric
 */
export function trackEngagement(
  engagementType: "click" | "scroll" | "view" | "interaction",
  params?: Record<string, any>
) {
  trackEvent("user_engagement", {
    event_category: "engagement",
    engagement_type: engagementType,
    ...params,
  });
}

/**
 * CUSTOM EVENTS
 */

/**
 * Track exception (non-fatal error)
 */
export function trackException(
  description: string,
  fatal: boolean = false
) {
  trackEvent("exception", {
    description,
    fatal,
  });
}

/**
 * Track video/content view
 */
export function trackContentView(
  contentType: string,
  contentTitle: string,
  contentId?: string
) {
  trackEvent("view_item", {
    content_type: contentType,
    content_title: contentTitle,
    content_id: contentId,
  });
}

/**
 * Track search
 */
export function trackSearch(searchTerm: string, resultsCount?: number) {
  trackEvent("search", {
    search_term: searchTerm,
    results_count: resultsCount,
  });
}

/**
 * Set user properties
 */
export function setUserProperties(userId: string, properties: {
  customer_id?: string;
  business_id?: number;
  service_type?: string;
  user_role?: string;
  signup_source?: string;
}) {
  const gtag = getGtag();
  if (!gtag) return;

  gtag("config", {
    user_id: userId,
    custom_map: {
      dimension1: "customer_id",
      dimension2: "business_id",
      dimension3: "service_type",
      dimension4: "user_role",
      dimension5: "signup_source",
    },
  });

  gtag("event", "user_properties", {
    customer_id: properties.customer_id,
    business_id: properties.business_id,
    service_type: properties.service_type,
    user_role: properties.user_role,
    signup_source: properties.signup_source,
  });
}

/**
 * Get GA4 client ID (for server-side integration)
 */
export async function getAnalyticsClientId(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const response = await fetch("/__/firebase/init.json");
    return response.text();
  } catch {
    return null;
  }
}
