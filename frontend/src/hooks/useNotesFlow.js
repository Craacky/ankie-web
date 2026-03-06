import { useEffect, useState } from 'react'

import { api } from '../api'
import { joinNotePath, noteParentPath } from '../features/notes/pathUtils'

function collectMarkdownPaths(nodes) {
  const paths = []
  const stack = [...nodes]
  while (stack.length) {
    const node = stack.shift()
    if (node.type === 'file' && node.path.toLowerCase().endsWith('.md')) {
      paths.push(node.path)
    }
    if (node.children?.length) {
      stack.unshift(...node.children)
    }
  }
  return paths
}

function scrollToAnchor(anchor) {
  const normalized = String(anchor || '').trim().replace(/^#/, '')
  if (!normalized) return
  const decoded = decodeURIComponent(normalized)
  const tryScroll = () => {
    const el = document.getElementById(decoded)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return true
    }
    return false
  }
  if (!tryScroll()) {
    window.setTimeout(tryScroll, 60)
  }
}

export function useNotesFlow({ user, appMode, notify }) {
  const [notesTree, setNotesTree] = useState([])
  const [selectedNotePath, setSelectedNotePath] = useState('')
  const [selectedNoteName, setSelectedNoteName] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteOriginalContent, setNoteOriginalContent] = useState('')
  const [noteViewMode, setNoteViewMode] = useState('preview')
  const [notesLoading, setNotesLoading] = useState(false)
  const [noteFileDialogOpen, setNoteFileDialogOpen] = useState(false)
  const [noteFolderDialogOpen, setNoteFolderDialogOpen] = useState(false)
  const [noteUploadDialogOpen, setNoteUploadDialogOpen] = useState(false)
  const [noteNameInput, setNoteNameInput] = useState('')
  const [noteUploadFile, setNoteUploadFile] = useState(null)
  const [mobileNotesTreeOpen, setMobileNotesTreeOpen] = useState(false)
  const [focusedNoteFolderPath, setFocusedNoteFolderPath] = useState('')
  const [collapsedNoteFolders, setCollapsedNoteFolders] = useState({})
  const [pendingAnchor, setPendingAnchor] = useState('')

  const noteHasUnsavedChanges = noteContent !== noteOriginalContent

  async function openNote(path) {
    if (!path) return
    try {
      const note = await api.getNoteFile(path)
      setSelectedNotePath(note.path)
      setSelectedNoteName(note.name)
      setNoteContent(note.content)
      setNoteOriginalContent(note.content)
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  async function fetchNotesTree(selectPath = null) {
    setNotesLoading(true)
    try {
      const tree = await api.getNotesTree()
      setNotesTree(tree)
      const mdPaths = collectMarkdownPaths(tree)
      const targetPath = selectPath || selectedNotePath || mdPaths[0] || ''
      if (targetPath) {
        await openNote(targetPath)
      } else {
        setSelectedNotePath('')
        setSelectedNoteName('')
        setNoteContent('')
        setNoteOriginalContent('')
      }
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setNotesLoading(false)
    }
  }

  async function saveNote() {
    if (!selectedNotePath) return
    try {
      const updated = await api.updateNoteFile(selectedNotePath, noteContent)
      setNoteOriginalContent(updated.content)
      notify('Note saved')
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  async function renameNotePath(path, currentName) {
    const nextName = window.prompt('New name', currentName)
    if (!nextName || !nextName.trim() || nextName.trim() === currentName) return
    try {
      await api.renameNotePath(path, nextName.trim())
      const parent = noteParentPath(path)
      const nextPath = joinNotePath(parent, nextName.trim())
      await fetchNotesTree(selectedNotePath === path ? nextPath : selectedNotePath)
      if (focusedNoteFolderPath === path) {
        setFocusedNoteFolderPath(nextPath)
      }
      notify('Path renamed')
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  async function deleteNotePath(path, type) {
    if (!window.confirm(`Delete this ${type}?`)) return
    try {
      await api.deleteNotePath(path)
      if (selectedNotePath === path || selectedNotePath.startsWith(`${path}/`)) {
        setSelectedNotePath('')
        setSelectedNoteName('')
        setNoteContent('')
        setNoteOriginalContent('')
      }
      if (focusedNoteFolderPath === path || focusedNoteFolderPath.startsWith(`${path}/`)) {
        setFocusedNoteFolderPath('')
      }
      await fetchNotesTree()
      notify(`${type === 'folder' ? 'Folder' : 'File'} deleted`)
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  async function createNoteFile(event) {
    event?.preventDefault()
    const name = noteNameInput.trim()
    if (!name) {
      notify('File name cannot be empty', 'error')
      return
    }
    const parentPath = focusedNoteFolderPath || ''
    try {
      const created = await api.createNoteFile(parentPath, name, '')
      setNoteFileDialogOpen(false)
      setNoteNameInput('')
      await fetchNotesTree(created.path)
      notify('File created')
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  async function createNoteFolder(event) {
    event?.preventDefault()
    const name = noteNameInput.trim()
    if (!name) {
      notify('Folder name cannot be empty', 'error')
      return
    }
    const parentPath = focusedNoteFolderPath || ''
    try {
      await api.createNoteFolder(parentPath, name)
      setNoteFolderDialogOpen(false)
      setNoteNameInput('')
      await fetchNotesTree()
      notify('Folder created')
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  async function uploadNoteFile(event) {
    event?.preventDefault()
    if (!noteUploadFile) {
      notify('Choose a file to upload', 'error')
      return
    }
    const parentPath = focusedNoteFolderPath || ''
    try {
      const uploaded = await api.uploadNoteFile(parentPath, noteUploadFile)
      setNoteUploadDialogOpen(false)
      setNoteUploadFile(null)
      await fetchNotesTree(uploaded.path)
      notify('File uploaded')
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  function handleNoteFolderClick(path) {
    setCollapsedNoteFolders((prev) => ({ ...prev, [path]: !prev[path] }))
    setFocusedNoteFolderPath((prev) => (prev === path ? '' : path))
  }

  useEffect(() => {
    if (!user || appMode !== 'notes') {
      return
    }
    fetchNotesTree().catch((err) => notify(err.message, 'error'))
  }, [user, appMode])

  useEffect(() => {
    if (!pendingAnchor || appMode !== 'notes') return
    scrollToAnchor(pendingAnchor)
    setPendingAnchor('')
  }, [pendingAnchor, noteContent, noteViewMode, appMode])

  return {
    notesTree,
    selectedNotePath,
    selectedNoteName,
    noteContent,
    noteOriginalContent,
    noteViewMode,
    notesLoading,
    noteFileDialogOpen,
    noteFolderDialogOpen,
    noteUploadDialogOpen,
    noteNameInput,
    noteUploadFile,
    mobileNotesTreeOpen,
    focusedNoteFolderPath,
    collapsedNoteFolders,
    pendingAnchor,
    noteHasUnsavedChanges,
    setSelectedNotePath,
    setSelectedNoteName,
    setNoteContent,
    setNoteOriginalContent,
    setNoteViewMode,
    setNoteFileDialogOpen,
    setNoteFolderDialogOpen,
    setNoteUploadDialogOpen,
    setNoteNameInput,
    setNoteUploadFile,
    setMobileNotesTreeOpen,
    setFocusedNoteFolderPath,
    setCollapsedNoteFolders,
    setPendingAnchor,
    fetchNotesTree,
    openNote,
    saveNote,
    renameNotePath,
    deleteNotePath,
    createNoteFile,
    createNoteFolder,
    uploadNoteFile,
    handleNoteFolderClick,
  }
}
