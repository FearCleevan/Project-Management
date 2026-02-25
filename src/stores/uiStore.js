import { create } from 'zustand'
import { getJSON, setJSON } from '../utils/storage'

const UI_THEME_STORAGE_KEY = 'pm_ui_theme_v1'

function applyThemeToDocument(theme) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.theme = theme
}

function resolveInitialTheme() {
  const persistedTheme = getJSON(UI_THEME_STORAGE_KEY, 'light')
  const theme = persistedTheme === 'dark' ? 'dark' : 'light'
  applyThemeToDocument(theme)
  return theme
}

export const useUiStore = create((set, get) => ({
  theme: resolveInitialTheme(),
  setTheme: (theme) => {
    const nextTheme = theme === 'dark' ? 'dark' : 'light'
    applyThemeToDocument(nextTheme)
    set({ theme: nextTheme })
    setJSON(UI_THEME_STORAGE_KEY, nextTheme)
  },
  toggleTheme: () => {
    const nextTheme = get().theme === 'light' ? 'dark' : 'light'
    applyThemeToDocument(nextTheme)
    set({ theme: nextTheme })
    setJSON(UI_THEME_STORAGE_KEY, nextTheme)
  },
}))
