const BLOCKED = [
  /\b(child|minor|underage).{0,40}\b(sex|nude|porn)\b/i,
  /\b(rape|bestiality|incest)\b/i,
  /\b(beheading|dismember|gore porn)\b/i,
];

export function assertPromptAllowed(prompt: string): void {
  const text = prompt.trim();
  if (text.length < 12) {
    throw new Error("Prompt must be at least 12 characters");
  }
  if (text.length > 4000) {
    throw new Error("Prompt must be under 4,000 characters");
  }
  for (const pattern of BLOCKED) {
    if (pattern.test(text)) {
      throw new Error("This prompt is blocked by Shotline content policy");
    }
  }
}
