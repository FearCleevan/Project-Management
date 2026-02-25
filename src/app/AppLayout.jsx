import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { FiLogOut, FiMoon, FiPlus, FiSun } from 'react-icons/fi'
import { toast } from 'react-toastify'
import styles from './AppLayout.module.css'
import { useAuthStore } from '../stores/authStore'
import { useUiStore } from '../stores/uiStore'
import { canManageUsers } from '../utils/permissions'

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
  const location = useLocation()
  const projectId = getProjectIdFromPath(location.pathname)
  const inProjectRoute = Boolean(projectId)
  const theme = useUiStore((state) => state.theme)
  const toggleTheme = useUiStore((state) => state.toggleTheme)
  const currentUser = useAuthStore((state) => state.currentUser)
  const logout = useAuthStore((state) => state.logout)
  const canViewUserManagement = canManageUsers(currentUser)

  function handleLogout() {
    logout()
    toast.success('Logged out successfully.')
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
            <button type="button" className={styles.newTicketButton} disabled>
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
    </div>
  )
}
