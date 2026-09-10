import * as chrono from "chrono-node";

/**
 * Priority keywords patterns:
 * High: "urgent", "asap", "high priority", "important"
 * Low: "low priority", "whenever", "no rush"
 */
const HIGH_PRIORITY_REGEX = /\b(urgent|asap|high priority|important)\b/gi;
const LOW_PRIORITY_REGEX = /\b(low priority|whenever|no rush)\b/gi;

/**
 * Parses a natural language sentence and extracts:
 * - title: cleaned task description (trimmed, capitalized)
 * - dueDate: ISO date string or null
 * - priority: "high" | "medium" | "low"
 * - confidence: "high" | "low" (low if no valid date detected)
 *
 * @param {string} text - Raw natural language input sentence
 * @returns {{ title: string, dueDate: string | null, priority: "high" | "medium" | "low", confidence: "high" | "low" }}
 */
export function parseTaskInput(text) {
  // 1. Guard against empty, null, or whitespace-only input
  if (!text || typeof text !== "string" || !text.trim()) {
    return {
      title: "",
      dueDate: null,
      priority: "medium",
      confidence: "low",
    };
  }

  let rawText = text.trim();
  let dueDate = null;
  let confidence = "low";
  let matchedDatePhrase = "";

  // 2. Date/Time phrase extraction via chrono-node
  const chronoResults = chrono.parse(rawText);
  if (chronoResults && chronoResults.length > 0) {
    const firstDateResult = chronoResults[0];
    const jsDate = firstDateResult.start.date();

    if (jsDate && !isNaN(jsDate.getTime())) {
      dueDate = jsDate.toISOString();
      confidence = "high";
      matchedDatePhrase = firstDateResult.text;
    }
  }

  // 3. Priority detection
  let priority = "medium";
  if (HIGH_PRIORITY_REGEX.test(rawText)) {
    priority = "high";
  } else if (LOW_PRIORITY_REGEX.test(rawText)) {
    priority = "low";
  }

  // 4. Clean text for title: remove matched date phrase and priority keywords
  let cleaned = rawText;

  // Remove matched date phrase if detected
  if (matchedDatePhrase) {
    cleaned = cleaned.replace(matchedDatePhrase, " ");
  }

  // Remove priority keywords
  cleaned = cleaned.replace(HIGH_PRIORITY_REGEX, " ");
  cleaned = cleaned.replace(LOW_PRIORITY_REGEX, " ");

  // Clean redundant whitespace and surrounding punctuation (colons, commas, dashes)
  cleaned = cleaned
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[\s,:\-\.\;]+|[\s,:\-\.\;]+$/g, "")
    .trim();

  // Capitalize first character of the remaining title
  let title = "";
  if (cleaned.length > 0) {
    title = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return {
    title,
    dueDate,
    priority,
    confidence,
  };
}

export default parseTaskInput;
