import { create } from 'zustand'
import { projectsService } from '../services/projectsService'
import { canAccessProjectSettings } from '../utils/permissions'
import { PROJECT_VISIBILITY } from '../utils/models'

function canViewProject(project, userId) {
  if (!project || !userId) {
    return false
  }

  if (project.visibility === PROJECT_VISIBILITY.PUBLIC) {
    return true
  }

  if (project.createdBy === userId) {
    return true
  }

  return Array.isArray(project.invitedMemberIds) && project.invitedMemberIds.includes(userId)
}

export const useProjectsStore = create((set, get) => ({
  projects: [],
  loadProjects: () => {
    const projects = projectsService.listProjects()
    set({ projects })
    return projects
  },
  createProject: ({ actor, payload }) => {
    if (!canAccessProjectSettings(actor)) {
      throw new Error('Only admins can create projects.')
    }

    const project = projectsService.createProject({
      ...payload,
      createdBy: actor.id,
    })
    set((state) => ({
      projects: [...state.projects, project],
    }))
    return project
  },
  updateProject: ({ actor, projectId, patch }) => {
    if (!canAccessProjectSettings(actor)) {
      throw new Error('Only admins can edit project settings.')
    }

    const updated = projectsService.updateProject(projectId, patch)
    set((state) => ({
      projects: state.projects.map((project) => (project.id === projectId ? updated : project)),
    }))
    return updated
  },
  listVisibleProjects: (userId) => get().projects.filter((project) => canViewProject(project, userId)),
  getProjectForUser: (projectId, userId) => {
    const project = get().projects.find((item) => item.id === projectId)
    if (!project) {
      return null
    }

    return canViewProject(project, userId) ? project : null
  },
}))
