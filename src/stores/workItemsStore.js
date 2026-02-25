import { create } from 'zustand'
import { workItemsService } from '../services/workItemsService'
import { canComment, canEditTicket, canMoveTicket } from '../utils/permissions'

export const useWorkItemsStore = create((set, get) => ({
  items: [],
  hasLoaded: false,
  loadByProject: (projectId) => {
    const projectItems = workItemsService.listByProject(projectId)
    set((state) => {
      const nonProjectItems = state.items.filter((item) => item.projectId !== projectId)
      return {
        items: [...nonProjectItems, ...projectItems],
        hasLoaded: true,
      }
    })
    return projectItems
  },
  get: (workItemId) => get().items.find((item) => item.id === workItemId) || workItemsService.get(workItemId),
  create: ({ actor, projectId, payload }) => {
    if (!canEditTicket(actor)) {
      throw new Error('Only admins can create tickets.')
    }

    const created = workItemsService.create(projectId, {
      ...payload,
      createdBy: actor.id,
    })
    set((state) => ({
      items: [...state.items, created],
    }))
    return created
  },
  update: ({ actor, workItemId, patch }) => {
    if (!canEditTicket(actor)) {
      throw new Error('You do not have permission to edit ticket fields.')
    }

    const updated = workItemsService.update(workItemId, {
      ...patch,
      updatedBy: actor.id,
    })
    set((state) => ({
      items: state.items.map((item) => (item.id === workItemId ? updated : item)),
    }))
    return updated
  },
  addComment: ({ actor, workItemId, html }) => {
    if (!canComment(actor)) {
      throw new Error('You do not have permission to comment.')
    }

    if (!html?.trim()) {
      throw new Error('Comment cannot be empty.')
    }

    const updated = workItemsService.addComment(workItemId, html, actor.id)
    set((state) => ({
      items: state.items.map((item) => (item.id === workItemId ? updated : item)),
    }))
    return updated
  },
  moveStatus: ({ actor, workItemId, newState }) => {
    if (!canMoveTicket(actor)) {
      throw new Error('You do not have permission to move ticket status.')
    }

    const updated = workItemsService.moveStatus(workItemId, newState, actor.id)
    set((state) => ({
      items: state.items.map((item) => (item.id === workItemId ? updated : item)),
    }))
    return updated
  },
}))
