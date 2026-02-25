import { create } from 'zustand'
import { useUsersStore } from './usersStore'
import { getJSON, remove, setJSON } from '../utils/storage'

const AUTH_STORAGE_KEY = 'pm_auth_v1'

function getInitialCurrentUser() {
  const savedUser = getJSON(AUTH_STORAGE_KEY, null)
  if (!savedUser?.id) {
    return null
  }

  const resolvedUser = useUsersStore.getState().getUserById(savedUser.id)
  return resolvedUser || null
}

export const useAuthStore = create((set, get) => ({
  currentUser: getInitialCurrentUser(),
  login: ({ username, password }) => {
    const user = useUsersStore.getState().getUserByCredentials({ username, password })
    if (!user) {
      throw new Error('Invalid username or password.')
    }

    set({ currentUser: user })
    setJSON(AUTH_STORAGE_KEY, user)
    return user
  },
  logout: () => {
    set({ currentUser: null })
    remove(AUTH_STORAGE_KEY)
  },
  syncCurrentUser: () => {
    const currentUser = get().currentUser
    if (!currentUser?.id) {
      return null
    }

    const refreshedUser = useUsersStore.getState().getUserById(currentUser.id)
    if (!refreshedUser) {
      set({ currentUser: null })
      remove(AUTH_STORAGE_KEY)
      return null
    }

    set({ currentUser: refreshedUser })
    setJSON(AUTH_STORAGE_KEY, refreshedUser)
    return refreshedUser
  },
  isAuthenticated: () => Boolean(get().currentUser),
}))
