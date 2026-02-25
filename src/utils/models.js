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
    members: Array.isArray(payload.members) ? payload.members : [],
    invited: Array.isArray(payload.invited) ? payload.invited : [],
    createdAt: now,
    updatedAt: now,
    createdBy: payload.createdBy || '',
  }
}

export function normalizeProjectModel(project) {
  const members = Array.isArray(project?.members) ? project.members : []
  const invitedFromLegacy = Array.isArray(project?.invitedMemberIds) ? project.invitedMemberIds : []
  const invited = Array.isArray(project?.invited) ? project.invited : invitedFromLegacy

  return {
    ...project,
    id: toSlug(project?.id),
    name: project?.name?.trim() || '',
    description: project?.description?.trim() || '',
    coverPhoto: project?.coverPhoto || '',
    visibility:
      project?.visibility === PROJECT_VISIBILITY.PUBLIC
        ? PROJECT_VISIBILITY.PUBLIC
        : PROJECT_VISIBILITY.PRIVATE,
    toggles: normalizeToggles({
      ...DEFAULT_PROJECT_TOGGLES,
      ...project?.toggles,
    }),
    members: members
      .filter((member) => member?.userId)
      .map((member) => ({
        userId: member.userId,
        roleInProject: member.roleInProject === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      })),
    invited: invited.filter(Boolean),
    createdAt: project?.createdAt || new Date().toISOString(),
    updatedAt: project?.updatedAt || new Date().toISOString(),
    createdBy: project?.createdBy || '',
  }
}
