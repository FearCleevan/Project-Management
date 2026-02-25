import { repo } from './repo'
import {
  ACTIVITY_TYPES,
  createActivity,
  createWorkItemModel,
  normalizeWorkItemModel,
} from '../utils/models'

const WORK_ITEMS_KEY = 'pm_work_items_v1'

function listAll() {
  return repo.list(WORK_ITEMS_KEY).map(normalizeWorkItemModel)
}

function listByProject(projectId) {
  return listAll().filter((item) => item.projectId === projectId)
}

function get(workItemId) {
  const raw = repo.getById(WORK_ITEMS_KEY, workItemId)
  return raw ? normalizeWorkItemModel(raw) : null
}

function create(projectId, payload) {
  const item = normalizeWorkItemModel(
    createWorkItemModel({
      ...payload,
      projectId,
    }),
  )

  if (!item.title) {
    throw new Error('Title is required.')
  }

  const exists = get(item.id)
  if (exists) {
    throw new Error('Work item ID already exists.')
  }

  return repo.create(WORK_ITEMS_KEY, item)
}

function update(workItemId, patch) {
  const current = get(workItemId)
  if (!current) {
    throw new Error('Work item not found.')
  }

  const nextAttachments = patch.attachments || current.attachments
  const attachmentsAdded = Array.isArray(patch.attachments)
    && patch.attachments.length > current.attachments.length

  const nextActivities = [...current.activities]
  if (Array.isArray(patch.activities)) {
    nextActivities.push(...patch.activities.map((activity) => createActivity(activity)))
  }

  const changedFields = Object.keys(patch).filter((key) => {
    if (['activities', 'attachments'].includes(key)) {
      return false
    }
    return patch[key] !== current[key]
  })

  changedFields.forEach((field) => {
    nextActivities.push(
      createActivity({
        type: ACTIVITY_TYPES.FIELD_CHANGE,
        message: `${field} updated`,
        createdBy: patch.updatedBy || current.createdBy,
      }),
    )
  })

  if (attachmentsAdded) {
    nextActivities.push(
      createActivity({
        type: ACTIVITY_TYPES.ATTACHMENT_ADDED,
        message: 'Attachment added',
        createdBy: patch.updatedBy || current.createdBy,
      }),
    )
  }

  const updated = normalizeWorkItemModel({
    ...current,
    ...patch,
    attachments: nextAttachments,
    activities: nextActivities,
    updatedAt: new Date().toISOString(),
  })

  return repo.update(WORK_ITEMS_KEY, workItemId, updated)
}

function addComment(workItemId, html, createdBy) {
  const current = get(workItemId)
  if (!current) {
    throw new Error('Work item not found.')
  }

  const nextActivities = [
    ...current.activities,
    createActivity({
      type: ACTIVITY_TYPES.COMMENT,
      html,
      message: 'Comment added',
      createdBy,
    }),
  ]

  const updated = normalizeWorkItemModel({
    ...current,
    activities: nextActivities,
    updatedAt: new Date().toISOString(),
  })

  return repo.update(WORK_ITEMS_KEY, workItemId, updated)
}

function moveStatus(workItemId, newState, createdBy) {
  const current = get(workItemId)
  if (!current) {
    throw new Error('Work item not found.')
  }

  const nextActivities = [
    ...current.activities,
    createActivity({
      type: ACTIVITY_TYPES.STATUS_CHANGE,
      message: `Status changed from "${current.state}" to "${newState}"`,
      createdBy,
    }),
  ]

  const updated = normalizeWorkItemModel({
    ...current,
    state: newState,
    activities: nextActivities,
    updatedAt: new Date().toISOString(),
  })

  return repo.update(WORK_ITEMS_KEY, workItemId, updated)
}

export const workItemsService = {
  listByProject,
  get,
  create,
  update,
  addComment,
  moveStatus,
}
