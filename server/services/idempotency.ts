export function isValidIdempotencyKey(key: unknown): boolean {
  if (typeof key !== 'string') return false;
  const trimmed = key.trim();
  return trimmed.length >= 16 && trimmed.length <= 128;
}
