/**
 * Parsed lifeline title structure for person vs list lifelines
 */
export interface ParsedLifelineTitle {
  personName: string | null;  // e.g., "EDWINA SHARMA"
  contextTitle: string;       // e.g., "The Diamond's Journey"
  fullTitle: string;          // Original combined title
  isPersonType: boolean;
}

/**
 * Parse a lifeline title to extract person name and context for person-type lifelines.
 * For person lifelines with a colon, splits at the first colon.
 * For list lifelines or titles without colons, returns the full title unchanged.
 * 
 * @param title - The full title string (e.g., "Edwina Sharma: The Diamond's Journey")
 * @param lifelineType - The type of lifeline ("person" or "list")
 * @returns ParsedLifelineTitle object with personName, contextTitle, fullTitle, and isPersonType
 */
export function parseLifelineTitle(
  title: string,
  lifelineType: string
): ParsedLifelineTitle {
  // Only parse for person type lifelines with a colon
  if (lifelineType === 'person' && title.includes(':')) {
    const colonIndex = title.indexOf(':');
    const personName = title.substring(0, colonIndex).trim();
    const contextTitle = title.substring(colonIndex + 1).trim();
    
    return {
      personName,
      contextTitle,
      fullTitle: title,
      isPersonType: true,
    };
  }
  
  // For list type or titles without colons, return as-is
  return {
    personName: null,
    contextTitle: title,
    fullTitle: title,
    isPersonType: false,
  };
}
