export function joinNotePath(parent, child) {
  const p = (parent || '').trim().replace(/^\/+|\/+$/g, '')
  const c = (child || '').trim().replace(/^\/+|\/+$/g, '')
  if (!p) return c
  if (!c) return p
  return `${p}/${c}`
}

export function noteParentPath(path) {
  const normalized = (path || '').trim().replace(/^\/+|\/+$/g, '')
  if (!normalized.includes('/')) return ''
  return normalized.split('/').slice(0, -1).join('/')
}

export function resolveRelativeNotePath(currentPath, relativePath) {
  const rel = (relativePath || '').trim()
  if (!rel || rel.startsWith('#')) return ''
  if (rel.startsWith('/')) return rel.replace(/^\/+/, '')
  const baseDir = noteParentPath(currentPath)
  const combined = joinNotePath(baseDir, rel)
  const parts = combined.split('/')
  const out = []
  for (const part of parts) {
    if (!part || part === '.') continue
    if (part === '..') {
      out.pop()
      continue
    }
    out.push(part)
  }
  return out.join('/')
}

export function splitHrefAndHash(rawHref) {
  const value = String(rawHref || '')
  const hashIndex = value.indexOf('#')
  if (hashIndex < 0) {
    return { hrefPath: value, hash: '' }
  }
  return {
    hrefPath: value.slice(0, hashIndex),
    hash: value.slice(hashIndex + 1)
  }
}
