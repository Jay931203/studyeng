const PRIVILEGED_ADMIN_EMAILS = new Set(['hyunjae.park93@gmail.com'])

export function normalizeAdminEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? ''
}

export function isPrivilegedAdminEmail(email?: string | null) {
  const normalized = normalizeAdminEmail(email)
  return normalized.length > 0 && PRIVILEGED_ADMIN_EMAILS.has(normalized)
}
