/**
 * Prompt Builder for LLM-based Response Generation
 * Constructs detailed prompts for Claude based on conversation context
 */

import { ServiceClassification } from '@/lib/llm/__mocks__/mock-claude';

export interface ConversationContext {
  // Customer info
  customerId?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  
  // Conversation tracking
  conversationId?: number;
  
  // Business context
  businessId?: number;
  serviceId?: number;
  
  // Service info
  service_classification: ServiceClassification;
  conversation_history: ConversationMessage[];
  available_experts?: ExpertInfo[];
  customer_repeat_count?: number;
}

export interface ConversationMessage {
  role: 'customer' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ExpertInfo {
  id: string;
  name: string;
  specialties: string[];
  availability_score: number; // 0-100
  customer_rating?: number; // 0-5 stars
}

export interface PromptConfig {
  include_expert_info: boolean;
  include_scheduling_urgency: boolean;
  tone: 'professional' | 'casual' | 'auto';
  max_response_length: number;
  include_follow_up_suggestion: boolean;
}

/**
 * Build a comprehensive prompt for response generation
 */
export function buildResponseGenerationPrompt(
  context: ConversationContext,
  config: PromptConfig = DEFAULT_CONFIG
): string {
  const systemPrompt = buildSystemPrompt(context);
  const contextPrompt = buildContextPrompt(context, config);
  const instructionPrompt = buildInstructionPrompt(context, config);

  return `${systemPrompt}

${contextPrompt}

${instructionPrompt}`;
}

/**
 * Default configuration for prompt generation
 */
const DEFAULT_CONFIG: PromptConfig = {
  include_expert_info: true,
  include_scheduling_urgency: true,
  tone: 'auto',
  max_response_length: 500,
  include_follow_up_suggestion: true,
};

/**
 * Build the system prompt that defines assistant behavior
 */
function buildSystemPrompt(context: ConversationContext): string {
  const { service_classification, customer_repeat_count = 0 } = context;
  const is_emergency = service_classification.urgency === 'emergency';
  const is_repeat_customer = customer_repeat_count > 0;

  let systemPrompt = `You are a helpful customer service assistant for an SME service booking company. 
Your role is to understand service requests, provide empathetic responses, and guide customers toward booking appointments.

Service Context:
- Service Type: ${service_classification.service_type}
- Urgency Level: ${service_classification.urgency.toUpperCase()}
- Confidence: ${(service_classification.confidence * 100).toFixed(1)}%
- Estimated Duration: ${service_classification.estimated_duration_minutes || '?'} minutes
`;

  if (is_emergency) {
    systemPrompt += `
⚠️ EMERGENCY MODE: Prioritize rapid response. Gather critical information quickly and escalate immediately.
Focus on: Immediate safety, rapid dispatch, minimal information gathering.`;
  }

  if (is_repeat_customer) {
    systemPrompt += `
✓ RETURNING CUSTOMER: Personalize the experience. Reference past interactions, remember preferences.
Tone: Warm and familiar.`;
  } else {
    systemPrompt += `
✓ NEW CUSTOMER: Build trust and set expectations. Be clear about process and timeline.
Tone: Professional and reassuring.`;
  }

  systemPrompt += `

Guidelines:
1. Be empathetic to the customer's situation
2. Keep responses concise and actionable (under ${DEFAULT_CONFIG.max_response_length} words)
3. Ask targeted questions to gather missing information
4. Avoid repetition - don't ask for information already provided
5. Guide naturally toward scheduling when appropriate
6. Be honest about availability and limitations
7. Use clear, simple language`;

  return systemPrompt;
}

/**
 * Build context prompt with conversation history and relevant data
 */
function buildContextPrompt(context: ConversationContext, config: PromptConfig): string {
  let prompt = '## Conversation History\n';

  if (context.conversation_history.length > 0) {
    context.conversation_history.forEach((msg) => {
      const role = msg.role === 'customer' ? 'Customer' : 'Assistant';
      prompt += `\n${role}:\n${msg.content}\n`;
    });
  } else {
    prompt += 'No prior messages - this is the initial inquiry.\n';
  }

  // Add customer info if available
  if (context.customer_name || context.customer_phone || context.customer_email) {
    prompt += '\n## Customer Information\n';
    if (context.customer_name) prompt += `- Name: ${context.customer_name}\n`;
    if (context.customer_phone) prompt += `- Phone: ${context.customer_phone}\n`;
    if (context.customer_email) prompt += `- Email: ${context.customer_email}\n`;
  }

  // Add expert info if available and requested
  if (
    config.include_expert_info &&
    context.available_experts &&
    context.available_experts.length > 0
  ) {
    prompt += '\n## Available Experts\n';
    context.available_experts.slice(0, 3).forEach((expert) => {
      const rating = expert.customer_rating ? ` (${expert.customer_rating.toFixed(1)}★)` : '';
      prompt += `- ${expert.name}${rating}: ${expert.specialties.join(', ')}\n`;
    });
  }

  // Add scheduling context if urgent
  if (config.include_scheduling_urgency && context.service_classification.urgency === 'emergency') {
    prompt += '\n## Scheduling Context\n';
    prompt += 'URGENT: Customer needs immediate service. Prioritize availability within the next 1-2 hours.\n';
  }

  return prompt;
}

/**
 * Build instruction prompt for desired response format
 */
function buildInstructionPrompt(context: ConversationContext, config: PromptConfig): string {
  let prompt = '## Your Response\n\n';

  const urgency = context.service_classification.urgency;

  if (urgency === 'emergency') {
    prompt += `Provide an immediate, empathetic response that:
1. Acknowledges the emergency
2. Asks 1-2 critical questions only (safety/location)
3. Offers immediate next steps (e.g., "I'm connecting you with an available technician now")
4. Ensures customer feels heard and helped
Keep it under 150 words - speed matters.

`;
  } else if (urgency === 'high') {
    prompt += `Provide a responsive message that:
1. Acknowledges the issue with urgency
2. Shows understanding of the service need
3. Asks 2-3 clarifying questions
4. Suggests scheduling options for today/tomorrow
5. Maintains professional tone
Keep it under ${config.max_response_length} words.

`;
  } else {
    prompt += `Provide a helpful and friendly message that:
1. Thanks the customer for reaching out
2. Shows understanding of their service need
3. Asks 2-3 relevant follow-up questions
4. Provides flexibility on timing
5. Maintains conversation flow
Keep it under ${config.max_response_length} words.

`;
  }

  if (config.include_follow_up_suggestion) {
    prompt += 'After your response, suggest a follow-up topic if needed (e.g., "Get address information", "Suggest scheduling times").\n';
  }

  return prompt;
}

/**
 * Build a prompt for classification clarification
 * Used when confidence is low or service is ambiguous
 */
export function buildClarificationPrompt(
  user_input: string,
  classification: ServiceClassification
): string {
  return `The customer provided this input: "${user_input}"

I initially classified this as: ${classification.service_type} (${(classification.confidence * 100).toFixed(1)}% confidence)

Is this classification correct? If not, what service type do you think they need?
If correct, provide clarifying follow-up questions that would help narrow down what the customer really needs.

Keep your response focused and concise.`;
}

/**
 * Build a prompt for scheduling suggestion
 * Used to generate time slot recommendations
 */
export function buildSchedulingSuggestionPrompt(
  context: ConversationContext,
  available_slots: SchedulingSlot[]
): string {
  const { service_classification, customer_name = 'the customer' } = context;

  return `For ${customer_name} who needs ${service_classification.service_type} service (${service_classification.urgency} urgency), 
I have these available appointment slots:

${available_slots.map((slot) => `- ${slot.date_time.toLocaleString()}: ${slot.expert_name} (${slot.duration_minutes} min)`).join('\n')}

Based on the ${service_classification.urgency} urgency, which slots would be most appropriate?
For emergency/high urgency, prioritize earliest slots.
For medium/low urgency, offer a mix of times.

Provide a brief explanation for your recommendations.`;
}

export interface SchedulingSlot {
  slot_id: string;
  date_time: Date;
  expert_name: string;
  duration_minutes: number;
}

/**
 * Extract key information needed from conversation
 * Returns what's missing vs what's been provided
 */
export function extractConversationRequirements(
  context: ConversationContext
): { provided: string[]; missing: string[] } {
  const provided: string[] = [];
  const missing: string[] = [];

  // Check service info
  if (context.service_classification.service_type) {
    provided.push('service_type');
  } else {
    missing.push('service_type');
  }

  // Check customer contact info
  if (context.customer_phone) {
    provided.push('customer_phone');
  } else {
    missing.push('customer_phone');
  }

  if (context.customer_name) {
    provided.push('customer_name');
  } else {
    missing.push('customer_name');
  }

  if (context.customer_email) {
    provided.push('customer_email');
  } else {
    missing.push('customer_email');
  }

  // Check scheduling preference (indicated by conversation context)
  const hasSchedulingMention =
    context.conversation_history.some(
      (msg) =>
        msg.content.toLowerCase().includes('time') ||
        msg.content.toLowerCase().includes('when') ||
        msg.content.toLowerCase().includes('schedule') ||
        msg.content.toLowerCase().includes('available')
    ) || context.service_classification.urgency === 'emergency';

  if (hasSchedulingMention) {
    provided.push('scheduling_preference');
  } else {
    missing.push('scheduling_preference');
  }

  return { provided, missing };
}

/**
 * Determine if enough information has been gathered to suggest scheduling
 */
export function shouldSuggestScheduling(context: ConversationContext): boolean {
  const { provided, missing } = extractConversationRequirements(context);

  // Always suggest for emergency
  if (context.service_classification.urgency === 'emergency') {
    return missing.length === 0 || missing.length <= 1;
  }

  // For non-emergency, need at least: service type, phone, scheduling preference
  const essentialMissing = missing.filter(
    (m) => !['customer_name', 'customer_email'].includes(m)
  );

  return essentialMissing.length === 0;
}
