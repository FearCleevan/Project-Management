import { getJSON, setJSON } from '../../utils/storage'

function list(key) {
  return getJSON(key, [])
}

function getById(key, id) {
  return list(key).find((item) => item.id === id) || null
}

function create(key, item) {
  const items = list(key)
  items.push(item)
  setJSON(key, items)
  return item
}

function update(key, id, patch) {
  const items = list(key)
  const target = items.find((item) => item.id === id)
  if (!target) {
    return null
  }

  const updated = {
    ...target,
    ...patch,
  }
  const nextItems = items.map((item) => (item.id === id ? updated : item))
  setJSON(key, nextItems)
  return updated
}

function remove(key, id) {
  const items = list(key)
  const exists = items.some((item) => item.id === id)
  if (!exists) {
    return false
  }

  const nextItems = items.filter((item) => item.id !== id)
  setJSON(key, nextItems)
  return true
}

const localRepo = {
  list,
  getById,
  create,
  update,
  remove,
}

export default localRepo
