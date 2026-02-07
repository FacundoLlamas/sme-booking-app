/**
 * Smart Follow-up Question Generation
 * Context-aware follow-up questions that avoid repetition
 */

import { ConversationContext } from '@/lib/response-generator/prompt-builder';

export interface FollowUpQuestion {
  id: string;
  text: string;
  category: 'timing' | 'location' | 'details' | 'preferences' | 'confirmation';
  priority: number; // 1-5, where 5 is most important
}

export interface FollowUpSuggestions {
  questions: FollowUpQuestion[];
  suggested_topic: string;
  conversation_stage: ConversationStage;
}

export type ConversationStage =
  | 'initial_inquiry'
  | 'service_identified'
  | 'gathering_details'
  | 'scheduling_time'
  | 'confirming_details'
  | 'ready_to_book';

/**
 * Generate contextual follow-up questions
 * Avoids asking for information already provided
 * Limits to 2-3 most important questions
 */
export function generateFollowUpQuestions(
  context: ConversationContext,
  max_questions: number = 3
): FollowUpSuggestions {
  const alreadyProvided = extractProvidedInfo(context);
  const stage = determineConversationStage(context, alreadyProvided);

  let questions: FollowUpQuestion[] = [];

  // Build question pool based on stage and what's missing
  const questionPool = buildQuestionPool(context, alreadyProvided, stage);

  // Sort by priority and select top N
  questions = questionPool
    .filter((q) => !alreadyProvided.includes(getInfoType(q.category)))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, max_questions);

  const suggested_topic = suggestNextTopic(stage, alreadyProvided);

  return {
    questions,
    suggested_topic,
    conversation_stage: stage,
  };
}

/**
 * Extract what information has already been provided
 */
function extractProvidedInfo(context: ConversationContext): string[] {
  const provided: string[] = [];

  if (context.customer_name) provided.push('name');
  if (context.customer_phone) provided.push('phone');
  if (context.customer_email) provided.push('email');
  if (context.service_classification.service_type) provided.push('service_type');

  // Check conversation history for mentions of timing, location, details
  const conversationText = context.conversation_history
    .map((msg) => msg.content.toLowerCase())
    .join(' ');

  if (
    conversationText.includes('when') ||
    conversationText.includes('time') ||
    conversationText.includes('available') ||
    conversationText.includes('schedule')
  ) {
    provided.push('timing');
  }

  if (
    conversationText.includes('address') ||
    conversationText.includes('location') ||
    conversationText.includes('where')
  ) {
    provided.push('location');
  }

  if (
    conversationText.includes('emergency') ||
    conversationText.includes('urgent') ||
    context.service_classification.urgency === 'emergency'
  ) {
    provided.push('urgency');
  }

  return provided;
}

/**
 * Convert category to info type for comparison
 */
function getInfoType(category: string): string {
  const mapping: Record<string, string> = {
    timing: 'timing',
    location: 'location',
    details: 'details',
    preferences: 'preferences',
    confirmation: 'confirmation',
  };
  return mapping[category] || category;
}

/**
 * Determine current stage of conversation
 */
function determineConversationStage(
  context: ConversationContext,
  provided: string[]
): ConversationStage {
  const messageCount = context.conversation_history.length;

  if (messageCount === 0) {
    return 'initial_inquiry';
  }

  if (!provided.includes('service_type')) {
    return 'service_identified';
  }

  if (!provided.includes('location') || !provided.includes('phone')) {
    return 'gathering_details';
  }

  if (!provided.includes('timing')) {
    return 'scheduling_time';
  }

  if (messageCount < 4) {
    return 'confirming_details';
  }

  return 'ready_to_book';
}

/**
 * Build pool of possible follow-up questions
 * Customized by service type and conversation stage
 */
function buildQuestionPool(
  context: ConversationContext,
  alreadyProvided: string[],
  stage: ConversationStage
): FollowUpQuestion[] {
  const { service_classification } = context;
  const serviceType = service_classification.service_type.toLowerCase();

  const questions: FollowUpQuestion[] = [];

  // Always ask for location if not provided
  if (!alreadyProvided.includes('location')) {
    questions.push({
      id: 'location_address',
      text: "What\\'s the address where you\\'d like the service performed?",
      category: 'location',
      priority: 5,
    });
  }

  // Always ask for phone if not provided
  if (!alreadyProvided.includes('phone')) {
    questions.push({
      id: 'contact_phone',
      text: 'Can we get a phone number to reach you? This helps with scheduling and updates.',
      category: 'location',
      priority: 5,
    });
  }

  // Service-specific detail questions
  const detailQuestions = getServiceDetailQuestions(serviceType, service_classification.urgency);
  questions.push(
    ...detailQuestions.filter((q) => !alreadyProvided.includes('details'))
  );

  // Timing questions (unless emergency)
  if (service_classification.urgency !== 'emergency' && !alreadyProvided.includes('timing')) {
    questions.push({
      id: 'preferred_timing',
      text: "When would you ideally like to schedule this service - is any specific day or time best for you?",
      category: 'timing',
      priority: 4,
    });
  }

  // For low priority services, ask about flexibility
  if (service_classification.urgency === 'low') {
    questions.push({
      id: 'scheduling_flexibility',
      text: 'Are you flexible with dates/times, or do you have specific constraints?',
      category: 'preferences',
      priority: 3,
    });
  }

  // Ask for confirmation on service type if confidence is medium
  if (service_classification.confidence < 0.75) {
    questions.push({
      id: 'service_confirmation',
      text: `Just to confirm - you are looking for ${service_classification.service_type} service, correct?`,
      category: 'confirmation',
      priority: 4,
    });
  }

  return questions;
}

/**
 * Get service-specific detail questions
 */
function getServiceDetailQuestions(
  serviceType: string,
  urgency: string
): FollowUpQuestion[] {
  const questions: FollowUpQuestion[] = [];

  // Plumbing-specific
  if (serviceType.includes('plumb')) {
    if (urgency === 'emergency') {
      questions.push({
        id: 'plumb_emergency_details',
        text: 'Is the water actively flowing/leaking, or have you been able to shut off the water?',
        category: 'details',
        priority: 5,
      });
    } else {
      questions.push({
        id: 'plumb_issue_type',
        text: 'Is this a leak, clog, fixture malfunction, or something else?',
        category: 'details',
        priority: 4,
      });
    }
  }

  // Electrical-specific
  if (serviceType.includes('electric')) {
    if (urgency === 'emergency') {
      questions.push({
        id: 'elec_emergency_details',
        text: 'Is there any visible sparking, burning smell, or smoke? For safety, is anyone in immediate danger?',
        category: 'details',
        priority: 5,
      });
    } else {
      questions.push({
        id: 'elec_issue_type',
        text: "What\\'s the electrical issue - is it a power outage, flickering lights, tripped breaker, or something else?",
        category: 'details',
        priority: 4,
      });
    }
  }

  // HVAC-specific
  if (serviceType.includes('hvac') || serviceType.includes('heat') || serviceType.includes('cool')) {
    questions.push({
      id: 'hvac_issue_type',
      text: 'Is the issue with heating, cooling, airflow, or temperature control?',
      category: 'details',
      priority: 4,
    });
  }

  // Painting-specific
  if (serviceType.includes('paint')) {
    questions.push({
      id: 'paint_scope',
      text: 'What area are we painting - interior rooms, exterior, or specific surfaces?',
      category: 'details',
      priority: 3,
    });
    questions.push({
      id: 'paint_color_preference',
      text: 'Do you have a color in mind, or would you like suggestions?',
      category: 'preferences',
      priority: 2,
    });
  }

  // Locksmith-specific
  if (serviceType.includes('lock')) {
    if (urgency === 'emergency') {
      questions.push({
        id: 'lock_emergency_access',
        text: 'Are you locked out of your property? Is there an alternate entry available for our technician?',
        category: 'details',
        priority: 5,
      });
    }
  }

  // General detail question if nothing specific matched
  if (questions.length === 0 && urgency !== 'emergency') {
    questions.push({
      id: 'general_details',
      text: "Can you describe the issue or work needed in a bit more detail?",
      category: 'details',
      priority: 3,
    });
  }

  return questions;
}

/**
 * Suggest the next conversation topic based on stage
 */
function suggestNextTopic(stage: ConversationStage, provided: string[]): string {
  switch (stage) {
    case 'initial_inquiry':
      return 'Request more details about the issue';
    case 'service_identified':
      return 'Get customer contact information and location';
    case 'gathering_details':
      return 'Understand specific needs and any urgency';
    case 'scheduling_time':
      return 'Ask for preferred scheduling times';
    case 'confirming_details':
      return 'Confirm all information before booking';
    case 'ready_to_book':
      return 'Present available appointment times and complete booking';
    default:
      return 'Continue conversation';
  }
}

/**
 * Generate a follow-up message combining questions naturally
 * Instead of asking all questions at once, weave them into conversation
 */
export function generateFollowUpMessage(
  context: ConversationContext,
  questions: FollowUpQuestion[]
): string {
  if (questions.length === 0) {
    return "Great! I think we have everything we need. Let me find the best time slots for you.";
  }

  const urgency = context.service_classification.urgency;

  // For emergency, ask critical questions only
  if (urgency === 'emergency') {
    const criticalQuestion = questions
      .sort((a, b) => b.priority - a.priority)[0];
    return `${criticalQuestion.text}`;
  }

  // For high priority, ask main question + one detail
  if (urgency === 'high') {
    const topTwo = questions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 2);

    if (topTwo.length === 1) {
      return `${topTwo[0].text}`;
    }

    return `${topTwo[0].text}\n\nAlso, ${topTwo[1].text.toLowerCase()}`;
  }

  // For medium/low, ask up to 3 questions naturally
  const topThree = questions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);

  if (topThree.length === 1) {
    return `${topThree[0].text}`;
  }

  if (topThree.length === 2) {
    return `${topThree[0].text}\n\nAlso, ${topThree[1].text.toLowerCase()}`;
  }

  return `${topThree[0].text}\n\nAdditionally:\n- ${topThree[1].text.toLowerCase()}\n- ${topThree[2].text.toLowerCase()}`;
}

/**
 * Check if we should move to scheduling
 */
export function isReadyForScheduling(context: ConversationContext): boolean {
  const provided = extractProvidedInfo(context);

  // Essential info for booking
  const essentialInfo = ['service_type', 'phone', 'location'];
  const hasEssential = essentialInfo.every((info) => provided.includes(info));

  // For emergency, don't wait for too much info
  if (context.service_classification.urgency === 'emergency') {
    return provided.includes('service_type') && provided.includes('location');
  }

  return hasEssential;
}

/**
 * Get a summary of gathered information
 */
export function getGatheredInfoSummary(context: ConversationContext): string {
  const parts: string[] = [];

  if (context.customer_name) {
    parts.push(`Name: ${context.customer_name}`);
  }
  if (context.customer_phone) {
    parts.push(`Phone: ${context.customer_phone}`);
  }
  if (context.service_classification.service_type) {
    parts.push(`Service: ${context.service_classification.service_type}`);
  }
  if (context.service_classification.urgency !== 'low') {
    parts.push(`Urgency: ${context.service_classification.urgency}`);
  }

  if (parts.length === 0) {
    return 'No information gathered yet.';
  }

  return parts.join(' | ');
}
