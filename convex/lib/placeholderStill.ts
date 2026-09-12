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
  const action = escapeXml(args.action.slice(0, 140));
  const title = escapeXml(args.title);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size.w}" height="${size.h}" viewBox="0 0 ${size.w} ${size.h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1c1410"/>
      <stop offset="1" stop-color="#4a2e1c"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="8%" y="12%" fill="#e8d5b5" font-family="Georgia, serif" font-size="${Math.round(size.w / 18)}" font-weight="700">${String(args.index).padStart(2, "0")}</text>
  <text x="8%" y="20%" fill="#f6efe4" font-family="Georgia, serif" font-size="${Math.round(size.w / 22)}">${title}</text>
  <foreignObject x="8%" y="28%" width="84%" height="60%">
    <p xmlns="http://www.w3.org/1999/xhtml" style="color:#d7c4a8;font:500 ${Math.round(size.w / 28)}px/1.35 IBM Plex Sans, sans-serif;margin:0">${action}</p>
  </foreignObject>
</svg>`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
