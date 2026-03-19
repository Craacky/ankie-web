const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.port === '5173' ? 'http://localhost:8000/api' : '/api')

function getCookieValue(name) {
  const match = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[2]) : ''
}

async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = { ...(options.headers || {}) }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrf = getCookieValue('ankie_csrf')
    if (csrf && !headers['X-CSRF-Token']) {
      headers['X-CSRF-Token'] = csrf
    }
  }
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const body = await response.json()
      if (body?.detail) {
        if (Array.isArray(body.detail)) {
          message = body.detail.map((item) => item.msg || String(item)).join(', ')
        } else {
          message = body.detail
        }
      }
    } catch {
      // no-op
    }
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return null
}

export const api = {
  getAuthConfig: () => request('/auth/config'),
  telegramAuth: (payload) =>
    request('/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  getMe: () => request('/auth/me'),
  updateTheme: (themeKey) =>
    request('/users/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme_key: themeKey })
    }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getCollections: () => request('/collections'),
  getFolders: () => request('/folders'),
  createFolder: (name) =>
    request('/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    }),
  renameFolder: (folderId, name) =>
    request(`/folders/${folderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    }),
  deleteFolder: (folderId) => request(`/folders/${folderId}`, { method: 'DELETE' }),
  moveCollectionToFolder: (collectionId, folderId) =>
    request(`/collections/${collectionId}/folder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_id: folderId })
    }),
  getCollection: (id, { offset = 0, limit = 200 } = {}) =>
    request(`/collections/${id}?offset=${offset}&limit=${limit}`),
  getCollectionCards: (id, { offset = 0, limit = 200 } = {}) =>
    request(`/collections/${id}/cards?offset=${offset}&limit=${limit}`),
  getStudyCards: (id, { offset = 0, limit = 200 } = {}) =>
    request(`/collections/${id}/study-cards?offset=${offset}&limit=${limit}`),
  resetCollection: (id) => request(`/collections/${id}/reset`, { method: 'POST' }),
  deleteCollection: (id) => request(`/collections/${id}`, { method: 'DELETE' }),
  importCollection: (name, file) => {
    const formData = new FormData()
    formData.append('name', name)
    formData.append('file', file)

    return request('/collections/import', {
      method: 'POST',
      body: formData
    })
  },
  markCardProgress: (cardId, known) =>
    request(`/cards/${cardId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_id: cardId, known })
    }),
  updateCard: (cardId, payload) =>
    request(`/cards/${cardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  deleteCard: (cardId) => request(`/cards/${cardId}`, { method: 'DELETE' }),
  getNotesTree: (path = '') => request(`/notes/tree?path=${encodeURIComponent(path)}`),
  getNoteFile: (path) => request(`/notes/file?path=${encodeURIComponent(path)}`),
  updateNoteFile: (path, content) =>
    request('/notes/file', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content })
    }),
  createNoteFile: (parentPath, name, content = '') =>
    request('/notes/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent_path: parentPath, name, content })
    }),
  createNoteFolder: (parentPath, name) =>
    request('/notes/folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent_path: parentPath, name })
    }),
  uploadNoteFile: (parentPath, file) => {
    const formData = new FormData()
    formData.append('parent_path', parentPath || '')
    formData.append('file', file)
    return request('/notes/upload', {
      method: 'POST',
      body: formData
    })
  },
  renameNotePath: (path, newName) =>
    request('/notes/path', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, new_name: newName })
    }),
  deleteNotePath: (path) => request(`/notes/path?path=${encodeURIComponent(path)}`, { method: 'DELETE' }),
  noteRawUrl: (path) => `${API_URL}/notes/raw?path=${encodeURIComponent(path)}`,
  exportCollection: async (collectionId, collectionName) => {
    const response = await fetch(`${API_URL}/collections/${collectionId}/export`, { credentials: 'include' })
    if (!response.ok) {
      throw new Error('Failed to export collection')
    }
    const json = await response.json()
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${collectionName.replace(/\s+/g, '_').toLowerCase()}_export.json`
    a.click()
    URL.revokeObjectURL(url)
  },
  getAdminMe: () => request('/admin/me'),
  getAdminOverview: (windowMinutes = 60) => request(`/admin/overview?window_minutes=${windowMinutes}`),
  getAdminUsers: (windowMinutes = 1440, limit = 100) =>
    request(`/admin/users?window_minutes=${windowMinutes}&limit=${limit}`),
  getAdminRequests: (params = {}) => {
    const search = new URLSearchParams()
    if (params.user_id != null) search.set('user_id', params.user_id)
    if (params.ip) search.set('ip', params.ip)
    if (params.path_contains) search.set('path_contains', params.path_contains)
    if (params.status_min != null) search.set('status_min', params.status_min)
    if (params.limit != null) search.set('limit', params.limit)
    return request(`/admin/requests?${search.toString()}`)
  },
  getAdminAlerts: (limit = 100) => request(`/admin/alerts?limit=${limit}`),
  adminBan: (payload) =>
    request('/admin/ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  adminUnban: (payload) =>
    request('/admin/unban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
}
