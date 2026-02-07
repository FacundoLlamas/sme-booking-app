/**
 * Mock Claude LLM Responses
 * Advanced classification with scoring and confidence calculation
 */

import { mockOrchestrator } from '@/lib/mock-orchestrator';

export interface ServiceClassification {
  service_type: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  confidence: number;
  reasoning?: string;
  estimated_duration_minutes?: number;
}

interface ServiceMatch {
  service: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  matchCount: number;
}

// Service duration estimates in minutes
const SERVICE_DURATIONS: Record<string, number> = {
  plumbing: 90,
  electrical: 75,
  hvac: 150,
  painting: 360,
  locksmith: 60,
  glazier: 120,
  roofing: 240,
  cleaning: 180,
  pest_control: 90,
  appliance_repair: 120,
  garage_door: 90,
  handyman: 120,
  general_maintenance: 90,
};

// Comprehensive service patterns with urgency keywords
const SERVICE_PATTERNS = [
  {
    service: 'plumbing',
    keywords: ['leak', 'drain', 'pipe', 'water', 'toilet', 'sink', 'clog', 'faucet', 'plumb', 'sewage', 'overflow'],
    urgencyKeywords: {
      emergency: ['burst', 'flooding', 'emergency', 'urgent', 'gushing', 'pouring'],
      high: ['leak', 'broken', 'overflow', 'backup'],
      medium: ['slow', 'clogged', 'blocked'],
      low: ['drip', 'dripping', 'minor'],
    },
  },
  {
    service: 'electrical',
    keywords: ['electric', 'power', 'light', 'switch', 'outlet', 'socket', 'breaker', 'circuit', 'wiring', 'voltage'],
    urgencyKeywords: {
      emergency: ['sparking', 'spark', 'fire', 'burning', 'smoke', 'shock'],
      high: ['no power', 'outage', 'tripped'],
      medium: ['flickering', 'dimming', 'buzzing'],
      low: ['install', 'replace', 'upgrade'],
    },
  },
  {
    service: 'hvac',
    keywords: ['heat', 'heating', 'ac', 'air condition', 'hvac', 'furnace', 'thermostat', 'vent', 'cool', 'cold', 'hot'],
    urgencyKeywords: {
      emergency: ['no heat', 'freezing', 'extreme'],
      high: ['not working', 'broken', 'stopped'],
      medium: ['weak', 'poor', 'inefficient'],
      low: ['maintenance', 'service', 'check'],
    },
  },
  {
    service: 'painting',
    keywords: ['paint', 'painting', 'repaint', 'color', 'wall color', 'ceiling', 'trim'],
    urgencyKeywords: {
      emergency: [],
      high: [],
      medium: ['peeling', 'chipping'],
      low: ['cosmetic', 'refresh', 'update'],
    },
  },
  {
    service: 'locksmith',
    keywords: ['lock', 'locked', 'key', 'door lock', 'deadbolt', 'security', 'handle', 'knob'],
    urgencyKeywords: {
      emergency: ['locked out', 'emergency', 'stuck outside'],
      high: ['broken lock', 'won\'t lock', 'security issue'],
      medium: ['sticky', 'hard to turn'],
      low: ['rekey', 'duplicate', 'install'],
    },
  },
  {
    service: 'glazier',
    keywords: ['window', 'glass', 'pane', 'broken glass', 'cracked', 'shattered', 'windshield'],
    urgencyKeywords: {
      emergency: ['shattered', 'broken', 'smashed'],
      high: ['cracked', 'hole', 'security'],
      medium: ['foggy', 'seal'],
      low: ['upgrade', 'replace'],
    },
  },
  {
    service: 'roofing',
    keywords: ['roof', 'roofing', 'shingle', 'tile', 'gutter', 'flashing', 'ceiling leak'],
    urgencyKeywords: {
      emergency: ['major leak', 'collapse', 'hole'],
      high: ['leak', 'leaking', 'water damage'],
      medium: ['missing shingle', 'damaged'],
      low: ['inspection', 'maintenance'],
    },
  },
  {
    service: 'cleaning',
    keywords: ['clean', 'cleaning', 'carpet', 'upholstery', 'stain', 'steam clean', 'deep clean'],
    urgencyKeywords: {
      emergency: [],
      high: [],
      medium: ['odor', 'smell', 'mold'],
      low: ['regular', 'maintenance', 'refresh'],
    },
  },
  {
    service: 'pest_control',
    keywords: ['pest', 'bug', 'insect', 'rat', 'mouse', 'cockroach', 'termite', 'ant', 'spider', 'infestation'],
    urgencyKeywords: {
      emergency: ['infestation', 'swarm', 'emergency'],
      high: ['rats', 'mice', 'termites', 'bed bugs'],
      medium: ['ants', 'cockroaches', 'spiders'],
      low: ['prevention', 'inspection'],
    },
  },
  {
    service: 'appliance_repair',
    keywords: ['appliance', 'refrigerator', 'fridge', 'dishwasher', 'washer', 'dryer', 'oven', 'stove', 'microwave'],
    urgencyKeywords: {
      emergency: ['leaking', 'smoking', 'sparking'],
      high: ['not working', 'broken', 'stopped'],
      medium: ['noisy', 'inefficient', 'error'],
      low: ['maintenance', 'tune-up'],
    },
  },
  {
    service: 'garage_door',
    keywords: ['garage', 'garage door', 'opener', 'spring', 'track', 'remote'],
    urgencyKeywords: {
      emergency: ['stuck', 'won\'t open', 'trapped'],
      high: ['broken spring', 'off track'],
      medium: ['noisy', 'slow', 'jerky'],
      low: ['remote', 'maintenance'],
    },
  },
  {
    service: 'handyman',
    keywords: ['handyman', 'fix', 'repair', 'drywall', 'patch', 'hole', 'general repair', 'odd job'],
    urgencyKeywords: {
      emergency: [],
      high: ['damage', 'broken'],
      medium: ['repair', 'fix'],
      low: ['patch', 'touch up', 'install'],
    },
  },
];

/**
 * Internal classification logic (not wrapped)
 */
function classifyServiceRequestInternal(prompt: string): ServiceClassification {
  const lowerPrompt = prompt.toLowerCase();

  // Score all services
  const matches: ServiceMatch[] = SERVICE_PATTERNS.map((pattern) => ({
    service: pattern.service,
    matchCount: pattern.keywords.filter((k) => lowerPrompt.includes(k)).length,
    confidence: 0,
    urgency: 'low' as const,
  })).filter((m) => m.matchCount > 0);

  // No matches - return unknown
  if (matches.length === 0) {
    return {
      service_type: 'general_maintenance',
      urgency: 'low',
      confidence: 0.3,
      reasoning: 'Could not classify service type from description',
      estimated_duration_minutes: 90,
    };
  }

  // Sort by match count
  matches.sort((a, b) => b.matchCount - a.matchCount);
  const topMatch = matches[0];
  const secondMatch = matches[1];

  // Calculate confidence - lower if ambiguous (multiple services matched)
  let confidence = 0.95 - (matches.length - 1) * 0.15;
  confidence = Math.max(0.5, Math.min(0.95, confidence));

  // Determine urgency from keywords
  const pattern = SERVICE_PATTERNS.find((p) => p.service === topMatch.service)!;
  let urgency: 'low' | 'medium' | 'high' | 'emergency' = 'low';

  if (pattern.urgencyKeywords.emergency.some((k) => lowerPrompt.includes(k))) {
    urgency = 'emergency';
    confidence = Math.min(confidence * 1.1, 0.99);
  } else if (pattern.urgencyKeywords.high.some((k) => lowerPrompt.includes(k))) {
    urgency = 'high';
  } else if (pattern.urgencyKeywords.medium.some((k) => lowerPrompt.includes(k))) {
    urgency = 'medium';
  } else if (pattern.urgencyKeywords.low.length > 0 && pattern.urgencyKeywords.low.some((k) => lowerPrompt.includes(k))) {
    urgency = 'low';
  } else {
    // Default urgency if no specific keywords matched
    urgency = 'medium';
  }

  // Generate reasoning
  const reasoning = secondMatch
    ? `Likely ${topMatch.service} (also possible: ${secondMatch.service})`
    : `Identified as ${topMatch.service} based on keywords`;

  return {
    service_type: topMatch.service,
    urgency,
    confidence,
    reasoning,
    estimated_duration_minutes: SERVICE_DURATIONS[topMatch.service] || 90,
  };
}

/**
 * Classify a service request using advanced scoring (with orchestrator)
 */
export async function classifyServiceRequest(prompt: string): Promise<ServiceClassification> {
  return mockOrchestrator.withOrchestratedMock('llm', async () => {
    return classifyServiceRequestInternal(prompt);
  });
}

/**
 * Generate a mock Claude response for any prompt
 */
export async function generateMockResponse(prompt: string): Promise<string> {
  return mockOrchestrator.withOrchestratedMock('llm', async () => {
    const classification = classifyServiceRequestInternal(prompt);

  const response = {
    service_type: classification.service_type,
    urgency: classification.urgency,
    confidence: classification.confidence,
    reasoning: classification.reasoning,
    estimated_duration_minutes: classification.estimated_duration_minutes,
    analysis: `Based on the description "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}", I've classified this as a ${classification.service_type} request with ${classification.urgency} urgency.`,
  };

  return JSON.stringify(response, null, 2);
  });
}

/**
 * Simulate token counting using model-specific ratios
 * Opus: ~3.5 chars/token, Sonnet: ~3.8 chars/token, Haiku: ~4.0 chars/token
 * Note: For mocking purposes, uses Sonnet ratio by default
 */
export function estimateTokens(text: string): number {
  // Default to Sonnet: ~3.8 characters per token
  return Math.ceil(text.length / 3.8);
}
