const DISALLOWED_PATTERNS: RegExp[] = [
  /@import/gi,
  /expression\s*\(/gi,
  /javascript:/gi,
  /<\s*\/?\s*script/gi,
  /url\s*\(\s*["']?\s*javascript:/gi,
];

export function validateCustomCss(customCss?: string): {
  isValid: boolean;
  reason?: string;
} {
  if (!customCss || !customCss.trim()) {
    return { isValid: true };
  }
  if (customCss.length > 20000) {
    return { isValid: false, reason: "Custom CSS exceeds size limit." };
  }
  for (const pattern of DISALLOWED_PATTERNS) {
    if (pattern.test(customCss)) {
      return { isValid: false, reason: "Custom CSS contains unsafe directives." };
    }
  }
  const open = (customCss.match(/{/g) ?? []).length;
  const close = (customCss.match(/}/g) ?? []).length;
  if (open !== close) {
    return { isValid: false, reason: "Custom CSS has unbalanced braces." };
  }
  return { isValid: true };
}

export function scopeCustomCss(scopeSelector: string, customCss: string): string {
  const trimmed = customCss.trim();
  if (!trimmed) return "";
  const blocks = trimmed
    .split("}")
    .map((b) => b.trim())
    .filter(Boolean);
  const scoped: string[] = [];
  for (const block of blocks) {
    const idx = block.indexOf("{");
    if (idx === -1) continue;
    const selector = block.slice(0, idx).trim();
    const body = block.slice(idx + 1).trim();
    if (!selector || !body) continue;
    if (selector.startsWith("@")) {
      // Keep at-rules as-is for now; they don't leak selectors directly.
      scoped.push(`${selector}{${body}}`);
      continue;
    }
    const expanded = selector
      .split(",")
      .map((s) => `${scopeSelector} ${s.trim()}`)
      .join(", ");
    scoped.push(`${expanded} { ${body} }`);
  }
  return scoped.join("\n");
}

