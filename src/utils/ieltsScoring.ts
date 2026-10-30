/**
 * Official IELTS Speaking Band Calculation & Formatting Utilities
 * Official IELTS band calculation rounds the average of 4 criteria:
 * - Fluency & Coherence (FC)
 * - Lexical Resource (LR)
 * - Grammatical Range & Accuracy (GRA)
 * - Pronunciation (PR)
 * 
 * Rounding rules:
 * - If average ends in .25, rounds up to the next half band (e.g. 6.25 -> 6.5)
 * - If average ends in .75, rounds up to the next whole band (e.g. 6.75 -> 7.0)
 * - If average is between .25 and .75 (e.g. 6.375), standard nearest half-band applies.
 */

export interface CriterionScores {
  fluency: number; // 0-9
  vocabulary: number; // 0-9
  grammar: number; // 0-9
  pronunciation: number; // 0-9
}

export interface GrammarCorrection {
  original: string;
  improved: string;
  explanationBengali: string;
  ruleCategory?: string;
}

export interface AnswerEvaluation {
  estimatedBand: number;
  oneSentenceFeedback: string;
  criteria: CriterionScores;
  grammarCorrections: GrammarCorrection[];
  vocabularySuggestions: Array<{
    used: string;
    suggested: string;
    context: string;
    bengaliMeaning?: string;
  }>;
  pausesAndRepetitions: string[];
  howToDevelop: string[];
  recurringHabitsNoticed?: string[];
  disclaimer: string;
}

/**
 * Calculates official IELTS overall band from 4 criterion scores.
 */
export function calculateOverallBand(criteria: CriterionScores): number {
  const avg = (criteria.fluency + criteria.vocabulary + criteria.grammar + criteria.pronunciation) / 4;
  return roundToIeltsBand(avg);
}

/**
 * Official IELTS rounding logic
 */
export function roundToIeltsBand(rawScore: number): number {
  if (rawScore <= 0) return 0;
  if (rawScore >= 9) return 9;

  const floor = Math.floor(rawScore);
  const decimal = rawScore - floor;

  if (decimal < 0.25) {
    return floor;
  } else if (decimal < 0.75) {
    return floor + 0.5;
  } else {
    return floor + 1.0;
  }
}

/**
 * Maps band score to official descriptor title
 */
export function getBandDescriptorTitle(band: number): string {
  if (band >= 8.5) return 'Expert / Very Good User';
  if (band >= 7.5) return 'Good / Very Good User';
  if (band >= 6.5) return 'Competent / Good User';
  if (band >= 5.5) return 'Modest / Competent User';
  if (band >= 4.5) return 'Limited User';
  return 'Intermittent / Basic User';
}

/**
 * Formats band score (e.g. 7 -> "7.0", 6.5 -> "6.5")
 */
export function formatBand(band: number): string {
  return band.toFixed(1);
}
