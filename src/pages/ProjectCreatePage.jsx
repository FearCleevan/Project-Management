import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import styles from './ProjectCreatePage.module.css'
import { useAuthStore } from '../stores/authStore'
import { useProjectsStore } from '../stores/projectsStore'
import {
  DEFAULT_PROJECT_TOGGLES,
  PROJECT_VISIBILITY,
  toSlug,
} from '../utils/models'
import { canAccessProjectSettings } from '../utils/permissions'

export default function ProjectCreatePage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const currentUser = useAuthStore((state) => state.currentUser)
  const createProject = useProjectsStore((state) => state.createProject)
  const canCreateProject = canAccessProjectSettings(currentUser)
  const [hasEditedId, setHasEditedId] = useState(false)
  const [form, setForm] = useState({
    name: '',
    id: '',
    description: '',
    coverPhoto: '',
    visibility: PROJECT_VISIBILITY.PRIVATE,
    toggles: DEFAULT_PROJECT_TOGGLES,
  })

  useEffect(() => {
    if (!canCreateProject) {
      toast.error('Only admins can create projects.')
      navigate('/projects', { replace: true })
    }
  }, [canCreateProject, navigate])

  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Failed to read image file.'))
      reader.readAsDataURL(file)
    })
  }

  function handleNameChange(value) {
    setForm((prev) => ({
      ...prev,
      name: value,
      id: hasEditedId ? prev.id : toSlug(value),
    }))
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

  function handleSubmit(event) {
    event.preventDefault()

    try {
      const project = createProject({
        actor: currentUser,
        payload: {
          ...form,
          id: toSlug(form.id),
        },
      })
      toast.success('Project created successfully.')
      navigate(`/projects/${project.id}/board`)
    } catch (error) {
      toast.error(error.message || 'Unable to create project.')
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Create Project</h1>
        <p className={styles.subtitle}>Configure project metadata, visibility, and workspace features.</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
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
              onChange={(event) => setForm((prev) => ({ ...prev, visibility: event.target.value }))}
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
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            rows={5}
          />
        </label>

        <div className={styles.coverSection}>
          <label className={styles.label}>
            Cover Photo URL
            <input
              className={styles.input}
              type="url"
              value={form.coverPhoto}
              onChange={(event) => setForm((prev) => ({ ...prev, coverPhoto: event.target.value }))}
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

        <div className={styles.actions}>
          <button className={styles.secondaryButton} type="button" onClick={() => navigate('/projects')}>
            Cancel
          </button>
          <button className={styles.primaryButton} type="submit">
            Create Project
          </button>
        </div>
      </form>
    </section>
  )
}
