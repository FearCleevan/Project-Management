import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './ProjectsPage.module.css'
import { useAuthStore } from '../stores/authStore'
import { useProjectsStore } from '../stores/projectsStore'
import { canAccessProjectSettings } from '../utils/permissions'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.currentUser)
  const projects = useProjectsStore((state) => state.projects)
  const loadProjects = useProjectsStore((state) => state.loadProjects)

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const visibleProjects = projects.filter((project) => {
    if (project.visibility === 'PUBLIC') {
      return true
    }

    if (project.createdBy === currentUser?.id) {
      return true
    }

    return Array.isArray(project.invitedMemberIds) && project.invitedMemberIds.includes(currentUser?.id)
  })

  const canCreateProject = canAccessProjectSettings(currentUser)

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Projects</h1>
          <p className={styles.subtitle}>Track active initiatives and workspace visibility.</p>
        </div>
        {canCreateProject && (
          <button className={styles.primaryButton} onClick={() => navigate('/projects/new')}>
            New Project
          </button>
        )}
      </header>

      {visibleProjects.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No projects found</h2>
          <p>Create your first project to get started.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {visibleProjects.map((project) => (
            <article key={project.id} className={styles.card}>
              <div className={styles.coverWrap}>
                {project.coverPhoto ? (
                  <img src={project.coverPhoto} alt={project.name} className={styles.cover} />
                ) : (
                  <div className={styles.coverPlaceholder}>No cover</div>
                )}
              </div>
              <div className={styles.meta}>
                <h2 className={styles.cardTitle}>{project.name}</h2>
                <p className={styles.cardId}>{project.id}</p>
                <span className={styles.badge}>{project.visibility}</span>
              </div>
              <Link className={styles.link} to={`/projects/${project.id}/board`}>
                Open Board
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
