export function placeholderSvg(args: {
  title: string;
  action: string;
  index: number;
  aspect: "9:16" | "16:9" | "1:1";
}): string {
  const size =
    args.aspect === "16:9"
      ? { w: 1280, h: 720 }
      : args.aspect === "1:1"
        ? { w: 1024, h: 1024 }
        : { w: 720, h: 1280 };
  const lines = wrapText(args.action, 28).slice(0, 8);
  const font = Math.round(size.w / 22);
  const body = lines
    .map(
      (line, i) =>
        `<text x="8%" y="${32 + i * 4.2}%" fill="#d7c4a8" font-family="Georgia, serif" font-size="${Math.round(size.w / 26)}">${escapeXml(line)}</text>`,
    )
    .join("\n  ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size.w}" height="${size.h}" viewBox="0 0 ${size.w} ${size.h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1c1410"/>
      <stop offset="1" stop-color="#4a2e1c"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect x="6%" y="5%" width="88%" height="90%" fill="none" stroke="#e8d5b5" stroke-opacity="0.35" stroke-width="4"/>
  <text x="8%" y="12%" fill="#c45c26" font-family="Georgia, serif" font-size="${font + 8}" font-weight="700">${String(args.index).padStart(2, "0")}</text>
  <text x="8%" y="18%" fill="#f6efe4" font-family="Georgia, serif" font-size="${font}">${escapeXml(args.title)}</text>
  ${body}
</svg>`;
}

function wrapText(value: string, width: number): string[] {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
