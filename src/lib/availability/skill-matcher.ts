/**
 * Enhanced Skill Matching with Fuzzy Matching
 * Uses Levenshtein distance for fuzzy matching and category-based matching
 */

import leven from 'leven';

/**
 * Skill category mappings for common service types
 */
const SKILL_CATEGORIES: Record<string, string[]> = {
  plumbing: [
    'pipes',
    'pipe repair',
    'drain',
    'drain cleaning',
    'sink',
    'water',
    'faucet',
    'toilet',
    'fixture',
    'leak',
    'leaking',
    'blockage',
    'clogged',
    'plumber',
  ],
  electrical: [
    'wire',
    'wiring',
    'circuit',
    'breaker',
    'outlet',
    'power',
    'light',
    'lighting',
    'switch',
    'electric',
    'electrician',
    'voltage',
    'sparking',
  ],
  hvac: [
    'heat',
    'heating',
    'cool',
    'cooling',
    'ac',
    'air conditioning',
    'furnace',
    'ventilation',
    'thermostat',
    'temperature',
    'hvac',
    'ductwork',
    'compressor',
  ],
  painting: [
    'paint',
    'painting',
    'color',
    'interior',
    'exterior',
    'finish',
    'coating',
    'brush',
    'trim',
    'walls',
    'primer',
  ],
  handyman: [
    'general',
    'maintenance',
    'repair',
    'repairs',
    'fix',
    'fixing',
    'service',
    'install',
    'installation',
    'replace',
  ],
  landscaping: [
    'landscape',
    'landscaping',
    'yard',
    'garden',
    'lawn',
    'mowing',
    'cutting',
    'trees',
    'shrubs',
    'plants',
    'grass',
    'hardscape',
    'mulch',
  ],
  roofing: [
    'roof',
    'roofing',
    'shingle',
    'gutter',
    'leak',
    'leaking',
    'damage',
    'repair',
    'replacement',
  ],
  locksmith: [
    'lock',
    'locking',
    'door',
    'security',
    'key',
    'unlock',
    'deadbolt',
  ],
  glazier: [
    'glass',
    'window',
    'pane',
    'mirror',
    'replacement',
  ],
  cleaning: [
    'clean',
    'cleaning',
    'mold',
    'carpet',
    'floor',
    'sanitize',
    'housekeeping',
  ],
  appliance: [
    'appliance',
    'washer',
    'dryer',
    'refrigerator',
    'oven',
    'dishwasher',
    'microwave',
    'repair',
  ],
  garage: [
    'garage',
    'door',
    'opener',
    'spring',
    'track',
  ],
};

export interface SkillMatchResult {
  score: number; // 0-100
  matchType: 'exact' | 'category' | 'fuzzy' | 'none';
  confidence: number; // 0-1
}

/**
 * Calculate skill match score using multiple matching strategies
 * Combines exact matching, category matching, and fuzzy matching
 */
export function calculateEnhancedSkillMatch(
  expertSkills: string,
  serviceType: string,
  urgency: string
): number {
  if (!expertSkills || !serviceType) return 30; // Minimum for unspecified

  const skillsList = expertSkills
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const serviceKey = serviceType.toLowerCase().trim();

  // Try exact service type match
  const exactScore = getExactMatchScore(serviceKey, skillsList);
  if (exactScore > 0) {
    return exactScore;
  }

  // Try category-based matching
  const categoryScore = getCategoryMatchScore(serviceKey, skillsList);
  if (categoryScore > 0) {
    return categoryScore;
  }

  // Try fuzzy matching with Levenshtein distance
  const fuzzyScore = getFuzzyMatchScore(serviceKey, skillsList);
  if (fuzzyScore > 0) {
    return fuzzyScore;
  }

  // Check for general/handyman skills
  const generalScore = getGeneralMatchScore(skillsList);
  if (generalScore > 0) {
    return generalScore;
  }

  return 30; // Default minimum
}

/**
 * Get exact match score (100%)
 */
function getExactMatchScore(serviceType: string, skills: string[]): number {
  for (const skill of skills) {
    if (serviceType.includes(skill) || skill.includes(serviceType)) {
      return 100;
    }
  }
  return 0;
}

/**
 * Get category match score (70-80%)
 */
function getCategoryMatchScore(serviceType: string, skills: string[]): number {
  // Find which category the service belongs to
  let matchedCategory = '';
  for (const [category, keywords] of Object.entries(SKILL_CATEGORIES)) {
    if (keywords.some((kw) => serviceType.includes(kw))) {
      matchedCategory = category;
      break;
    }
  }

  if (!matchedCategory) {
    return 0;
  }

  // Check if expert has matching category keywords
  const categoryKeywords = SKILL_CATEGORIES[matchedCategory];
  const matchedKeywords = skills.filter((skill) =>
    categoryKeywords.some((keyword) => skill.includes(keyword))
  );

  if (matchedKeywords.length > 0) {
    // Score based on number of matching keywords
    // 1-2 matches: 70%, 3+ matches: 80%
    return matchedKeywords.length >= 3 ? 80 : 70;
  }

  return 0;
}

/**
 * Get fuzzy match score using Levenshtein distance (60%)
 * Matches if distance < 3 (90%+ similarity)
 */
function getFuzzyMatchScore(serviceType: string, skills: string[]): number {
  const MAX_DISTANCE = 3;
  const FUZZY_SCORE = 60;

  for (const skill of skills) {
    const distance = leven(serviceType, skill);
    if (distance <= MAX_DISTANCE) {
      return FUZZY_SCORE;
    }
  }

  return 0;
}

/**
 * Get general/handyman match score (40-50%)
 */
function getGeneralMatchScore(skills: string[]): number {
  const generalKeywords = ['general', 'maintenance', 'repair', 'repairs', 'service'];
  const matchedGeneral = skills.filter((skill) =>
    generalKeywords.some((keyword) => skill.includes(keyword))
  );

  if (matchedGeneral.length > 0) {
    return 45; // Moderate score for general skills
  }

  return 0;
}

/**
 * Get detailed match result with scoring information
 */
export function getDetailedSkillMatch(
  expertSkills: string,
  serviceType: string,
  urgency: string
): SkillMatchResult {
  const skillsList = expertSkills
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const serviceKey = serviceType.toLowerCase().trim();

  // Try exact match
  if (getExactMatchScore(serviceKey, skillsList) > 0) {
    return {
      score: 100,
      matchType: 'exact',
      confidence: 1.0,
    };
  }

  // Try category match
  const categoryScore = getCategoryMatchScore(serviceKey, skillsList);
  if (categoryScore > 0) {
    return {
      score: categoryScore,
      matchType: 'category',
      confidence: categoryScore / 100,
    };
  }

  // Try fuzzy match
  const fuzzyScore = getFuzzyMatchScore(serviceKey, skillsList);
  if (fuzzyScore > 0) {
    return {
      score: fuzzyScore,
      matchType: 'fuzzy',
      confidence: fuzzyScore / 100,
    };
  }

  // Check general
  const generalScore = getGeneralMatchScore(skillsList);
  if (generalScore > 0) {
    return {
      score: generalScore,
      matchType: 'fuzzy',
      confidence: 0.4,
    };
  }

  // No match
  return {
    score: 30,
    matchType: 'none',
    confidence: 0.3,
  };
}
