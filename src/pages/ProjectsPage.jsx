import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import styles from './ProjectsPage.module.css'
import { useAuthStore } from '../stores/authStore'
import { useProjectsStore } from '../stores/projectsStore'
import { canAccessProjectSettings } from '../utils/permissions'
import { DEFAULT_PROJECT_TOGGLES, PROJECT_VISIBILITY, toSlug } from '../utils/models'

export default function ProjectsPage() {
  const fileInputRef = useRef(null)
  const currentUser = useAuthStore((state) => state.currentUser)
  const projects = useProjectsStore((state) => state.projects)
  const loadProjects = useProjectsStore((state) => state.loadProjects)
  const createProject = useProjectsStore((state) => state.createProject)
  const [hasEditedId, setHasEditedId] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    id: '',
    description: '',
    coverPhoto: '',
    visibility: PROJECT_VISIBILITY.PRIVATE,
    toggles: { ...DEFAULT_PROJECT_TOGGLES },
  })

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

    const isMember = Array.isArray(project.members)
      && project.members.some((member) => member.userId === currentUser?.id)
    if (isMember) {
      return true
    }

    return Array.isArray(project.invited) && project.invited.includes(currentUser?.id)
  })

  const canCreateProject = canAccessProjectSettings(currentUser)

  function resetForm() {
    setHasEditedId(false)
    setForm({
      name: '',
      id: '',
      description: '',
      coverPhoto: '',
      visibility: PROJECT_VISIBILITY.PRIVATE,
      toggles: { ...DEFAULT_PROJECT_TOGGLES },
    })
  }

  function openCreateModal() {
    resetForm()
    setIsCreateModalOpen(true)
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false)
    resetForm()
  }

  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Failed to read image file.'))
      reader.readAsDataURL(file)
    })
  }

  async function handleCoverFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.')
      return
    }

    try {
      const image = await readImageFile(file)
      setForm((prev) => ({ ...prev, coverPhoto: String(image) }))
    } catch (error) {
      toast.error(error.message || 'Unable to upload image.')
    }
  }

  function handleNameChange(value) {
    setForm((prev) => ({
      ...prev,
      name: value,
      id: hasEditedId ? prev.id : toSlug(value),
    }))
  }

  function handleToggleChange(key) {
    setForm((prev) => ({
      ...prev,
      toggles: {
        ...prev.toggles,
        [key]: !prev.toggles[key],
      },
    }))
  }

  function handleCreateSubmit(event) {
    event.preventDefault()

    try {
      createProject({
        actor: currentUser,
        payload: {
          ...form,
          id: toSlug(form.id),
        },
      })
      toast.success('Project created successfully.')
      closeCreateModal()
    } catch (error) {
      toast.error(error.message || 'Unable to create project.')
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Projects</h1>
          <p className={styles.subtitle}>Track active initiatives and workspace visibility.</p>
        </div>
        {canCreateProject && (
          <button className={styles.primaryButton} onClick={openCreateModal}>
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

      {isCreateModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Create Project</h2>
              <button type="button" className={styles.secondaryButton} onClick={closeCreateModal}>
                Close
              </button>
            </div>

            <form className={styles.form} onSubmit={handleCreateSubmit}>
              <div className={styles.formGrid}>
                <label className={styles.label}>
                  Project Name
                  <input
                    className={styles.input}
                    type="text"
                    value={form.name}
                    onChange={(event) => handleNameChange(event.target.value)}
                    required
                  />
                </label>
                <label className={styles.label}>
                  Project ID (Slug)
                  <input
                    className={styles.input}
                    type="text"
                    value={form.id}
                    onChange={(event) => {
                      setHasEditedId(true)
                      setForm((prev) => ({ ...prev, id: toSlug(event.target.value) }))
                    }}
                    required
                  />
                </label>
                <label className={styles.label}>
                  Visibility
                  <select
                    className={styles.select}
                    value={form.visibility}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, visibility: event.target.value }))
                    }
                  >
                    <option value={PROJECT_VISIBILITY.PRIVATE}>PRIVATE</option>
                    <option value={PROJECT_VISIBILITY.PUBLIC}>PUBLIC</option>
                  </select>
                </label>
              </div>

              <label className={styles.label}>
                Description
                <textarea
                  className={styles.textarea}
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
              </label>

              <div className={styles.coverSection}>
                <label className={styles.label}>
                  Cover Photo URL
                  <input
                    className={styles.input}
                    type="url"
                    value={form.coverPhoto}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, coverPhoto: event.target.value }))
                    }
                    placeholder="https://..."
                  />
                </label>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Cover
                </button>
                <input
                  ref={fileInputRef}
                  className={styles.hiddenInput}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileChange}
                />
                {form.coverPhoto && (
                  <img className={styles.coverPreview} src={form.coverPhoto} alt="Cover preview" />
                )}
              </div>

              <fieldset className={styles.toggleGroup}>
                <legend>Feature Toggles</legend>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.toggles.cycles}
                    onChange={() => handleToggleChange('cycles')}
                  />
                  Enable Cycles
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.toggles.modules}
                    onChange={() => handleToggleChange('modules')}
                  />
                  Enable Modules
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.toggles.views}
                    onChange={() => handleToggleChange('views')}
                  />
                  Enable Views
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.toggles.pages}
                    onChange={() => handleToggleChange('pages')}
                  />
                  Enable Pages
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.toggles.intake}
                    onChange={() => handleToggleChange('intake')}
                  />
                  Enable Intake
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.toggles.timeTracking}
                    onChange={() => handleToggleChange('timeTracking')}
                  />
                  Enable Time Tracking
                </label>
              </fieldset>

              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryButton} onClick={closeCreateModal}>
                  Cancel
                </button>
                <button className={styles.primaryButton} type="submit">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
