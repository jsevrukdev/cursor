export const SEED_PROMPT = `30 seconds, 9:16, UGC. A product designer in a Berlin kitchen at 7am. She pours coffee, opens a laptop on the counter, and the screen shows a messy Figma file snapping into a clean design system. She looks at the camera, slightly unimpressed, and says: “That used to take my whole Monday.” Cut to the same screen, now a customer dashboard with one big green ‘shipped’ badge. Soft morning light, handheld, no logo until the last second.`;

export const TONES = ["UGC", "cinematic", "explainer"] as const;
export const ASPECTS = ["9:16", "16:9", "1:1"] as const;
export const DURATIONS = [15000, 30000, 45000] as const;
