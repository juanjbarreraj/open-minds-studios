// Convert SQLite rows to API JSON: integer flags become booleans, and
// created_at/updated_at are also exposed as created_date/updated_date because
// the frontend has always sorted and displayed those field names.

const BOOLEAN_FIELDS = new Set([
  'approved',
  'can_access_student_portal',
  'can_access_manager_dashboard',
  'is_super_admin',
  'is_active',
]);

export function serializeRow(row) {
  if (!row) return row;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = BOOLEAN_FIELDS.has(key) ? Boolean(value) : value;
  }
  if (out.created_at && out.created_date === undefined) out.created_date = out.created_at;
  if (out.updated_at && out.updated_date === undefined) out.updated_date = out.updated_at;
  return out;
}

export const serializeRows = (rows) => rows.map(serializeRow);

export function pick(obj, keys) {
  const out = {};
  for (const key of keys) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}
