const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.port === '5173' ? 'http://localhost:8000/api' : '/api')

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options)
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
    throw new Error(message)
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return null
}

export const api = {
  getCollections: () => request('/collections'),
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
  exportCollection: async (collectionId, collectionName) => {
    const response = await fetch(`${API_URL}/collections/${collectionId}/export`)
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
