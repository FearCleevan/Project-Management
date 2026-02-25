import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import styles from './ProjectSettingsPage.module.css'
import { useAuthStore } from '../stores/authStore'
import { useProjectsStore } from '../stores/projectsStore'
import { useUsersStore } from '../stores/usersStore'
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
  const inviteProjectMember = useProjectsStore((state) => state.inviteProjectMember)
  const removeProjectMember = useProjectsStore((state) => state.removeProjectMember)
  const joinPublicProject = useProjectsStore((state) => state.joinPublicProject)
  const users = useUsersStore((state) => state.listUsers())
  const [form, setForm] = useState(EMPTY_FORM)
  const [inviteUserId, setInviteUserId] = useState('')

  const canEdit = canAccessProjectSettings(currentUser)

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const project = useMemo(() => projects.find((item) => item.id === projectId) || null, [projectId, projects])

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

  function handleInviteUser(event) {
    event.preventDefault()
    if (!inviteUserId || !project) {
      return
    }

    try {
      inviteProjectMember({
        actor: currentUser,
        projectId: project.id,
        userId: inviteUserId,
      })
      toast.success('User invited to project.')
      setInviteUserId('')
    } catch (error) {
      toast.error(error.message || 'Unable to invite user.')
    }
  }

  function handleRemoveUser(userId) {
    if (!project) {
      return
    }

    try {
      removeProjectMember({
        actor: currentUser,
        projectId: project.id,
        userId,
      })
      toast.success('Member removed from project.')
    } catch (error) {
      toast.error(error.message || 'Unable to remove user.')
    }
  }

  function handleJoinPublicProject() {
    if (!project) {
      return
    }

    try {
      joinPublicProject({
        actor: currentUser,
        projectId: project.id,
      })
      toast.success('Joined project successfully.')
    } catch (error) {
      toast.error(error.message || 'Unable to join project.')
    }
  }

  const isMember = Boolean(project && (
    project.createdBy === currentUser?.id
    || (project.members || []).some((member) => member.userId === currentUser?.id)
  ))

  const availableInvitees = users.filter((user) => {
    if (!project) {
      return false
    }

    if (user.id === project.createdBy) {
      return false
    }

    const isProjectMember = (project.members || []).some((member) => member.userId === user.id)
    const isInvited = (project.invited || []).includes(user.id)
    return !isProjectMember && !isInvited
  })

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

      {project.visibility === 'PUBLIC' && !isMember && (
        <div className={styles.joinBanner}>
          <p>This project is public. Join to become a member.</p>
          <button className={styles.primaryButton} type="button" onClick={handleJoinPublicProject}>
            Join Project
          </button>
        </div>
      )}

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

      {canEdit && (
        <section className={styles.membersCard}>
          <h2 className={styles.membersTitle}>Members</h2>

          <form className={styles.inviteForm} onSubmit={handleInviteUser}>
            <select
              className={styles.select}
              value={inviteUserId}
              onChange={(event) => setInviteUserId(event.target.value)}
            >
              <option value="">Select user to invite</option>
              {availableInvitees.map((user) => (
                <option key={user.id} value={user.id}>
                  {`${user.name} (${user.username})`}
                </option>
              ))}
            </select>
            <button className={styles.secondaryButton} type="submit" disabled={!inviteUserId}>
              Invite User
            </button>
          </form>

          <div className={styles.membersGrid}>
            <article className={styles.membersList}>
              <h3>Active Members</h3>
              <ul>
                <li>
                  <span>Project Creator</span>
                  <strong>{users.find((user) => user.id === project.createdBy)?.name || project.createdBy}</strong>
                </li>
                {(project.members || []).map((member) => {
                  const user = users.find((item) => item.id === member.userId)
                  return (
                    <li key={member.userId}>
                      <span>{user?.name || member.userId}</span>
                      <div className={styles.memberActions}>
                        <em>{member.roleInProject}</em>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => handleRemoveUser(member.userId)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </article>

            <article className={styles.membersList}>
              <h3>Invited Users</h3>
              <ul>
                {(project.invited || []).map((userId) => {
                  const user = users.find((item) => item.id === userId)
                  return (
                    <li key={userId}>
                      <span>{user?.name || userId}</span>
                      <div className={styles.memberActions}>
                        <em>Invited</em>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => handleRemoveUser(userId)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  )
                })}
                {(project.invited || []).length === 0 && <li>No pending invites.</li>}
              </ul>
            </article>
          </div>
        </section>
      )}
    </section>
  )
}
