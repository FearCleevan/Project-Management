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

  const isMember = Array.isArray(project.members)
    && project.members.some((member) => member.userId === userId)
  if (isMember) {
    return true
  }

  return Array.isArray(project.invited) && project.invited.includes(userId)
}

export const useProjectsStore = create((set, get) => ({
  projects: [],
  hasLoaded: false,
  loadProjects: () => {
    const projects = projectsService.listProjects()
    set({ projects, hasLoaded: true })
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
  inviteProjectMember: ({ actor, projectId, userId }) => {
    const project = get().projects.find((item) => item.id === projectId)
    if (!project) {
      throw new Error('Project not found.')
    }

    if (!canAccessProjectSettings(actor)) {
      throw new Error('Only admins can invite project members.')
    }

    if (project.createdBy === userId) {
      throw new Error('Project creator is already part of the project.')
    }

    const isAlreadyMember = Array.isArray(project.members)
      && project.members.some((member) => member.userId === userId)
    if (isAlreadyMember) {
      throw new Error('User is already a project member.')
    }

    const invited = Array.isArray(project.invited) ? project.invited : []
    if (invited.includes(userId)) {
      throw new Error('User is already invited.')
    }

    const updated = projectsService.updateProject(projectId, {
      invited: [...invited, userId],
    })

    set((state) => ({
      projects: state.projects.map((item) => (item.id === projectId ? updated : item)),
    }))

    return updated
  },
  removeProjectMember: ({ actor, projectId, userId }) => {
    const project = get().projects.find((item) => item.id === projectId)
    if (!project) {
      throw new Error('Project not found.')
    }

    if (!canAccessProjectSettings(actor)) {
      throw new Error('Only admins can remove project members.')
    }

    if (project.createdBy === userId) {
      throw new Error('Project creator cannot be removed.')
    }

    const members = Array.isArray(project.members) ? project.members : []
    const invited = Array.isArray(project.invited) ? project.invited : []

    const nextMembers = members.filter((member) => member.userId !== userId)
    const nextInvited = invited.filter((id) => id !== userId)

    const updated = projectsService.updateProject(projectId, {
      members: nextMembers,
      invited: nextInvited,
    })

    set((state) => ({
      projects: state.projects.map((item) => (item.id === projectId ? updated : item)),
    }))

    return updated
  },
  joinPublicProject: ({ actor, projectId }) => {
    const project = get().projects.find((item) => item.id === projectId)
    if (!project) {
      throw new Error('Project not found.')
    }

    if (project.visibility !== PROJECT_VISIBILITY.PUBLIC) {
      throw new Error('Only public projects can be joined directly.')
    }

    if (project.createdBy === actor.id) {
      return project
    }

    const members = Array.isArray(project.members) ? project.members : []
    const isMember = members.some((member) => member.userId === actor.id)
    if (isMember) {
      return project
    }

    const updated = projectsService.updateProject(projectId, {
      members: [...members, { userId: actor.id, roleInProject: 'MEMBER' }],
      invited: (project.invited || []).filter((id) => id !== actor.id),
    })

    set((state) => ({
      projects: state.projects.map((item) => (item.id === projectId ? updated : item)),
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
