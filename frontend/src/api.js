const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.port === '5173' ? 'http://localhost:8000/api' : '/api')

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const body = await response.json()
      if (body?.detail) {
        message = body.detail
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
  getCollection: (id) => request(`/collections/${id}`),
  getStudyCards: (id) => request(`/collections/${id}/study-cards`),
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
  getNotesTree: () => request('/notes/tree'),
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
  }
}
