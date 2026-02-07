/**
 * Classification Output Validation
 * Zod schemas for validating LLM classification responses
 */

import { z } from 'zod';

/**
 * Schema for service classification output
 */
export const ServiceClassificationSchema = z.object({
  service_type: z.string().min(1, 'Service type required'),
  urgency: z.enum(['low', 'medium', 'high', 'emergency']),
  confidence: z.number().min(0).max(1, 'Confidence must be between 0 and 1'),
  reasoning: z.string().min(1, 'Reasoning required'),
  estimated_duration_minutes: z.number().min(1, 'Duration must be at least 1 minute'),
});

export type ServiceClassification = z.infer<typeof ServiceClassificationSchema>;

/**
 * Allowed service types (enum for type safety)
 */
export enum ServiceType {
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  HVAC = 'hvac',
  PAINTING = 'painting',
  LOCKSMITH = 'locksmith',
  GLAZIER = 'glazier',
  ROOFING = 'roofing',
  CLEANING = 'cleaning',
  PEST_CONTROL = 'pest_control',
  APPLIANCE_REPAIR = 'appliance_repair',
  GARAGE_DOOR = 'garage_door',
  HANDYMAN = 'handyman',
  GENERAL_MAINTENANCE = 'general_maintenance',
}

/**
 * Urgency level enum
 */
export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EMERGENCY = 'emergency',
}

/**
 * Get urgency numeric score (for sorting, comparison)
 */
export function getUrgencyScore(urgency: UrgencyLevel): number {
  const scores: Record<UrgencyLevel, number> = {
    [UrgencyLevel.LOW]: 1,
    [UrgencyLevel.MEDIUM]: 2,
    [UrgencyLevel.HIGH]: 3,
    [UrgencyLevel.EMERGENCY]: 4,
  };
  return scores[urgency] || 0;
}

/**
 * Get urgency response time window (in hours)
 */
export function getUrgencyResponseWindow(urgency: UrgencyLevel): {
  min: number;
  max: number;
} {
  const windows: Record<UrgencyLevel, { min: number; max: number }> = {
    [UrgencyLevel.LOW]: { min: 24, max: 72 },
    [UrgencyLevel.MEDIUM]: { min: 4, max: 24 },
    [UrgencyLevel.HIGH]: { min: 1, max: 8 },
    [UrgencyLevel.EMERGENCY]: { min: 0, max: 2 },
  };
  return windows[urgency] || windows[UrgencyLevel.LOW];
}

/**
 * Validate a classification response
 */
export function validateClassification(
  data: unknown
): { valid: true; data: ServiceClassification } | { valid: false; error: string } {
  try {
    const validated = ServiceClassificationSchema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { valid: false, error: messages };
    }
    return { valid: false, error: 'Unknown validation error' };
  }
}

/**
 * Validate and parse JSON classification response
 */
export function parseAndValidateClassification(
  jsonString: string
): { valid: true; data: ServiceClassification } | { valid: false; error: string } {
  try {
    const data = JSON.parse(jsonString);
    return validateClassification(data);
  } catch (error) {
    return { valid: false, error: `Invalid JSON: ${String(error)}` };
  }
}

/**
 * Check if service type is valid
 */
export function isValidServiceType(serviceType: string): boolean {
  return Object.values(ServiceType).includes(serviceType as ServiceType);
}

/**
 * Check if urgency level is valid
 */
export function isValidUrgency(urgency: string): boolean {
  return Object.values(UrgencyLevel).includes(urgency as UrgencyLevel);
}

/**
 * Normalize service type (convert to enum value)
 */
export function normalizeServiceType(serviceType: string): ServiceType {
  const normalized = serviceType.toLowerCase().trim();
  if (isValidServiceType(normalized)) {
    return normalized as ServiceType;
  }
  // Try to find a fuzzy match
  for (const type of Object.values(ServiceType)) {
    if (type.includes(normalized) || normalized.includes(type)) {
      return type;
    }
  }
  // Default to general maintenance
  return ServiceType.GENERAL_MAINTENANCE;
}

/**
 * Normalize urgency level
 */
export function normalizeUrgency(urgency: string): UrgencyLevel {
  const normalized = urgency.toLowerCase().trim();
  if (isValidUrgency(normalized)) {
    return normalized as UrgencyLevel;
  }
  return UrgencyLevel.MEDIUM; // Default to medium
}

/**
 * Get service type display name
 */
export function getServiceTypeDisplayName(serviceType: ServiceType): string {
  const names: Record<ServiceType, string> = {
    [ServiceType.PLUMBING]: 'Plumbing',
    [ServiceType.ELECTRICAL]: 'Electrical',
    [ServiceType.HVAC]: 'HVAC & Heating/Cooling',
    [ServiceType.PAINTING]: 'Painting',
    [ServiceType.LOCKSMITH]: 'Locksmith',
    [ServiceType.GLAZIER]: 'Glazier',
    [ServiceType.ROOFING]: 'Roofing',
    [ServiceType.CLEANING]: 'Cleaning',
    [ServiceType.PEST_CONTROL]: 'Pest Control',
    [ServiceType.APPLIANCE_REPAIR]: 'Appliance Repair',
    [ServiceType.GARAGE_DOOR]: 'Garage Door',
    [ServiceType.HANDYMAN]: 'Handyman',
    [ServiceType.GENERAL_MAINTENANCE]: 'General Maintenance',
  };
  return names[serviceType] || serviceType;
}

/**
 * Get urgency display name with emoji
 */
export function getUrgencyDisplayName(urgency: UrgencyLevel): string {
  const names: Record<UrgencyLevel, string> = {
    [UrgencyLevel.LOW]: '⭕ Low',
    [UrgencyLevel.MEDIUM]: '🟡 Medium',
    [UrgencyLevel.HIGH]: '🔴 High',
    [UrgencyLevel.EMERGENCY]: '🚨 Emergency',
  };
  return names[urgency] || urgency;
}
