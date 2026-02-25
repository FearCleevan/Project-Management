import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { FiCalendar, FiFlag, FiLogOut, FiMoon, FiPaperclip, FiPlus, FiSun, FiTag, FiUser, FiX } from 'react-icons/fi'
import { useRef, useState } from 'react'
import { toast } from 'react-toastify'
import styles from './AppLayout.module.css'
import { useAuthStore } from '../stores/authStore'
import { useUiStore } from '../stores/uiStore'
import { useUsersStore } from '../stores/usersStore'
import { useWorkItemsStore } from '../stores/workItemsStore'
import { WORK_ITEM_PRIORITIES } from '../utils/models'
import { canEditTicket, canManageUsers } from '../utils/permissions'

const projectNavItems = [
  { label: 'Board', subPath: 'board' },
  { label: 'List', subPath: 'list' },
  { label: 'Calendar', subPath: 'calendar' },
  { label: 'Timeline', subPath: 'timeline' },
  { label: 'Pages', subPath: 'pages' },
  { label: 'Intake', subPath: 'intake' },
  { label: 'Modules', subPath: 'modules' },
  { label: 'Cycles', subPath: 'cycles' },
  { label: 'Settings', subPath: 'settings' },
]

function getProjectIdFromPath(pathname) {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'projects' && parts[1] && parts[1] !== 'new') {
    return parts[1]
  }

  return null
}

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const projectId = getProjectIdFromPath(location.pathname)
  const inProjectRoute = Boolean(projectId)
  const theme = useUiStore((state) => state.theme)
  const toggleTheme = useUiStore((state) => state.toggleTheme)
  const currentUser = useAuthStore((state) => state.currentUser)
  const logout = useAuthStore((state) => state.logout)
  const users = useUsersStore((state) => state.listUsers())
  const createWorkItem = useWorkItemsStore((state) => state.create)
  const attachmentInputRef = useRef(null)
  const canViewUserManagement = canManageUsers(currentUser)
  const canCreateTicket = inProjectRoute && canEditTicket(currentUser)
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  const [newTicket, setNewTicket] = useState({
    title: '',
    descriptionHtml: '',
    state: 'Todo',
    priority: WORK_ITEM_PRIORITIES.NONE,
    assigneeId: '',
    startDate: '',
    dueDate: '',
    attachments: [],
  })

  function handleLogout() {
    logout()
    toast.success('Logged out successfully.')
  }

  function openTicketModal() {
    if (!canCreateTicket) {
      return
    }

    setNewTicket({
      title: '',
      state: 'Todo',
      priority: WORK_ITEM_PRIORITIES.NONE,
      assigneeId: '',
      startDate: '',
      dueDate: '',
      descriptionHtml: '',
      attachments: [],
    })
    setIsTicketModalOpen(true)
  }

  function closeTicketModal() {
    setIsTicketModalOpen(false)
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Failed to read file.'))
      reader.readAsDataURL(file)
    })
  }

  async function handleUploadAttachment(event) {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) {
      return
    }

    try {
      const nextAttachments = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          type: file.type || 'application/octet-stream',
          dataUrl: String(await readFileAsDataUrl(file)),
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.id || '',
        })),
      )
      setNewTicket((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...nextAttachments],
      }))
      toast.success('Attachment(s) added.')
    } catch (error) {
      toast.error(error.message || 'Unable to upload attachments.')
    } finally {
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = ''
      }
    }
  }

  function handleRemoveAttachment(index) {
    setNewTicket((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  function handleCreateTicket(event) {
    event.preventDefault()
    if (!projectId) {
      return
    }

    try {
      const created = createWorkItem({
        actor: currentUser,
        projectId,
        payload: {
          title: newTicket.title,
          descriptionHtml: newTicket.descriptionHtml,
          state: newTicket.state,
          priority: newTicket.priority,
          assigneeId: newTicket.assigneeId || null,
          startDate: newTicket.startDate || null,
          dueDate: newTicket.dueDate || null,
          labels: [],
          estimate: null,
          moduleId: null,
          attachments: newTicket.attachments,
          subItemIds: [],
          activities: [],
        },
      })
      toast.success('Ticket created successfully.')
      setIsTicketModalOpen(false)
      navigate(`/projects/${projectId}/workitems/${created.id}`)
    } catch (error) {
      toast.error(error.message || 'Unable to create ticket.')
    }
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.workspaceTitle}>Workspace</div>

        <nav className={styles.nav}>
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`.trim()
            }
            end
          >
            Projects
          </NavLink>

          {inProjectRoute && (
            <div className={styles.projectNavGroup}>
              {projectNavItems.map((item) => (
                <NavLink
                  key={item.subPath}
                  to={`/projects/${projectId}/${item.subPath}`}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`.trim()
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}

          {canViewUserManagement && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`.trim()
              }
            >
              User Management
            </NavLink>
          )}
        </nav>
      </aside>

      <div className={styles.contentArea}>
        <header className={styles.topbar}>
          <div className={styles.layoutTabs}>
            {inProjectRoute &&
              projectNavItems.slice(0, 4).map((item) => (
                <NavLink
                  key={item.subPath}
                  to={`/projects/${projectId}/${item.subPath}`}
                  className={({ isActive }) =>
                    `${styles.tabLink} ${isActive ? styles.tabLinkActive : ''}`.trim()
                  }
                >
                  {item.label}
                </NavLink>
              ))}
          </div>

          <div className={styles.topbarActions}>
            <div className={styles.userChip}>
              <span className={styles.userName}>{currentUser?.name || 'Unknown User'}</span>
              <span className={styles.userRole}>{currentUser?.role || 'N/A'}</span>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              {theme === 'light' ? <FiMoon /> : <FiSun />}
            </button>
            <button
              type="button"
              className={styles.newTicketButton}
              onClick={openTicketModal}
              disabled={!canCreateTicket}
            >
              <FiPlus />
              New Ticket
            </button>
            <button type="button" className={styles.logoutButton} onClick={handleLogout}>
              <FiLogOut />
              Logout
            </button>
          </div>
        </header>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>

      {isTicketModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Create New Ticket</h2>
              <button type="button" className={styles.logoutButton} onClick={closeTicketModal}>
                <FiX />
                Close
              </button>
            </div>

            <form className={styles.ticketForm} onSubmit={handleCreateTicket}>
              <div className={styles.projectBadge}>
                <FiTag />
                <span>{`Project: ${projectId}`}</span>
              </div>

              <label className={styles.ticketLabel}>
                Title
                <input
                  className={styles.ticketInput}
                  type="text"
                  value={newTicket.title}
                  onChange={(event) =>
                    setNewTicket((prev) => ({ ...prev, title: event.target.value }))
                  }
                  required
                />
              </label>

              <label className={styles.ticketLabel}>
                Description
                <textarea
                  className={styles.ticketTextarea}
                  rows={5}
                  value={newTicket.descriptionHtml}
                  onChange={(event) =>
                    setNewTicket((prev) => ({ ...prev, descriptionHtml: event.target.value }))
                  }
                  placeholder="Click to add description"
                />
              </label>

              <div className={styles.metaList}>
                <label className={styles.metaItem}>
                  <FiFlag />
                  <span>Status</span>
                  <select
                    className={styles.ticketInput}
                    value={newTicket.state}
                    onChange={(event) =>
                      setNewTicket((prev) => ({ ...prev, state: event.target.value }))
                    }
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Done">Done</option>
                  </select>
                </label>
                <label className={styles.metaItem}>
                  <FiFlag />
                  <span>Priority</span>
                  <select
                    className={styles.ticketInput}
                    value={newTicket.priority}
                    onChange={(event) =>
                      setNewTicket((prev) => ({ ...prev, priority: event.target.value }))
                    }
                  >
                    {Object.values(WORK_ITEM_PRIORITIES).map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.metaItem}>
                  <FiUser />
                  <span>Assignee</span>
                  <select
                    className={styles.ticketInput}
                    value={newTicket.assigneeId}
                    onChange={(event) =>
                      setNewTicket((prev) => ({ ...prev, assigneeId: event.target.value }))
                    }
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.metaItem}>
                  <FiCalendar />
                  <span>Start Date</span>
                  <input
                    className={styles.ticketInput}
                    type="date"
                    value={newTicket.startDate}
                    onChange={(event) =>
                      setNewTicket((prev) => ({ ...prev, startDate: event.target.value }))
                    }
                  />
                </label>
                <label className={styles.metaItem}>
                  <FiCalendar />
                  <span>Deadline</span>
                  <input
                    className={styles.ticketInput}
                    type="date"
                    value={newTicket.dueDate}
                    onChange={(event) =>
                      setNewTicket((prev) => ({ ...prev, dueDate: event.target.value }))
                    }
                  />
                </label>
                <button
                  type="button"
                  className={styles.metaButton}
                  onClick={() => attachmentInputRef.current?.click()}
                >
                  <FiPaperclip />
                  Add Attachment
                </button>
              </div>

              <input
                ref={attachmentInputRef}
                className={styles.hiddenFileInput}
                type="file"
                multiple
                onChange={handleUploadAttachment}
              />
              {(newTicket.attachments || []).length > 0 && (
                <ul className={styles.attachmentList}>
                  {(newTicket.attachments || []).map((attachment, index) => (
                    <li key={`${attachment.name}-${index}`} className={styles.attachmentItem}>
                      <span>{attachment.name}</span>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => handleRemoveAttachment(index)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className={styles.modalActions}>
                <button type="button" className={styles.iconButton} onClick={closeTicketModal}>
                  Cancel
                </button>
                <button type="submit" className={styles.newTicketButton}>
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
