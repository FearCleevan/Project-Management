import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { FiLogOut, FiMoon, FiPlus, FiSun } from 'react-icons/fi'
import { useState } from 'react'
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
  const canViewUserManagement = canManageUsers(currentUser)
  const canCreateTicket = inProjectRoute && canEditTicket(currentUser)
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  const [newTicket, setNewTicket] = useState({
    title: '',
    state: 'Todo',
    priority: WORK_ITEM_PRIORITIES.NONE,
    assigneeId: '',
    startDate: '',
    dueDate: '',
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
    })
    setIsTicketModalOpen(true)
  }

  function closeTicketModal() {
    setIsTicketModalOpen(false)
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
          state: newTicket.state,
          priority: newTicket.priority,
          assigneeId: newTicket.assigneeId || null,
          startDate: newTicket.startDate || null,
          dueDate: newTicket.dueDate || null,
          descriptionHtml: '',
          labels: [],
          estimate: null,
          moduleId: null,
          attachments: [],
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
                Close
              </button>
            </div>

            <form className={styles.ticketForm} onSubmit={handleCreateTicket}>
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

              <div className={styles.ticketGrid}>
                <label className={styles.ticketLabel}>
                  State
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

                <label className={styles.ticketLabel}>
                  Priority
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

                <label className={styles.ticketLabel}>
                  Assignee
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

                <label className={styles.ticketLabel}>
                  Start Date
                  <input
                    className={styles.ticketInput}
                    type="date"
                    value={newTicket.startDate}
                    onChange={(event) =>
                      setNewTicket((prev) => ({ ...prev, startDate: event.target.value }))
                    }
                  />
                </label>

                <label className={styles.ticketLabel}>
                  Due Date
                  <input
                    className={styles.ticketInput}
                    type="date"
                    value={newTicket.dueDate}
                    onChange={(event) =>
                      setNewTicket((prev) => ({ ...prev, dueDate: event.target.value }))
                    }
                  />
                </label>
              </div>

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
