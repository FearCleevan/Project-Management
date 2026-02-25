export const PROJECT_VISIBILITY = {
  PRIVATE: 'PRIVATE',
  PUBLIC: 'PUBLIC',
}

export const WORK_ITEM_PRIORITIES = {
  NONE: 'NONE',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
}

export const ACTIVITY_TYPES = {
  COMMENT: 'COMMENT',
  FIELD_CHANGE: 'FIELD_CHANGE',
  STATUS_CHANGE: 'STATUS_CHANGE',
  ATTACHMENT_ADDED: 'ATTACHMENT_ADDED',
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

function createWorkItemId(projectId) {
  return `${projectId || 'ticket'}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
}

function normalizePriority(priority) {
  if (Object.values(WORK_ITEM_PRIORITIES).includes(priority)) {
    return priority
  }

  return WORK_ITEM_PRIORITIES.NONE
}

function normalizeAttachments(attachments) {
  return (Array.isArray(attachments) ? attachments : [])
    .filter((item) => item?.name && item?.dataUrl)
    .map((item) => ({
      name: item.name,
      type: item.type || 'application/octet-stream',
      dataUrl: item.dataUrl,
      createdAt: item.createdAt || new Date().toISOString(),
      createdBy: item.createdBy || '',
    }))
}

function normalizeActivities(activities) {
  return (Array.isArray(activities) ? activities : [])
    .filter((item) => item?.type)
    .map((item) => ({
      id: item.id || `act_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      type: item.type,
      message: item.message || '',
      html: item.html || '',
      createdAt: item.createdAt || new Date().toISOString(),
      createdBy: item.createdBy || '',
    }))
}

export function createActivity(payload) {
  return {
    id: payload.id || `act_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    type: payload.type,
    message: payload.message || '',
    html: payload.html || '',
    createdAt: payload.createdAt || new Date().toISOString(),
    createdBy: payload.createdBy || '',
  }
}

export function createWorkItemModel(payload) {
  const now = new Date().toISOString()

  return {
    id: payload.id || createWorkItemId(payload.projectId),
    projectId: payload.projectId || '',
    title: payload.title?.trim() || '',
    descriptionHtml: payload.descriptionHtml || '',
    state: payload.state || 'Todo',
    priority: normalizePriority(payload.priority),
    labels: Array.isArray(payload.labels) ? payload.labels : [],
    assigneeId: payload.assigneeId || null,
    startDate: payload.startDate || null,
    dueDate: payload.dueDate || null,
    estimate: typeof payload.estimate === 'number' ? payload.estimate : null,
    moduleId: payload.moduleId || null,
    attachments: normalizeAttachments(payload.attachments),
    subItemIds: Array.isArray(payload.subItemIds) ? payload.subItemIds : [],
    activities: normalizeActivities(payload.activities),
    createdBy: payload.createdBy || '',
    createdAt: now,
    updatedAt: now,
  }
}

export function normalizeWorkItemModel(item) {
  return {
    ...item,
    id: item?.id || createWorkItemId(item?.projectId),
    projectId: item?.projectId || '',
    title: item?.title?.trim() || '',
    descriptionHtml: item?.descriptionHtml || '',
    state: item?.state || 'Todo',
    priority: normalizePriority(item?.priority),
    labels: Array.isArray(item?.labels) ? item.labels : [],
    assigneeId: item?.assigneeId || null,
    startDate: item?.startDate || null,
    dueDate: item?.dueDate || null,
    estimate: typeof item?.estimate === 'number' ? item.estimate : null,
    moduleId: item?.moduleId || null,
    attachments: normalizeAttachments(item?.attachments),
    subItemIds: Array.isArray(item?.subItemIds) ? item.subItemIds : [],
    activities: normalizeActivities(item?.activities),
    createdBy: item?.createdBy || '',
    createdAt: item?.createdAt || new Date().toISOString(),
    updatedAt: item?.updatedAt || new Date().toISOString(),
  }
}
