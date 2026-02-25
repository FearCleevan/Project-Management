import { useEffect } from 'react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuthStore } from '../stores/authStore'
import { useProjectsStore } from '../stores/projectsStore'

export default function ProjectAccessRoute() {
  const { projectId } = useParams()
  const currentUser = useAuthStore((state) => state.currentUser)
  const projects = useProjectsStore((state) => state.projects)
  const hasLoaded = useProjectsStore((state) => state.hasLoaded)
  const loadProjects = useProjectsStore((state) => state.loadProjects)
  const getProjectForUser = useProjectsStore((state) => state.getProjectForUser)

  useEffect(() => {
    if (projects.length === 0) {
      loadProjects()
    }
  }, [loadProjects, projects.length])

  if (!projectId) {
    return <Navigate to="/projects" replace />
  }

  const allowedProject = getProjectForUser(projectId, currentUser?.id)
  if (!allowedProject) {
    if (hasLoaded) {
      toast.error('You do not have access to this project.', {
        toastId: `project-access-${projectId}-${currentUser?.id || 'unknown'}`,
      })
      return <Navigate to="/projects" replace />
    }

    return null
  }

  return <Outlet />
}
