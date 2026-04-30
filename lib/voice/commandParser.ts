import { isValid, parse } from 'date-fns';

export type VoiceCommandAction = 'save-entry' | 'set-schedule' | 'dictation' | 'unknown';

export interface ParsedVoiceCommand {
  action: VoiceCommandAction;
  transcript: string;
  confidence: 'high' | 'medium' | 'low';
  indoorSowDate?: Date;
  transplantDate?: Date;
}

const SAVE_ENTRY_PATTERNS = [
  /\bsave entry\b/i,
  /\bsave (this )?(seed|supplier|event|changes)\b/i,
  /\bsubmit (entry|form|changes)\b/i,
  /\bupdate entry\b/i,
];

const DATE_FORMATS = [
  'MMMM d yyyy',
  'MMMM d',
  'MMM d yyyy',
  'MMM d',
  'M/d/yyyy',
  'M/d',
];

function normalizeTranscript(transcript: string): string {
  return transcript
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,]/g, ' ')
    .trim();
}

function parseLooseDate(rawValue: string): Date | undefined {
  const normalized = normalizeTranscript(rawValue);
  const withCurrentYear = `${normalized} ${new Date().getFullYear()}`;

  for (const format of DATE_FORMATS) {
    try {
      const candidate = parse(
        format.includes('yyyy') ? normalized : withCurrentYear,
        format,
        new Date()
      );

      if (isValid(candidate)) {
        return candidate;
      }
    } catch {
      // date-fns can throw on pathological input — skip this format
    }
  }

  return undefined;
}

function extractDateForKeywords(transcript: string, keywords: string[]): Date | undefined {
  const normalized = normalizeTranscript(transcript.toLowerCase());

  for (const keyword of keywords) {
    const index = normalized.indexOf(keyword);
    if (index === -1) continue;

    const segment = normalized.slice(index + keyword.length).trim();
    const stopIndex = segment.search(/\b(and|then|save|submit)\b/);
    const dateCandidate = stopIndex === -1 ? segment : segment.slice(0, stopIndex).trim();
    const parsed = parseLooseDate(dateCandidate);

    if (parsed) {
      return parsed;
    }
  }

  return undefined;
}

export function isSaveEntryCommand(transcript: string): boolean {
  return SAVE_ENTRY_PATTERNS.some((pattern) => pattern.test(transcript));
}

export function parseVoiceCommand(transcript: string): ParsedVoiceCommand {
  const normalized = normalizeTranscript(transcript);

  if (!normalized) {
    return {
      action: 'unknown',
      transcript,
      confidence: 'low',
    };
  }

  if (isSaveEntryCommand(normalized)) {
    return {
      action: 'save-entry',
      transcript: normalized,
      confidence: 'high',
    };
  }

  const indoorSowDate = extractDateForKeywords(normalized, ['sow indoors', 'start indoors', 'indoors']);
  const transplantDate = extractDateForKeywords(normalized, ['transplant outdoors', 'transplant outside', 'transplant']);

  if (indoorSowDate || transplantDate) {
    return {
      action: 'set-schedule',
      transcript: normalized,
      confidence: indoorSowDate && transplantDate ? 'high' : 'medium',
      indoorSowDate,
      transplantDate,
    };
  }

  return {
    action: 'dictation',
    transcript: normalized,
    confidence: 'low',
  };
}