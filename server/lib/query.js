// Express parses a repeated query parameter (?tutor_id=a&tutor_id=b) into an
// array, and an object-style one (?tutor_id[x]=1) into an object. Neither can
// be handed to a SQLite bind parameter, so collapse to a single string.
export function firstQueryValue(value) {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return firstQueryValue(value[0]);
  if (typeof value !== 'string') return undefined;
  return value;
}
