/**
 * Few-Shot Examples for Service Classification
 * Real examples used for in-context learning with Claude
 */

export interface ClassificationExample {
  input: string;
  output: {
    service_type: string;
    urgency: 'low' | 'medium' | 'high' | 'emergency';
    confidence: number;
    reasoning: string;
    estimated_duration_minutes: number;
  };
}

/**
 * Plumbing Examples
 */
export const PLUMBING_EXAMPLES: ClassificationExample[] = [
  {
    input: 'My kitchen sink is backed up and water is overflowing everywhere!',
    output: {
      service_type: 'plumbing',
      urgency: 'emergency',
      confidence: 0.98,
      reasoning: 'Overflowing water indicates emergency - immediate water damage risk',
      estimated_duration_minutes: 75,
    },
  },
  {
    input: 'There is a small drip under my bathroom sink when I run the water',
    output: {
      service_type: 'plumbing',
      urgency: 'medium',
      confidence: 0.92,
      reasoning: 'Minor leak suggests worn fitting or seal, needs repair within 1-2 days',
      estimated_duration_minutes: 45,
    },
  },
  {
    input: 'My toilet is running constantly and wasting water',
    output: {
      service_type: 'plumbing',
      urgency: 'medium',
      confidence: 0.94,
      reasoning: 'Continuous running indicates internal component failure, causes water waste',
      estimated_duration_minutes: 60,
    },
  },
  {
    input: 'I need to have my drains cleaned and descaled',
    output: {
      service_type: 'plumbing',
      urgency: 'low',
      confidence: 0.91,
      reasoning: 'Preventive maintenance request with no current emergency',
      estimated_duration_minutes: 120,
    },
  },
  {
    input: 'Water is gushing from a burst pipe in my basement',
    output: {
      service_type: 'plumbing',
      urgency: 'emergency',
      confidence: 0.99,
      reasoning: 'Burst pipe causes immediate water damage and flooding risk',
      estimated_duration_minutes: 90,
    },
  },
];

/**
 * Electrical Examples
 */
export const ELECTRICAL_EXAMPLES: ClassificationExample[] = [
  {
    input: 'The circuit breaker keeps tripping whenever I use the dishwasher',
    output: {
      service_type: 'electrical',
      urgency: 'high',
      confidence: 0.93,
      reasoning: 'Repeated breaker trips suggest electrical overload or fault hazard',
      estimated_duration_minutes: 75,
    },
  },
  {
    input: 'My bedroom lights are flickering on and off randomly',
    output: {
      service_type: 'electrical',
      urgency: 'medium',
      confidence: 0.88,
      reasoning: 'Flickering indicates potential wiring issue, safety concern but not immediate',
      estimated_duration_minutes: 50,
    },
  },
  {
    input: 'I smell burning and see sparks coming from an outlet',
    output: {
      service_type: 'electrical',
      urgency: 'emergency',
      confidence: 0.99,
      reasoning: 'Sparking outlets are severe fire hazard requiring immediate attention',
      estimated_duration_minutes: 60,
    },
  },
  {
    input: 'Need to install a new light fixture in the living room',
    output: {
      service_type: 'electrical',
      urgency: 'low',
      confidence: 0.89,
      reasoning: 'Simple installation without safety concerns or time pressure',
      estimated_duration_minutes: 45,
    },
  },
  {
    input: 'The power went out to half my house and the breaker looks fine',
    output: {
      service_type: 'electrical',
      urgency: 'high',
      confidence: 0.91,
      reasoning: 'Partial outage indicates potential electrical fault needing urgent diagnosis',
      estimated_duration_minutes: 80,
    },
  },
];

/**
 * HVAC Examples
 */
export const HVAC_EXAMPLES: ClassificationExample[] = [
  {
    input: 'My air conditioner stopped working and it is 95 degrees outside',
    output: {
      service_type: 'hvac',
      urgency: 'high',
      confidence: 0.95,
      reasoning: 'Total AC failure in hot weather creates health risk, especially for elderly/children',
      estimated_duration_minutes: 120,
    },
  },
  {
    input: 'The heating in my apartment is weak but it still works okay',
    output: {
      service_type: 'hvac',
      urgency: 'medium',
      confidence: 0.86,
      reasoning: 'Reduced efficiency indicates maintenance needed, comfort issue but not dangerous',
      estimated_duration_minutes: 90,
    },
  },
  {
    input: 'I want to upgrade my old thermostat to a smart thermostat',
    output: {
      service_type: 'hvac',
      urgency: 'low',
      confidence: 0.87,
      reasoning: 'Upgrade request with no existing issue or time constraint',
      estimated_duration_minutes: 60,
    },
  },
  {
    input: 'My furnace is making strange noises and not heating properly',
    output: {
      service_type: 'hvac',
      urgency: 'high',
      confidence: 0.92,
      reasoning: 'Unusual noises + no heat suggests potential safety issue, needs urgent inspection',
      estimated_duration_minutes: 100,
    },
  },
  {
    input: 'The vents are blocked and not blowing cold air',
    output: {
      service_type: 'hvac',
      urgency: 'medium',
      confidence: 0.84,
      reasoning: 'Blocked vents reduce efficiency, need cleaning/clearing',
      estimated_duration_minutes: 45,
    },
  },
];

/**
 * Painting Examples
 */
export const PAINTING_EXAMPLES: ClassificationExample[] = [
  {
    input: 'My walls are peeling and chipping badly, needs to be repainted',
    output: {
      service_type: 'painting',
      urgency: 'medium',
      confidence: 0.89,
      reasoning: 'Peeling/chipping indicates aging paint and possible water damage underneath',
      estimated_duration_minutes: 300,
    },
  },
  {
    input: 'I want to repaint my bedroom a new color',
    output: {
      service_type: 'painting',
      urgency: 'low',
      confidence: 0.91,
      reasoning: 'Cosmetic request with no timeline pressure or damage',
      estimated_duration_minutes: 240,
    },
  },
  {
    input: 'Need exterior paint restoration on stained wood siding',
    output: {
      service_type: 'painting',
      urgency: 'medium',
      confidence: 0.85,
      reasoning: 'Exterior deterioration needs addressing to prevent water damage',
      estimated_duration_minutes: 480,
    },
  },
  {
    input: 'Small touch-up painting on trim and door frame',
    output: {
      service_type: 'painting',
      urgency: 'low',
      confidence: 0.93,
      reasoning: 'Minor cosmetic touch-up with no structural concerns',
      estimated_duration_minutes: 90,
    },
  },
  {
    input: 'The paint on my ceiling is bubbling and water stained',
    output: {
      service_type: 'painting',
      urgency: 'high',
      confidence: 0.87,
      reasoning: 'Bubbling and water stains indicate roof leak or moisture issue requiring attention',
      estimated_duration_minutes: 300,
    },
  },
];

/**
 * Other Service Examples (Single Example Each)
 */
export const LOCKSMITH_EXAMPLES: ClassificationExample[] = [
  {
    input: 'I am locked out of my house with no spare key',
    output: {
      service_type: 'locksmith',
      urgency: 'high',
      confidence: 0.98,
      reasoning: 'Locked out is immediate access problem requiring urgent response',
      estimated_duration_minutes: 45,
    },
  },
];

export const PEST_CONTROL_EXAMPLES: ClassificationExample[] = [
  {
    input: 'I found termites in my basement walls',
    output: {
      service_type: 'pest_control',
      urgency: 'high',
      confidence: 0.96,
      reasoning: 'Termite infestation threatens structural integrity, needs urgent treatment',
      estimated_duration_minutes: 120,
    },
  },
];

export const APPLIANCE_REPAIR_EXAMPLES: ClassificationExample[] = [
  {
    input: 'My dishwasher is not draining and water is pooling at the bottom',
    output: {
      service_type: 'appliance_repair',
      urgency: 'medium',
      confidence: 0.92,
      reasoning: 'Standing water in appliance needs repair soon to prevent damage/mold',
      estimated_duration_minutes: 75,
    },
  },
];

export const ROOFING_EXAMPLES: ClassificationExample[] = [
  {
    input: 'Water is actively leaking through my ceiling during rain',
    output: {
      service_type: 'roofing',
      urgency: 'emergency',
      confidence: 0.97,
      reasoning: 'Active leak causes immediate water damage and safety risk, needs urgent response',
      estimated_duration_minutes: 150,
    },
  },
];

export const GARAGE_DOOR_EXAMPLES: ClassificationExample[] = [
  {
    input: 'My garage door is stuck and won\'t open, I can\'t get my car out',
    output: {
      service_type: 'garage_door',
      urgency: 'high',
      confidence: 0.95,
      reasoning: 'Stuck door prevents vehicle access, needs urgent repair',
      estimated_duration_minutes: 60,
    },
  },
];

/**
 * Get all examples for a specific service type
 */
export function getExamplesForService(
  serviceType: string
): ClassificationExample[] {
  const allExamples: Record<string, ClassificationExample[]> = {
    plumbing: PLUMBING_EXAMPLES,
    electrical: ELECTRICAL_EXAMPLES,
    hvac: HVAC_EXAMPLES,
    painting: PAINTING_EXAMPLES,
    locksmith: LOCKSMITH_EXAMPLES,
    pest_control: PEST_CONTROL_EXAMPLES,
    appliance_repair: APPLIANCE_REPAIR_EXAMPLES,
    roofing: ROOFING_EXAMPLES,
    garage_door: GARAGE_DOOR_EXAMPLES,
  };

  return allExamples[serviceType] || [];
}

/**
 * Get all examples across all services
 */
export function getAllExamples(): ClassificationExample[] {
  return [
    ...PLUMBING_EXAMPLES,
    ...ELECTRICAL_EXAMPLES,
    ...HVAC_EXAMPLES,
    ...PAINTING_EXAMPLES,
    ...LOCKSMITH_EXAMPLES,
    ...PEST_CONTROL_EXAMPLES,
    ...APPLIANCE_REPAIR_EXAMPLES,
    ...ROOFING_EXAMPLES,
    ...GARAGE_DOOR_EXAMPLES,
  ];
}

/**
 * Format examples for few-shot prompt inclusion
 */
export function formatExamplesForPrompt(examples: ClassificationExample[]): string {
  return examples
    .map(
      (ex, idx) =>
        `Example ${idx + 1}:
Input: "${ex.input}"
Output: ${JSON.stringify(ex.output)}
`
    )
    .join('\n');
}
