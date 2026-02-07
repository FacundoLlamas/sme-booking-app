/**
 * Shared Response Formatting Utilities
 * 
 * Centralizes response generation logic used across multiple chat endpoints.
 * Eliminates code duplication and ensures consistent response formatting.
 */

/**
 * Classification data structure
 */
interface ClassificationData {
  service_type: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  confidence: number;
  reasoning?: string;
  estimated_duration_minutes?: number;
}

/**
 * Generate formatted chat response for non-streaming endpoint
 * Used by: POST /api/v1/chat
 * 
 * Returns a structured response with emoji, urgency message, and next steps.
 */
export function formatChatResponse(classification: ClassificationData): string {
  const { service_type, urgency, confidence, estimated_duration_minutes } = classification;

  const confidentText = confidence > 0.8 ? 'I understand' : 'It sounds like';
  const estimatedTime =
    estimated_duration_minutes && estimated_duration_minutes > 0
      ? ` This typically takes about ${Math.round(estimated_duration_minutes / 60)} hour${
          Math.round(estimated_duration_minutes / 60) !== 1 ? 's' : ''
        }.`
      : '';

  const urgencyEmoji = {
    emergency: '🚨',
    high: '⚠️',
    medium: '📋',
    low: '✅',
  }[urgency] || '📋';

  const urgencyMessage = {
    emergency: 'This appears to be an emergency. We will prioritize your booking.',
    high: 'This is marked as high priority. We will schedule you as soon as possible.',
    medium: 'This is a standard priority request.',
    low: 'This is a lower priority request.',
  }[urgency];

  return `${urgencyEmoji} ${confidentText} you need a **${service_type}** service. ${urgencyMessage}${estimatedTime}

To proceed with booking, please:
1. Confirm your preferred service date and time
2. Provide your location
3. Share any additional details or special requirements

Our team will contact you shortly to finalize your booking.`;
}

/**
 * Generate response text for streaming endpoint
 * Used by: POST /api/v1/chat/stream
 * 
 * Returns a continuous prose response suitable for streaming token-by-token.
 * Note: This is simulated streaming. Real Claude API supports streaming via AsyncIterator.
 * The 10-50ms inter-token delay is for UX purposes, not actual LLM streaming.
 * When integrated with real LLM, use: `for await (const event of response) { ... }`
 */
export function formatStreamResponse(classification: ClassificationData): string {
  const { service_type, urgency, estimated_duration_minutes } = classification;

  const urgencyMessages = {
    emergency: 'EMERGENCY PRIORITY: This will be treated as an urgent matter.',
    high: 'High Priority: We will prioritize this booking.',
    medium: 'Standard Priority: We will process this booking normally.',
    low: 'Low Priority: We will schedule this at your convenience.',
  };

  const serviceMessage = `We have identified your need as: ${service_type}.`;
  const priorityMessage =
    urgencyMessages[urgency as keyof typeof urgencyMessages] || urgencyMessages.medium;

  const durationMessage =
    estimated_duration_minutes && estimated_duration_minutes > 0
      ? ` Expected duration: approximately ${Math.round(estimated_duration_minutes / 60)} hour${
          Math.round(estimated_duration_minutes / 60) !== 1 ? 's' : ''
        }.`
      : '';

  const nextSteps = [
    'Confirm your preferred date and time.',
    'Provide the location for the service.',
    'Share any special requirements or notes.',
    'Agree to the estimated pricing and schedule.',
  ].join(' ');

  return `${serviceMessage} ${priorityMessage}${durationMessage} To proceed, please: ${nextSteps} Our team will be in touch shortly to confirm all details and finalize your booking. Thank you for choosing our service!`;
}

/**
 * Generate next steps for conversation flow
 * 
 * Returns an array of actionable next steps based on service type and urgency.
 */
export function formatNextSteps(serviceType: string, urgency: string): string[] {
  const baseSteps = [
    'Confirm service date and time',
    'Provide service location',
    'Add any special notes or requirements',
  ];

  if (urgency === 'emergency') {
    baseSteps.unshift('Priority dispatch to location');
  }

  if (serviceType.includes('paint') || serviceType.includes('design')) {
    baseSteps.push('Schedule color consultation');
  }

  if (serviceType.includes('electrical') || serviceType.includes('plumb')) {
    baseSteps.push('Pre-visit inspection estimate');
  }

  return baseSteps.slice(0, 4); // Return max 4 next steps
}
