export function getJSON(key, fallback) {
  try {
    const rawValue = localStorage.getItem(key)
    if (rawValue === null) {
      return fallback
    }

    return JSON.parse(rawValue)
  } catch {
    return fallback
  }
}

export function setJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function remove(key) {
  localStorage.removeItem(key)
}
