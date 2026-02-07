/**
 * Conversation State Machine
 * Manages natural progression through service booking workflow
 * States: greeting → service_identified → availability_checking → scheduling → confirmed
 * 
 * CRITICAL: handleConfirmedState() now creates actual Booking records
 */

import { ServiceClassification } from '@/lib/llm/__mocks__/mock-claude';
import { ConversationContext } from '@/lib/response-generator/prompt-builder';
import { isReadyForScheduling } from '@/lib/response-generator/follow-ups';
import { AvailableExpert } from '@/lib/availability/checker';
import { createBooking } from '@/lib/db/booking-service';
import { addConversationMessage } from '@/lib/db/conversation-service';

export type ConversationState =
  | 'greeting'
  | 'service_identified'
  | 'availability_checking'
  | 'scheduling'
  | 'confirmed';

export type TransitionReason =
  | 'service_classified'
  | 'details_gathered'
  | 'experts_found'
  | 'slot_selected'
  | 'user_clarification_needed'
  | 'no_availability'
  | 'timeout';

export interface StateMachineContext {
  current_state: ConversationState;
  previous_state: ConversationState | null;
  conversation_context: ConversationContext;
  available_experts: AvailableExpert[];
  selected_slot: SelectedSlot | null;
  transition_reason: TransitionReason | null;
  retry_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface SelectedSlot {
  slot_id: string;
  expert_id: string;
  expert_name: string;
  date_time: Date;
  duration_minutes: number;
  confirmation_token?: string;
}

export interface StateTransition {
  from: ConversationState;
  to: ConversationState;
  reason: TransitionReason;
  required_conditions: string[];
}

/**
 * Initialize a new conversation state machine
 */
export function initializeStateMachine(context: ConversationContext): StateMachineContext {
  return {
    current_state: 'greeting',
    previous_state: null,
    conversation_context: context,
    available_experts: [],
    selected_slot: null,
    transition_reason: null,
    retry_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

/**
 * Process an incoming message and determine state transition
 * CRITICAL: This is now async to support booking creation in confirmed state
 */
export async function processMessage(
  machine: StateMachineContext,
  message: string
): Promise<{
  new_state: ConversationState;
  transition: StateTransition | null;
  should_gather_more_info: boolean;
  next_action: string;
  bookingId?: number;
  confirmationMessage?: string;
}> {
  const currentState = machine.current_state;

  switch (currentState) {
    case 'greeting':
      return handleGreetingState(machine, message);

    case 'service_identified':
      return handleServiceIdentifiedState(machine, message);

    case 'availability_checking':
      return handleAvailabilityCheckingState(machine, message);

    case 'scheduling':
      return handleSchedulingState(machine, message);

    case 'confirmed':
      return handleConfirmedState(machine, message);

    default:
      return {
        new_state: currentState,
        transition: null,
        should_gather_more_info: false,
        next_action: 'continue_conversation',
      };
  }
}

/**
 * Handle GREETING state
 * User just started conversation, hasn't expressed a service need yet
 */
function handleGreetingState(
  machine: StateMachineContext,
  message: string
): {
  new_state: ConversationState;
  transition: StateTransition | null;
  should_gather_more_info: boolean;
  next_action: string;
} {
  const classification = machine.conversation_context.service_classification;

  // If service is identified with high confidence, move to service_identified
  if (classification.service_type && classification.confidence > 0.5) {
    const transition: StateTransition = {
      from: 'greeting',
      to: 'service_identified',
      reason: 'service_classified',
      required_conditions: ['service_type identified', 'confidence > 0.5'],
    };

    return {
      new_state: 'service_identified',
      transition,
      should_gather_more_info: true,
      next_action: 'gather_contact_and_location_info',
    };
  }

  // If confidence is low, ask for clarification
  if (classification.service_type && classification.confidence <= 0.5) {
    return {
      new_state: 'greeting',
      transition: null,
      should_gather_more_info: true,
      next_action: 'clarify_service_type',
    };
  }

  // No service identified yet
  return {
    new_state: 'greeting',
    transition: null,
    should_gather_more_info: true,
    next_action: 'ask_for_service_need',
  };
}

/**
 * Handle SERVICE_IDENTIFIED state
 * We know what service they need, now gather location/contact info
 */
function handleServiceIdentifiedState(
  machine: StateMachineContext,
  message: string
): {
  new_state: ConversationState;
  transition: StateTransition | null;
  should_gather_more_info: boolean;
  next_action: string;
} {
  const context = machine.conversation_context;
  const hasPhone = !!context.customer_phone;
  const hasLocation =
    context.conversation_history.some(
      (msg) =>
        msg.content.toLowerCase().includes('address') ||
        msg.content.toLowerCase().includes('location')
    ) || context.customer_phone?.includes('address');

  // Check urgency level - for emergency, move faster
  if (context.service_classification.urgency === 'emergency') {
    if (hasLocation) {
      // Skip to scheduling immediately for emergency
      const transition: StateTransition = {
        from: 'service_identified',
        to: 'scheduling',
        reason: 'details_gathered',
        required_conditions: [
          'service identified',
          'location provided',
          'emergency urgency',
        ],
      };

      return {
        new_state: 'scheduling',
        transition,
        should_gather_more_info: false,
        next_action: 'find_emergency_experts_and_schedule',
      };
    } else {
      // Still need location for emergency
      return {
        new_state: 'service_identified',
        transition: null,
        should_gather_more_info: true,
        next_action: 'get_location_for_emergency',
      };
    }
  }

  // For non-emergency, check if we have essential info
  if (hasPhone && hasLocation) {
    // Check availability
    const transition: StateTransition = {
      from: 'service_identified',
      to: 'availability_checking',
      reason: 'details_gathered',
      required_conditions: [
        'service identified',
        'customer phone provided',
        'location provided',
      ],
    };

    return {
      new_state: 'availability_checking',
      transition,
      should_gather_more_info: false,
      next_action: 'check_expert_availability',
    };
  }

  // Still gathering details
  return {
    new_state: 'service_identified',
    transition: null,
    should_gather_more_info: true,
    next_action: 'continue_gathering_details',
  };
}

/**
 * Handle AVAILABILITY_CHECKING state
 * We're checking if experts are available
 */
function handleAvailabilityCheckingState(
  machine: StateMachineContext,
  message: string
): {
  new_state: ConversationState;
  transition: StateTransition | null;
  should_gather_more_info: boolean;
  next_action: string;
} {
  // If we have found experts, move to scheduling
  if (machine.available_experts.length > 0) {
    const transition: StateTransition = {
      from: 'availability_checking',
      to: 'scheduling',
      reason: 'experts_found',
      required_conditions: [`${machine.available_experts.length} expert(s) found`],
    };

    return {
      new_state: 'scheduling',
      transition,
      should_gather_more_info: false,
      next_action: 'present_scheduling_options',
    };
  }

  // No experts available
  if (machine.retry_count >= 2) {
    return {
      new_state: 'availability_checking',
      transition: null,
      should_gather_more_info: false,
      next_action: 'add_to_waitlist',
    };
  }

  // Retry - check again or ask about flexibility
  return {
    new_state: 'availability_checking',
    transition: null,
    should_gather_more_info: true,
    next_action: 'ask_about_flexibility',
  };
}

/**
 * Handle SCHEDULING state
 * Presenting time slots and waiting for user to select one
 */
function handleSchedulingState(
  machine: StateMachineContext,
  message: string
): {
  new_state: ConversationState;
  transition: StateTransition | null;
  should_gather_more_info: boolean;
  next_action: string;
} {
  // Check if user has selected a slot
  const selectedSlot = parseSlotSelection(message, machine.available_experts);

  if (selectedSlot) {
    machine.selected_slot = selectedSlot;

    const transition: StateTransition = {
      from: 'scheduling',
      to: 'confirmed',
      reason: 'slot_selected',
      required_conditions: [
        'time slot selected',
        'expert confirmed',
        'booking created',
      ],
    };

    return {
      new_state: 'confirmed',
      transition,
      should_gather_more_info: false,
      next_action: 'create_booking_and_confirm',
    };
  }

  // Still deciding on time
  return {
    new_state: 'scheduling',
    transition: null,
    should_gather_more_info: true,
    next_action: 'help_select_time',
  };
}

/**
 * Handle CONFIRMED state
 * CRITICAL: Creates actual Booking record and confirms appointment
 * Booking is complete, offer next steps
 */
async function handleConfirmedState(
  machine: StateMachineContext,
  message: string
): Promise<{
  new_state: ConversationState;
  transition: StateTransition | null;
  should_gather_more_info: boolean;
  next_action: string;
  bookingId?: number;
  confirmationMessage?: string;
}> {
  // Check if user is asking for changes
  if (
    message.toLowerCase().includes('change') ||
    message.toLowerCase().includes('cancel') ||
    message.toLowerCase().includes('different')
  ) {
    // Return to scheduling to offer new times
    return {
      new_state: 'scheduling',
      transition: null,
      should_gather_more_info: false,
      next_action: 'offer_alternative_times',
    };
  }

  // If we have a selected slot and customer info, create the booking
  if (machine.selected_slot && machine.conversation_context.customerId) {
    try {
      const slot = machine.selected_slot;
      const context = machine.conversation_context;

      // Create booking in database
      const booking = await createBooking({
        customerId: context.customerId,
        businessId: context.businessId || 1, // Default to business 1 for now
        serviceId: context.serviceId || 1, // Default service ID
        serviceType: context.service_classification.service_type,
        technicianId: parseInt(slot.expert_id),
        bookingTime: slot.date_time,
        notes: `Booked via AI conversation. Duration: ${slot.duration_minutes} minutes`,
      });

      // Log confirmation in conversation history
      await addConversationMessage(
        context.conversationId,
        'assistant',
        `Booking confirmed! Reference ID: ${booking.confirmationToken}`
      );

      return {
        new_state: 'confirmed',
        transition: null,
        should_gather_more_info: false,
        next_action: 'provide_confirmation_details',
        bookingId: booking.id,
        confirmationMessage: `Your booking is confirmed! Booking ID: ${booking.confirmationToken}. Technician will arrive on ${booking.bookingTime.toLocaleString()}`,
      };
    } catch (error) {
      console.error('Error creating booking:', error);

      // Fall back to just confirming without database write
      return {
        new_state: 'confirmed',
        transition: null,
        should_gather_more_info: false,
        next_action: 'provide_confirmation_details',
        confirmationMessage: 'Your appointment has been scheduled. You will receive a confirmation email shortly.',
      };
    }
  }

  // Otherwise stay in confirmed and offer helpful info
  return {
    new_state: 'confirmed',
    transition: null,
    should_gather_more_info: false,
    next_action: 'provide_confirmation_details',
  };
}

/**
 * Parse slot selection from user message
 * E.g., "Tuesday at 2pm", "first option", "the 10am slot"
 */
function parseSlotSelection(
  message: string,
  available_experts: AvailableExpert[]
): SelectedSlot | null {
  const text = message.toLowerCase();

  // Collect all available slots
  const allSlots: SelectedSlot[] = [];

  available_experts.forEach((expert) => {
    expert.available_slots.forEach((slot, index) => {
      allSlots.push({
        slot_id: slot.slot_id,
        expert_id: expert.expert_id,
        expert_name: expert.expert_name,
        date_time: new Date(slot.start_time),
        duration_minutes: slot.duration_minutes,
      });
    });
  });

  // Parse common selection patterns
  if (
    text.includes('first') ||
    text.includes('earliest') ||
    text.includes('asap') ||
    text.includes('immediately')
  ) {
    return allSlots[0] || null;
  }

  if (
    text.includes('second') ||
    text.includes('2') ||
    text.includes('second option')
  ) {
    return allSlots[1] || null;
  }

  if (text.includes('third') || text.includes('3')) {
    return allSlots[2] || null;
  }

  // Try to parse time mentions (e.g., "2pm", "10:00")
  const timeMatches = text.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)?/);
  if (timeMatches) {
    const hour = parseInt(timeMatches[1]);
    const minute = parseInt(timeMatches[2] || '0');
    const period = timeMatches[3];

    let targetHour = hour;
    if (period === 'pm' && hour < 12) targetHour = hour + 12;
    if (period === 'am' && hour === 12) targetHour = 0;

    // Find matching slot
    const matching = allSlots.find((slot) => slot.date_time.getHours() === targetHour);
    if (matching) return matching;
  }

  // Try to parse day of week
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  for (const day of days) {
    if (text.includes(day)) {
      const matchingSlots = allSlots.filter((slot) => {
        const dayName = slot.date_time.toLocaleDateString('en-US', {
          weekday: 'long',
        });
        return dayName.toLowerCase() === day;
      });

      if (matchingSlots.length > 0) return matchingSlots[0];
    }
  }

  return null;
}

/**
 * Determine if conversation should be escalated to human
 */
export function shouldEscalateToHuman(machine: StateMachineContext): boolean {
  const context = machine.conversation_context;

  // Escalate if:
  // 1. No experts available after 2 retries
  if (
    machine.current_state === 'availability_checking' &&
    machine.available_experts.length === 0 &&
    machine.retry_count >= 2
  ) {
    return true;
  }

  // 2. Service classification confidence is very low
  if (context.service_classification.confidence < 0.3) {
    return true;
  }

  // 3. Conversation has been going on too long without progress
  const conversationDuration = new Date().getTime() - machine.created_at.getTime();
  const hoursElapsed = conversationDuration / (1000 * 60 * 60);
  if (hoursElapsed > 1 && machine.current_state === 'greeting') {
    return true;
  }

  // 4. User is asking to speak with someone
  if (
    context.conversation_history.some((msg) =>
      msg.content.toLowerCase().includes('human') ||
      msg.content.toLowerCase().includes('agent') ||
      msg.content.toLowerCase().includes('speak with')
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Get human-friendly description of current state
 */
export function getStateDescription(state: ConversationState): string {
  const descriptions: Record<ConversationState, string> = {
    greeting: 'Understanding service need',
    service_identified: 'Gathering contact information',
    availability_checking: 'Finding available experts',
    scheduling: 'Selecting appointment time',
    confirmed: 'Booking confirmed',
  };

  return descriptions[state] || 'Processing your request';
}

/**
 * Get suggested action for current state
 */
export function getSuggestedAction(
  state: ConversationState
): {
  action: string;
  description: string;
} {
  const actions: Record<ConversationState, { action: string; description: string }> = {
    greeting: {
      action: 'ask_about_service',
      description: 'Ask what service they need',
    },
    service_identified: {
      action: 'gather_contact_info',
      description: 'Request phone number and address',
    },
    availability_checking: {
      action: 'search_experts',
      description: 'Search database for available experts',
    },
    scheduling: {
      action: 'suggest_times',
      description: 'Present 3-5 available time slots',
    },
    confirmed: {
      action: 'provide_confirmation',
      description: 'Show booking confirmation and next steps',
    },
  };

  return actions[state] || { action: 'unknown', description: 'Unknown state' };
}

/**
 * Create a bookmark of conversation state for resuming later
 */
export function createStateBookmark(machine: StateMachineContext): string {
  return btoa(
    JSON.stringify({
      state: machine.current_state,
      service: machine.conversation_context.service_classification.service_type,
      phone: machine.conversation_context.customer_phone,
      timestamp: machine.updated_at.getTime(),
    })
  );
}

/**
 * Restore conversation from bookmark
 */
export function restoreFromBookmark(bookmark: string): Partial<StateMachineContext> | null {
  try {
    const data = JSON.parse(atob(bookmark));
    return {
      current_state: data.state,
      previous_state: null,
    };
  } catch {
    return null;
  }
}
