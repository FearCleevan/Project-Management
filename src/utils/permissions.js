export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
}

export function canManageUsers(user) {
  return user?.role === ROLES.SUPER_ADMIN
}

export function canRemoveUser(user) {
  return user?.role === ROLES.SUPER_ADMIN
}

export function canAssignRole(user, targetRole) {
  if (!user || !targetRole) {
    return false
  }

  if (user.role === ROLES.SUPER_ADMIN) {
    return Object.values(ROLES).includes(targetRole)
  }

  return false
}

export function canEditTicket(user) {
  return user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN
}

export function canMoveTicket(user) {
  return Boolean(user)
}

export function canComment(user) {
  return Boolean(user)
}

export function canAccessProjectSettings(user) {
  return user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN
}
