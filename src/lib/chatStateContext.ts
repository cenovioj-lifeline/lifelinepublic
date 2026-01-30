// Chat State Machine for AI Assist Mode
// This file defines states, transitions, and context injection for the chatbot

export type ChatState =
  | 'idle'                    // No lifeline, waiting for user intent
  | 'gathering_lifeline'      // Collecting title, purpose
  | 'lifeline_ready'          // All fields filled, ready to save
  | 'prompting_entries'       // Lifeline saved, explaining entries
  | 'gathering_entry'         // Collecting entry fields
  | 'entry_ready'             // All entry fields filled, ready to save
  | 'entry_saved';            // Just saved, prompt for next

export interface LifelineFormState {
  title: string;
  lifeline_type: string;
  purpose: string;
}

export interface EntryFormState {
  title: string;
  description: string;
  score: number;
  year: string;
}

// Check if lifeline form is complete
export function isLifelineComplete(form: LifelineFormState): boolean {
  return Boolean(form.title?.trim() && form.purpose?.trim());
}

// Check if entry form is complete
export function isEntryComplete(form: EntryFormState): boolean {
  return Boolean(
    form.title?.trim() &&
    form.description?.trim() &&
    form.score !== undefined &&
    form.year?.trim()
  );
}

// Get missing fields for lifeline
export function getMissingLifelineFields(form: LifelineFormState): string[] {
  const missing: string[] = [];
  if (!form.title?.trim()) missing.push('title');
  if (!form.purpose?.trim()) missing.push('purpose');
  return missing;
}

// Get missing fields for entry
export function getMissingEntryFields(form: EntryFormState): string[] {
  const missing: string[] = [];
  if (!form.title?.trim()) missing.push('title');
  if (!form.description?.trim()) missing.push('description');
  if (form.score === undefined || form.score === null) missing.push('score');
  if (!form.year?.trim()) missing.push('year');
  return missing;
}

// State-specific context to inject into the AI prompt
export interface StateContext {
  instruction: string;       // What AI should do in this state
  fallbackMessage: string;   // If AI doesn't respond well, show this
}

export const STATE_CONTEXTS: Record<ChatState, StateContext> = {
  idle: {
    instruction: `User hasn't started yet. Wait for them to say what they want. If they say "new lifeline" or similar, proceed immediately - don't offer alternatives.`,
    fallbackMessage: `What would you like to create today?`
  },

  gathering_lifeline: {
    instruction: `User is creating a lifeline. Check MISSING_FIELDS. Ask for ONE missing field. If user provides info, extract it and fill the form. Keep responses to 1 sentence + 1 question.`,
    fallbackMessage: `What would you like to call this lifeline?`
  },

  lifeline_ready: {
    instruction: `All lifeline fields are filled. Confirm the details briefly and call save_lifeline. Then explain entries.`,
    fallbackMessage: `Ready to save your lifeline!`
  },

  prompting_entries: {
    instruction: `Lifeline was just saved. Briefly explain that entries are moments in the story, scored -10 to +10 for how they felt. Ask for their first entry.`,
    fallbackMessage: `Lifeline saved! Now let's add some entries. What's a meaningful moment you'd like to capture?`
  },

  gathering_entry: {
    instruction: `User is creating an entry. Check MISSING_FIELDS. Ask for ONE missing field. Extract any info user provides. For score, help them think about how it FELT (-10 worst to +10 best).`,
    fallbackMessage: `Tell me more about this moment.`
  },

  entry_ready: {
    instruction: `All entry fields filled. Briefly confirm and call save_entry.`,
    fallbackMessage: `Ready to save this entry!`
  },

  entry_saved: {
    instruction: `Entry was just saved. Brief celebration (1 sentence max), then ask for next entry.`,
    fallbackMessage: `Entry saved! Want to add another?`
  }
};

// Determine next state based on current state and what just happened
export function getNextState(
  currentState: ChatState,
  lifelineForm: LifelineFormState,
  entryForm: EntryFormState,
  lifelineSaved: boolean,
  justSavedLifeline: boolean,
  justSavedEntry: boolean
): ChatState {
  // Just saved entry -> entry_saved
  if (justSavedEntry) {
    return 'entry_saved';
  }

  // Just saved lifeline -> prompting_entries
  if (justSavedLifeline) {
    return 'prompting_entries';
  }

  // No lifeline yet
  if (!lifelineSaved) {
    // Check if lifeline form is complete
    if (isLifelineComplete(lifelineForm)) {
      return 'lifeline_ready';
    }
    // Check if we've started gathering (has any content)
    if (lifelineForm.title || lifelineForm.purpose) {
      return 'gathering_lifeline';
    }
    return 'idle';
  }

  // Lifeline exists - working on entries
  if (lifelineSaved) {
    // Check if entry form is complete
    if (isEntryComplete(entryForm)) {
      return 'entry_ready';
    }
    // Check if we've started gathering entry (has any content)
    if (entryForm.title || entryForm.description || entryForm.year) {
      return 'gathering_entry';
    }
    // After entry_saved, stay there briefly (will transition on next interaction)
    if (currentState === 'entry_saved') {
      return 'gathering_entry';
    }
    return 'prompting_entries';
  }

  return currentState;
}

// Build the context string to inject into the AI message
export function buildStateContext(
  state: ChatState,
  lifelineForm: LifelineFormState,
  entryForm: EntryFormState,
  existingLifelineTitle?: string
): string {
  const context = STATE_CONTEXTS[state];

  let stateInfo = `\n\n---\nSTATE: ${state}\nINSTRUCTION: ${context.instruction}`;

  // If user has existing lifeline, mention it but don't dwell on it
  if (existingLifelineTitle && state === 'idle') {
    stateInfo += `\nNOTE: User has existing lifeline "${existingLifelineTitle}" but if they ask for new, CREATE NEW. Don't ask if they're sure.`;
  }

  // Add missing fields info for gathering states
  if (state === 'gathering_lifeline' || state === 'lifeline_ready') {
    const missing = getMissingLifelineFields(lifelineForm);
    stateInfo += `\nMISSING_FIELDS: ${missing.length > 0 ? missing.join(', ') : 'none - call save_lifeline'}`;
    stateInfo += `\nFILLED: title="${lifelineForm.title || ''}", purpose="${lifelineForm.purpose || ''}"`;
  }

  if (state === 'gathering_entry' || state === 'entry_ready') {
    const missing = getMissingEntryFields(entryForm);
    stateInfo += `\nMISSING_FIELDS: ${missing.length > 0 ? missing.join(', ') : 'none - call save_entry'}`;
    stateInfo += `\nFILLED: title="${entryForm.title || ''}", description="${entryForm.description || ''}", score=${entryForm.score}, year="${entryForm.year || ''}"`;
  }

  stateInfo += `\n\nRESPOND IN 1-2 SENTENCES MAX. ONE QUESTION ONLY. NO BULLET LISTS.`;

  return stateInfo;
}

// Validate AI response - check if it follows the rules
export interface ResponseValidation {
  hasQuestion: boolean;
  hasBulletList: boolean;
  sentenceCount: number;
  offersAlternatives: boolean;
}

export function validateResponse(text: string): ResponseValidation {
  return {
    hasQuestion: text.includes('?'),
    hasBulletList: /^[\s]*[-*•]\s+/m.test(text),
    sentenceCount: (text.match(/[.!?]+/g) || []).length,
    offersAlternatives: /would you like to .* or /i.test(text)
  };
}

// Fix response if it doesn't follow rules
export function fixResponse(
  text: string,
  state: ChatState,
  validation: ResponseValidation
): string {
  let fixed = text;

  // Remove bullet lists - convert to prose
  if (validation.hasBulletList) {
    fixed = fixed.replace(/^[\s]*[-*•]\s+/gm, '');
    // Clean up extra newlines from removed bullets
    fixed = fixed.replace(/\n{2,}/g, ' ');
  }

  // Remove "would you like X or Y" patterns
  if (validation.offersAlternatives) {
    fixed = fixed.replace(/would you like to .*\?/gi, '');
    fixed = fixed.trim();
  }

  // If no question and state requires one, append fallback
  const statesRequiringQuestion: ChatState[] = [
    'idle',
    'gathering_lifeline',
    'gathering_entry',
    'prompting_entries',
    'entry_saved'
  ];

  if (!validation.hasQuestion && statesRequiringQuestion.includes(state)) {
    const context = STATE_CONTEXTS[state];
    // Only add if we have content (don't double up)
    if (fixed.trim()) {
      fixed = fixed.trim() + ' ' + context.fallbackMessage;
    } else {
      fixed = context.fallbackMessage;
    }
  }

  return fixed.trim();
}
