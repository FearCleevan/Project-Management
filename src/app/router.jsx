import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './AppLayout'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'
import LoginPage from '../pages/LoginPage'
import ProjectsPage from '../pages/ProjectsPage'
import ProjectCreatePage from '../pages/ProjectCreatePage'
import ProjectBoardPage from '../pages/ProjectBoardPage'
import ProjectListPage from '../pages/ProjectListPage'
import ProjectCalendarPage from '../pages/ProjectCalendarPage'
import ProjectTimelinePage from '../pages/ProjectTimelinePage'
import WorkItemDetailPage from '../pages/WorkItemDetailPage'
import ProjectSettingsPage from '../pages/ProjectSettingsPage'
import ProjectPagesPage from '../pages/ProjectPagesPage'
import ProjectIntakePage from '../pages/ProjectIntakePage'
import ProjectModulesPage from '../pages/ProjectModulesPage'
import ProjectCyclesPage from '../pages/ProjectCyclesPage'
import UserManagementPage from '../pages/UserManagementPage'
import { ROLES } from '../utils/permissions'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route
          path="/projects/new"
          element={
            <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
              <ProjectCreatePage />
            </RoleRoute>
          }
        />
        <Route
          path="/projects/:projectId"
          element={<ProjectRootRedirect />}
        />
        <Route path="/projects/:projectId/board" element={<ProjectBoardPage />} />
        <Route path="/projects/:projectId/list" element={<ProjectListPage />} />
        <Route
          path="/projects/:projectId/calendar"
          element={<ProjectCalendarPage />}
        />
        <Route
          path="/projects/:projectId/timeline"
          element={<ProjectTimelinePage />}
        />
        <Route
          path="/projects/:projectId/workitems/:workItemId"
          element={<WorkItemDetailPage />}
        />
        <Route
          path="/projects/:projectId/settings"
          element={<ProjectSettingsPage />}
        />
        <Route path="/projects/:projectId/pages" element={<ProjectPagesPage />} />
        <Route path="/projects/:projectId/intake" element={<ProjectIntakePage />} />
        <Route
          path="/projects/:projectId/modules"
          element={<ProjectModulesPage />}
        />
        <Route path="/projects/:projectId/cycles" element={<ProjectCyclesPage />} />
        <Route
          path="/admin/users"
          element={
            <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <UserManagementPage />
            </RoleRoute>
          }
        />
      </Route>
    </Routes>
  )
}

function ProjectRootRedirect() {
  return <Navigate to="board" replace />
}
