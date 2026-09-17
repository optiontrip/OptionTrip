// Shared text-quality guardrails for multilingual Vi/UI output.
// Do not trim inline fragments independently: doing so is a common cause of words
// visually merging around translated links, bold spans and other inline elements.
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;
const BAD_CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

export const sanitizeLocalizedText = (value) => String(value ?? '')
  .replace(ZERO_WIDTH, '')
  .replace(BAD_CONTROL, '')
  .replace(/\u00A0/g, ' ');

export const joinInlineText = (...parts) => {
  const cleaned = parts
    .filter(part => part !== undefined && part !== null && String(part) !== '')
    .map(part => sanitizeLocalizedText(part).trim());
  return cleaned.join(' ').replace(/[ \t]{2,}/g, ' ');
};

export const hasSuspiciousMergedBoundary = (left, right) => {
  const a = sanitizeLocalizedText(left);
  const b = sanitizeLocalizedText(right);
  if (!a || !b) return false;
  return /[\p{L}\p{N}]$/u.test(a) && /^[\p{L}\p{N}]/u.test(b);
};

export const ensureInlineBoundary = (left, right) => {
  const a = sanitizeLocalizedText(left);
  const b = sanitizeLocalizedText(right);
  if (!a) return b;
  if (!b) return a;
  return hasSuspiciousMergedBoundary(a, b) ? `${a} ${b}` : `${a}${b}`;
};

export const VI_MULTILINGUAL_QUALITY_PROMPT = `
# Multilingual quality
Use natural human wording in the user's language, not literal machine-translation phrasing.
Never concatenate words around bold text, links, inline labels or translated fragments.
Preserve normal word boundaries in Latin, Cyrillic and other scripts.
Do not translate product/brand names unless an established localized name exists.
For navigation labels, choose the term a native speaker would expect in a travel product, not a literal dictionary translation.
`;
