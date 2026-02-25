import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useProjectsStore } from '../stores/projectsStore'

export default function ProjectBoardPage() {
  const { projectId } = useParams()
  const currentUser = useAuthStore((state) => state.currentUser)
  const loadProjects = useProjectsStore((state) => state.loadProjects)
  const getProjectForUser = useProjectsStore((state) => state.getProjectForUser)

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const project = useMemo(
    () => getProjectForUser(projectId, currentUser?.id),
    [currentUser?.id, getProjectForUser, projectId],
  )

  if (!project) {
    return <h1>Project Board - Project not found or not accessible</h1>
  }

  return <h1>{`Project Board - ${project.name}`}</h1>
}
