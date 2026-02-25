import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useProjectsStore } from '../stores/projectsStore'

export default function ProjectBoardPage() {
  const { projectId } = useParams()
  const currentUser = useAuthStore((state) => state.currentUser)
  const projects = useProjectsStore((state) => state.projects)
  const loadProjects = useProjectsStore((state) => state.loadProjects)

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const project = useMemo(() => {
    const candidate = projects.find((item) => item.id === projectId)
    if (!candidate) {
      return null
    }

    if (candidate.visibility === 'PUBLIC') {
      return candidate
    }

    if (candidate.createdBy === currentUser?.id) {
      return candidate
    }

    if (Array.isArray(candidate.invitedMemberIds) && candidate.invitedMemberIds.includes(currentUser?.id)) {
      return candidate
    }

    return null
  }, [currentUser?.id, projectId, projects])

  if (!project) {
    return <h1>Project Board - Project not found or not accessible</h1>
  }

  return <h1>{`Project Board - ${project.name}`}</h1>
}
