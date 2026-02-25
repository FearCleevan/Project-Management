import { Navigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuthStore } from '../stores/authStore'

export default function RoleRoute({ allowedRoles, children }) {
  const currentUser = useAuthStore((state) => state.currentUser)
  const hasAccess = Boolean(currentUser && allowedRoles.includes(currentUser.role))

  if (!hasAccess) {
    toast.error('You are not authorized to access this page.', {
      toastId: 'role-route-unauthorized',
    })
    return <Navigate to="/projects" replace />
  }

  return children
}
