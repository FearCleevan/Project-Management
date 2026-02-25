import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import styles from './ProjectSettingsPage.module.css'
import { useAuthStore } from '../stores/authStore'
import { useProjectsStore } from '../stores/projectsStore'
import { canAccessProjectSettings } from '../utils/permissions'
import { toSlug } from '../utils/models'

const EMPTY_FORM = {
  id: '',
  name: '',
  description: '',
  coverPhoto: '',
  visibility: 'PRIVATE',
  toggles: {
    cycles: false,
    modules: false,
    views: false,
    pages: false,
    intake: false,
    timeTracking: false,
  },
}

export default function ProjectSettingsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const currentUser = useAuthStore((state) => state.currentUser)
  const projects = useProjectsStore((state) => state.projects)
  const loadProjects = useProjectsStore((state) => state.loadProjects)
  const updateProject = useProjectsStore((state) => state.updateProject)
  const [form, setForm] = useState(EMPTY_FORM)

  const canEdit = canAccessProjectSettings(currentUser)

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

  useEffect(() => {
    if (!project) {
      return
    }

    setForm({
      id: project.id,
      name: project.name,
      description: project.description,
      coverPhoto: project.coverPhoto,
      visibility: project.visibility,
      toggles: { ...project.toggles },
    })
  }, [project])

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

  function handleToggleChange(key) {
    setForm((prev) => ({
      ...prev,
      toggles: {
        ...prev.toggles,
        [key]: !prev.toggles[key],
      },
    }))
  }

  function handleSave(event) {
    event.preventDefault()
    if (!project) {
      return
    }

    try {
      const updated = updateProject({
        actor: currentUser,
        projectId: project.id,
        patch: {
          id: toSlug(form.id),
          name: form.name,
          description: form.description,
          coverPhoto: form.coverPhoto,
          visibility: form.visibility,
          toggles: form.toggles,
        },
      })
      toast.success('Project settings updated.')
      navigate(`/projects/${updated.id}/settings`, { replace: true })
    } catch (error) {
      toast.error(error.message || 'Unable to update project.')
    }
  }

  if (!project) {
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>Project Settings</h1>
        <p className={styles.notice}>Project not found or not accessible.</p>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Project Settings</h1>
        <p className={styles.subtitle}>
          {canEdit
            ? 'Edit project metadata and feature toggles.'
            : 'Read-only view. Only admins can edit project settings.'}
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSave}>
        <div className={styles.formGrid}>
          <label className={styles.label}>
            Project Name
            <input
              className={styles.input}
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              disabled={!canEdit}
              required
            />
          </label>
          <label className={styles.label}>
            Project ID
            <input
              className={styles.input}
              type="text"
              value={form.id}
              onChange={(event) => setForm((prev) => ({ ...prev, id: toSlug(event.target.value) }))}
              disabled={!canEdit}
              required
            />
          </label>
          <label className={styles.label}>
            Visibility
            <select
              className={styles.select}
              value={form.visibility}
              onChange={(event) => setForm((prev) => ({ ...prev, visibility: event.target.value }))}
              disabled={!canEdit}
            >
              <option value="PRIVATE">PRIVATE</option>
              <option value="PUBLIC">PUBLIC</option>
            </select>
          </label>
        </div>

        <label className={styles.label}>
          Description
          <textarea
            className={styles.textarea}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            disabled={!canEdit}
            rows={4}
          />
        </label>

        <label className={styles.label}>
          Cover Photo URL
          <input
            className={styles.input}
            type="url"
            value={form.coverPhoto}
            onChange={(event) => setForm((prev) => ({ ...prev, coverPhoto: event.target.value }))}
            disabled={!canEdit}
          />
        </label>

        {canEdit && (
          <>
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
          </>
        )}

        {form.coverPhoto && <img src={form.coverPhoto} alt={form.name} className={styles.coverPreview} />}

        <fieldset className={styles.toggleGroup} disabled={!canEdit}>
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

        {canEdit && (
          <div className={styles.actions}>
            <button className={styles.primaryButton} type="submit">
              Save Changes
            </button>
          </div>
        )}
      </form>
    </section>
  )
}
