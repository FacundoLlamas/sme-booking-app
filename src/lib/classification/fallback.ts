/**
 * Fallback Classification Engine
 * Keyword-based classification when LLM is unavailable
 * Provides fast, deterministic fallback for error cases
 */

import { ServiceType, UrgencyLevel, normalizeServiceType, normalizeUrgency } from './validator';
import { ServiceClassification } from './validator';
import { createLogger } from '@/lib/logger';

const logger = createLogger('classification:fallback');

/**
 * Keyword patterns for fallback classification
 * Organized by service type for deterministic matching
 */
interface FallbackPattern {
  service: ServiceType;
  keywords: string[];
  urgencyKeywords: {
    emergency: string[];
    high: string[];
    medium: string[];
    low: string[];
  };
  minDuration: number;
  maxDuration: number;
}

const FALLBACK_PATTERNS: FallbackPattern[] = [
  {
    service: ServiceType.PLUMBING,
    keywords: ['leak', 'drain', 'pipe', 'water', 'toilet', 'sink', 'clog', 'faucet', 'plumb'],
    urgencyKeywords: {
      emergency: ['burst', 'flooding', 'gushing', 'pouring'],
      high: ['overflow', 'backup', 'broken'],
      medium: ['slow', 'clogged'],
      low: ['drip', 'minor'],
    },
    minDuration: 45,
    maxDuration: 120,
  },
  {
    service: ServiceType.ELECTRICAL,
    keywords: ['electric', 'power', 'light', 'switch', 'outlet', 'breaker', 'wiring'],
    urgencyKeywords: {
      emergency: ['sparking', 'fire', 'burning', 'smoke', 'shock'],
      high: ['no power', 'tripped'],
      medium: ['flickering', 'buzzing'],
      low: ['install', 'replace'],
    },
    minDuration: 30,
    maxDuration: 120,
  },
  {
    service: ServiceType.HVAC,
    keywords: ['heat', 'ac', 'air', 'hvac', 'furnace', 'thermostat', 'cool'],
    urgencyKeywords: {
      emergency: ['no heat', 'freezing'],
      high: ['not working', 'broken'],
      medium: ['weak', 'inefficient'],
      low: ['maintenance', 'check'],
    },
    minDuration: 60,
    maxDuration: 180,
  },
  {
    service: ServiceType.PAINTING,
    keywords: ['paint', 'wall', 'color', 'ceiling', 'trim'],
    urgencyKeywords: {
      emergency: [],
      high: [],
      medium: ['peeling', 'chipping'],
      low: ['cosmetic', 'refresh'],
    },
    minDuration: 120,
    maxDuration: 480,
  },
  {
    service: ServiceType.LOCKSMITH,
    keywords: ['lock', 'key', 'door', 'deadbolt', 'security'],
    urgencyKeywords: {
      emergency: ['locked out', 'stuck'],
      high: ['broken', 'security'],
      medium: ['sticky'],
      low: ['rekey', 'duplicate'],
    },
    minDuration: 30,
    maxDuration: 90,
  },
  {
    service: ServiceType.ROOFING,
    keywords: ['roof', 'shingle', 'gutter', 'leak', 'ceiling'],
    urgencyKeywords: {
      emergency: ['major leak', 'hole'],
      high: ['leaking', 'water damage'],
      medium: ['missing', 'damaged'],
      low: ['inspection', 'maintenance'],
    },
    minDuration: 120,
    maxDuration: 360,
  },
  {
    service: ServiceType.PEST_CONTROL,
    keywords: ['pest', 'bug', 'rat', 'mouse', 'termite', 'ant', 'infestation'],
    urgencyKeywords: {
      emergency: ['infestation', 'swarm'],
      high: ['termites', 'rats'],
      medium: ['ants', 'spiders'],
      low: ['prevention'],
    },
    minDuration: 60,
    maxDuration: 180,
  },
  {
    service: ServiceType.APPLIANCE_REPAIR,
    keywords: ['appliance', 'dishwasher', 'washer', 'dryer', 'oven', 'refrigerator'],
    urgencyKeywords: {
      emergency: ['leaking', 'smoking'],
      high: ['not working', 'stopped'],
      medium: ['noisy', 'error'],
      low: ['maintenance'],
    },
    minDuration: 45,
    maxDuration: 150,
  },
  {
    service: ServiceType.GARAGE_DOOR,
    keywords: ['garage', 'door', 'opener', 'spring'],
    urgencyKeywords: {
      emergency: ['stuck', 'trapped'],
      high: ['broken', 'off track'],
      medium: ['noisy', 'slow'],
      low: ['maintenance'],
    },
    minDuration: 45,
    maxDuration: 120,
  },
  {
    service: ServiceType.CLEANING,
    keywords: ['clean', 'carpet', 'stain', 'steam'],
    urgencyKeywords: {
      emergency: [],
      high: ['mold', 'odor'],
      medium: [],
      low: ['regular'],
    },
    minDuration: 60,
    maxDuration: 240,
  },
  {
    service: ServiceType.GLAZIER,
    keywords: ['window', 'glass', 'pane', 'broken', 'cracked'],
    urgencyKeywords: {
      emergency: ['shattered', 'smashed'],
      high: ['cracked'],
      medium: ['foggy'],
      low: ['upgrade'],
    },
    minDuration: 60,
    maxDuration: 180,
  },
  {
    service: ServiceType.HANDYMAN,
    keywords: ['handyman', 'fix', 'repair', 'drywall', 'patch'],
    urgencyKeywords: {
      emergency: [],
      high: ['damage'],
      medium: ['repair'],
      low: ['patch', 'touch up'],
    },
    minDuration: 30,
    maxDuration: 120,
  },
];

/**
 * Classify using keyword matching fallback
 * Returns immediate result without network/LLM calls
 */
export function classifyWithFallback(customerMessage: string): ServiceClassification {
  const lowerMessage = customerMessage.toLowerCase();

  // Score all patterns
  const matches: Array<{
    pattern: FallbackPattern;
    matchCount: number;
    urgencyScore: number;
  }> = [];

  for (const pattern of FALLBACK_PATTERNS) {
    const matchCount = pattern.keywords.filter((k) => lowerMessage.includes(k)).length;

    if (matchCount > 0) {
      // Determine urgency from keywords
      let urgencyScore = 1; // low
      if (pattern.urgencyKeywords.emergency.some((k) => lowerMessage.includes(k))) {
        urgencyScore = 4;
      } else if (pattern.urgencyKeywords.high.some((k) => lowerMessage.includes(k))) {
        urgencyScore = 3;
      } else if (pattern.urgencyKeywords.medium.some((k) => lowerMessage.includes(k))) {
        urgencyScore = 2;
      }

      matches.push({ pattern, matchCount, urgencyScore });
    }
  }

  // No matches - return general maintenance
  if (matches.length === 0) {
    logger.warn('No fallback pattern match, defaulting to general maintenance');
    return {
      service_type: ServiceType.GENERAL_MAINTENANCE,
      urgency: UrgencyLevel.LOW,
      confidence: 0.3,
      reasoning: 'Fallback: Could not classify from description keywords',
      estimated_duration_minutes: 90,
    };
  }

  // Sort by match count (descending), then by urgency (descending)
  matches.sort((a, b) => {
    if (b.matchCount !== a.matchCount) {
      return b.matchCount - a.matchCount;
    }
    return b.urgencyScore - a.urgencyScore;
  });

  const topMatch = matches[0];
  const hasAmbiguity = matches.length > 1 && matches[1].matchCount === topMatch.matchCount;

  // Calculate confidence based on match strength
  let confidence = 0.75; // Base confidence for fallback
  if (topMatch.matchCount >= 3) {
    confidence = 0.85;
  } else if (topMatch.matchCount === 1) {
    confidence = 0.65;
  }

  // Reduce confidence if multiple services matched
  if (hasAmbiguity) {
    confidence *= 0.85;
  }

  // Map urgency score to level
  const urgencyMap: Record<number, UrgencyLevel> = {
    1: UrgencyLevel.LOW,
    2: UrgencyLevel.MEDIUM,
    3: UrgencyLevel.HIGH,
    4: UrgencyLevel.EMERGENCY,
  };

  const urgency = urgencyMap[topMatch.urgencyScore] || UrgencyLevel.MEDIUM;

  // Estimate duration (use middle of range)
  const estimatedDuration = Math.round(
    (topMatch.pattern.minDuration + topMatch.pattern.maxDuration) / 2
  );

  // Generate reasoning
  let reasoning = `Fallback match: ${topMatch.pattern.service}`;
  if (hasAmbiguity) {
    reasoning += ` (also possible: ${matches[1].pattern.service})`;
  }
  reasoning += ` based on ${topMatch.matchCount} keyword(s)`;

  logger.info(`Fallback classification: ${topMatch.pattern.service} (confidence: ${confidence})`);

  return {
    service_type: topMatch.pattern.service,
    urgency,
    confidence,
    reasoning,
    estimated_duration_minutes: estimatedDuration,
  };
}

/**
 * Check if a message has clear enough classification signal
 */
export function hasStrongFallbackSignal(customerMessage: string): boolean {
  const lowerMessage = customerMessage.toLowerCase();

  // Count total keyword matches
  let totalMatches = 0;
  for (const pattern of FALLBACK_PATTERNS) {
    totalMatches += pattern.keywords.filter((k) => lowerMessage.includes(k)).length;
  }

  // Strong signal if 2+ keywords match
  return totalMatches >= 2;
}

/**
 * Validate classification confidence threshold
 */
export function meetsConfidenceThreshold(
  classification: ServiceClassification,
  threshold: number = 0.5
): boolean {
  return classification.confidence >= threshold;
}
