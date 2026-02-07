/**
 * Base Response Templates for Different Service Types & Urgency Levels
 * Provides service-specific response templates based on classification
 *
 * This file now imports from service-specific template files for maintainability.
 * See src/lib/response-generator/templates/ for individual service templates.
 */

import { getServiceTemplates } from './templates';

export interface BaseResponse {
  service_type: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  is_repeat_customer: boolean;
  template: string;
  tone: 'professional' | 'casual';
  next_action: string;
}

/**
 * Get base response template for a service request
 * Combines service type, urgency, and customer history
 */
export function getBaseResponse(
  service_type: string,
  urgency: 'low' | 'medium' | 'high' | 'emergency',
  is_repeat_customer: boolean
): BaseResponse {
  const templates = getServiceTemplates(service_type);
  const urgencyTemplates = templates[urgency] || templates.medium;
  const template = is_repeat_customer ? urgencyTemplates.repeat : urgencyTemplates.new;

  return {
    service_type,
    urgency,
    is_repeat_customer,
    template,
    tone: getTone(urgency),
    next_action: getNextAction(service_type, urgency),
  };
}

/**
 * Determine appropriate tone based on urgency
 */
function getTone(urgency: 'low' | 'medium' | 'high' | 'emergency'): 'professional' | 'casual' {
  if (urgency === 'emergency') return 'professional';
  if (urgency === 'high') return 'professional';
  return 'casual';
}

/**
 * Determine next action based on service and urgency
 */
function getNextAction(service_type: string, urgency: 'low' | 'medium' | 'high' | 'emergency'): string {
  if (urgency === 'emergency') {
    return 'request_immediate_scheduling';
  }
  if (urgency === 'high') {
    return 'request_scheduling_within_24h';
  }
  return 'ask_preferred_scheduling';
}
