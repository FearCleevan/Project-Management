import { repo } from './repo'
import {
  createProjectModel,
  normalizeProjectModel,
  normalizeToggles,
  PROJECT_VISIBILITY,
  toSlug,
} from '../utils/models'

const PROJECTS_KEY = 'pm_projects_v1'

function listProjects() {
  return repo.list(PROJECTS_KEY).map(normalizeProjectModel)
}

function getProject(id) {
  const raw = repo.getById(PROJECTS_KEY, id)
  return raw ? normalizeProjectModel(raw) : null
}

function createProject(payload) {
  const nextProject = normalizeProjectModel(createProjectModel(payload))

  if (!nextProject.id) {
    throw new Error('Project ID is required.')
  }

  const existing = getProject(nextProject.id)
  if (existing) {
    throw new Error('Project ID already exists.')
  }

  if (!nextProject.name) {
    throw new Error('Project name is required.')
  }

  return repo.create(PROJECTS_KEY, nextProject)
}

function updateProject(id, patch) {
  const current = getProject(id)
  if (!current) {
    throw new Error('Project not found.')
  }

  const nextId = patch.id ? toSlug(patch.id) : current.id
  if (!nextId) {
    throw new Error('Project ID is required.')
  }

  if (nextId !== id) {
    const duplicate = getProject(nextId)
    if (duplicate) {
      throw new Error('Project ID already exists.')
    }
  }

  const updated = normalizeProjectModel({
    ...current,
    ...patch,
    id: nextId,
    visibility:
      patch.visibility === PROJECT_VISIBILITY.PUBLIC
        ? PROJECT_VISIBILITY.PUBLIC
        : patch.visibility === PROJECT_VISIBILITY.PRIVATE
          ? PROJECT_VISIBILITY.PRIVATE
          : current.visibility,
    toggles: patch.toggles ? normalizeToggles({ ...current.toggles, ...patch.toggles }) : current.toggles,
    updatedAt: new Date().toISOString(),
  })

  if (!updated.name?.trim()) {
    throw new Error('Project name is required.')
  }

  if (nextId === id) {
    return repo.update(PROJECTS_KEY, id, updated)
  }

  repo.remove(PROJECTS_KEY, id)
  return repo.create(PROJECTS_KEY, updated)
}

function deleteProject(id) {
  return repo.remove(PROJECTS_KEY, id)
}

export const projectsService = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
}
