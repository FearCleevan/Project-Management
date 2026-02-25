import { create } from 'zustand'
import { getJSON, setJSON } from '../utils/storage'
import { ROLES, canAssignRole, canManageUsers, canRemoveUser } from '../utils/permissions'

export const POSITIONS = [
  'Backend Dev',
  'Frontend Dev',
  'Full Stack Dev',
  'IT Admin',
  'UI/UX',
  'Tean Lead',
  'QA',
]

export const SEEDED_USERS = [
  {
    id: 'u_super',
    firstName: 'Super',
    lastName: 'Admin',
    email: 'super@demo.com',
    username: 'superadmin',
    password: 'Super123!',
    position: 'IT Admin',
    profileImage: '',
    role: ROLES.SUPER_ADMIN,
  },
  {
    id: 'u_admin',
    firstName: 'Project',
    lastName: 'Admin',
    email: 'admin@demo.com',
    username: 'admin',
    password: 'Admin123!',
    position: 'Tean Lead',
    profileImage: '',
    role: ROLES.ADMIN,
  },
  {
    id: 'u_member',
    firstName: 'Core',
    lastName: 'Member',
    email: 'member@demo.com',
    username: 'member',
    password: 'Member123!',
    position: 'Frontend Dev',
    profileImage: '',
    role: ROLES.MEMBER,
  },
]

const USERS_STORAGE_KEY = 'pm_users_v1'

function buildName(firstName, lastName) {
  return `${firstName} ${lastName}`.trim()
}

function normalizeUser(user) {
  const firstName = user.firstName?.trim() || user.name?.split(' ')?.[0] || 'User'
  const lastName = user.lastName?.trim() || user.name?.split(' ')?.slice(1).join(' ') || ''

  return {
    id: user.id,
    firstName,
    lastName,
    name: buildName(firstName, lastName),
    email: user.email?.trim().toLowerCase() || '',
    username: user.username?.trim().toLowerCase() || '',
    password: user.password || '',
    position: POSITIONS.includes(user.position) ? user.position : POSITIONS[0],
    profileImage: user.profileImage || '',
    role: user.role,
  }
}

function getInitialUsers() {
  const persistedUsers = getJSON(USERS_STORAGE_KEY, null)

  if (Array.isArray(persistedUsers) && persistedUsers.length > 0) {
    const normalized = persistedUsers.map(normalizeUser)
    const hasCredentialShape = normalized.every((user) => user.username && user.password)

    if (hasCredentialShape) {
      setJSON(USERS_STORAGE_KEY, normalized)
      return normalized
    }
  }

  const seeded = SEEDED_USERS.map(normalizeUser)
  setJSON(USERS_STORAGE_KEY, seeded)
  return seeded
}

function createUserId() {
  return `u_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
}

function assertUserActor(actor) {
  if (!actor) {
    throw new Error('No authenticated user.')
  }
}

export const useUsersStore = create((set, get) => ({
  users: getInitialUsers(),
  setUsers: (users) => {
    const normalizedUsers = users.map(normalizeUser)
    set({ users: normalizedUsers })
    setJSON(USERS_STORAGE_KEY, normalizedUsers)
  },
  getUserById: (userId) => get().users.find((user) => user.id === userId) || null,
  getUserByCredentials: ({ username, password }) => {
    const normalizedUsername = username?.trim().toLowerCase()
    return (
      get().users.find(
        (user) => user.username === normalizedUsername && user.password === password,
      ) || null
    )
  },
  listUsers: () => get().users,
  createUser: ({ actor, data }) => {
    assertUserActor(actor)
    if (!canManageUsers(actor)) {
      throw new Error('You do not have permission to create users.')
    }

    const firstName = data?.firstName?.trim()
    const lastName = data?.lastName?.trim()
    const email = data?.email?.trim().toLowerCase()
    const username = data?.username?.trim().toLowerCase()
    const password = data?.password
    const position = data?.position
    const profileImage = data?.profileImage || ''
    const role = data?.role

    if (!firstName || !lastName || !email || !username || !password || !position || !role) {
      throw new Error(
        'First name, last name, email, username, password, position, and role are required.',
      )
    }

    if (!canAssignRole(actor, role)) {
      throw new Error('You do not have permission to assign that role.')
    }

    if (!POSITIONS.includes(position)) {
      throw new Error('Selected position is invalid.')
    }

    const users = get().users
    const existingUser = users.find((user) => user.email.toLowerCase() === email)
    if (existingUser) {
      throw new Error('A user with this email already exists.')
    }
    const existingUsername = users.find((user) => user.username === username)
    if (existingUsername) {
      throw new Error('A user with this username already exists.')
    }

    const newUser = normalizeUser({
      id: createUserId(),
      firstName,
      lastName,
      email,
      username,
      password,
      position,
      profileImage,
      role,
    })

    const nextUsers = [...users, newUser]
    set({ users: nextUsers })
    setJSON(USERS_STORAGE_KEY, nextUsers)
    return newUser
  },
  updateUser: ({ actor, userId, data }) => {
    assertUserActor(actor)
    if (!canManageUsers(actor)) {
      throw new Error('You do not have permission to edit users.')
    }

    const users = get().users
    const targetUser = users.find((user) => user.id === userId)
    if (!targetUser) {
      throw new Error('User not found.')
    }

    const nextRole = data?.role ?? targetUser.role
    if (!canAssignRole(actor, nextRole)) {
      throw new Error('You do not have permission to assign that role.')
    }

    const nextFirstName = data?.firstName?.trim() ?? targetUser.firstName
    const nextLastName = data?.lastName?.trim() ?? targetUser.lastName
    const nextEmail = data?.email?.trim().toLowerCase() ?? targetUser.email
    const nextUsername = data?.username?.trim().toLowerCase() ?? targetUser.username
    const nextPassword = data?.password || targetUser.password
    const nextPosition = data?.position ?? targetUser.position
    const nextProfileImage = data?.profileImage ?? targetUser.profileImage
    if (!nextFirstName || !nextLastName || !nextEmail || !nextUsername || !nextPassword) {
      throw new Error('First name, last name, email, username, and password are required.')
    }

    if (!POSITIONS.includes(nextPosition)) {
      throw new Error('Selected position is invalid.')
    }

    const emailConflict = users.find(
      (user) => user.email.toLowerCase() === nextEmail && user.id !== userId,
    )
    if (emailConflict) {
      throw new Error('A user with this email already exists.')
    }
    const usernameConflict = users.find(
      (user) => user.username === nextUsername && user.id !== userId,
    )
    if (usernameConflict) {
      throw new Error('A user with this username already exists.')
    }

    const updatedUser = normalizeUser({
      ...targetUser,
      firstName: nextFirstName,
      lastName: nextLastName,
      email: nextEmail,
      username: nextUsername,
      password: nextPassword,
      position: nextPosition,
      profileImage: nextProfileImage,
      role: nextRole,
    })

    const nextUsers = users.map((user) => (user.id === userId ? updatedUser : user))
    set({ users: nextUsers })
    setJSON(USERS_STORAGE_KEY, nextUsers)
    return updatedUser
  },
  removeUser: ({ actor, userId }) => {
    assertUserActor(actor)
    if (!canRemoveUser(actor)) {
      throw new Error('Only super admins can remove users.')
    }

    if (actor.id === userId) {
      throw new Error('You cannot remove the currently logged-in account.')
    }

    const users = get().users
    const targetUser = users.find((user) => user.id === userId)
    if (!targetUser) {
      throw new Error('User not found.')
    }

    const nextUsers = users.filter((user) => user.id !== userId)
    set({ users: nextUsers })
    setJSON(USERS_STORAGE_KEY, nextUsers)
  },
}))
