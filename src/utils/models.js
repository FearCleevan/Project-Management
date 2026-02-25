export const PROJECT_VISIBILITY = {
  PRIVATE: 'PRIVATE',
  PUBLIC: 'PUBLIC',
}

export const DEFAULT_PROJECT_TOGGLES = {
  cycles: true,
  modules: true,
  views: true,
  pages: false,
  intake: false,
  timeTracking: false,
}

export function toSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function normalizeToggles(toggles) {
  return {
    cycles: Boolean(toggles?.cycles),
    modules: Boolean(toggles?.modules),
    views: Boolean(toggles?.views),
    pages: Boolean(toggles?.pages),
    intake: Boolean(toggles?.intake),
    timeTracking: Boolean(toggles?.timeTracking),
  }
}

export function createProjectModel(payload) {
  const now = new Date().toISOString()

  return {
    id: toSlug(payload.id),
    name: payload.name?.trim() || '',
    description: payload.description?.trim() || '',
    coverPhoto: payload.coverPhoto || '',
    visibility:
      payload.visibility === PROJECT_VISIBILITY.PUBLIC
        ? PROJECT_VISIBILITY.PUBLIC
        : PROJECT_VISIBILITY.PRIVATE,
    toggles: normalizeToggles({
      ...DEFAULT_PROJECT_TOGGLES,
      ...payload.toggles,
    }),
    invitedMemberIds: Array.isArray(payload.invitedMemberIds) ? payload.invitedMemberIds : [],
    createdAt: now,
    updatedAt: now,
    createdBy: payload.createdBy || '',
  }
}
