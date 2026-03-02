import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Palette,
  Check,
  RotateCcw,
  RefreshCcw,
  Download,
  Trash2,
  Pencil,
  Save,
  Upload,
  FolderPlus,
  ChevronRight,
  ChevronDown
} from 'lucide-react'

import { api } from './api'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'
import { Badge } from './components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './components/ui/dialog'

const MIN_REPEAT_AFTER = 1
const MAX_REPEAT_AFTER = 8
const THEME_STORAGE_KEY = 'ankie_theme'
const THEMES = [
  { key: 'solarized', label: 'Solarized', dark: false },
  { key: 'gruvbox', label: 'Gruvbox', dark: true },
  { key: 'dracula', label: 'Dracula', dark: true },
  { key: 'monokai', label: 'Monokai', dark: true },
  { key: 'one-dark', label: 'One Dark', dark: true },
  { key: 'nord', label: 'Nord', dark: true },
  { key: 'tomorrow-night', label: 'Tomorrow Night', dark: true },
  { key: 'tokyo-night', label: 'Tokyo Night', dark: true },
  { key: 'material-theme', label: 'Material Theme', dark: true },
  { key: 'ayu', label: 'Ayu', dark: true },
  { key: 'palenight', label: 'Palenight', dark: true },
  { key: 'papercolor', label: 'PaperColor', dark: false },
  { key: 'base16-ocean', label: 'Base16 (Ocean)', dark: true },
  { key: 'horizon', label: 'Horizon', dark: true },
  { key: 'night-owl', label: 'Night Owl', dark: true },
  { key: 'pop-dark', label: 'Pop Dark', dark: true },
  { key: 'edge', label: 'Edge', dark: true },
  { key: 'iceberg', label: 'Iceberg', dark: true },
  { key: 'atom-one-light', label: 'Atom One Light', dark: false },
  { key: 'catppuccin', label: 'Catppuccin', dark: true }
]

function randomRepeatAfter() {
  return Math.floor(Math.random() * (MAX_REPEAT_AFTER - MIN_REPEAT_AFTER + 1)) + MIN_REPEAT_AFTER
}

function CardActionButtons({ onEdit, onDelete }) {
  return (
    <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-2"
        onClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
      >
        <Pencil size={14} /> Edit
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="h-8 px-2"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <Trash2 size={14} /> Delete
      </Button>
    </div>
  )
}

function FlipCard({ card, flipped, onFlip, onEdit, onDelete }) {
  return (
    <div onClick={onFlip} className="w-full max-w-6xl cursor-pointer [perspective:1400px]">
      <div
        className="relative min-h-[520px] w-full [transform-style:preserve-3d] transition-transform duration-500"
        style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        <Card
          className="absolute inset-0 overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-transparent"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            opacity: flipped ? 0 : 1,
            visibility: flipped ? 'hidden' : 'visible'
          }}
        >
          <CardActionButtons onEdit={onEdit} onDelete={onDelete} />
          <CardHeader>
            <CardDescription>Question</CardDescription>
            <CardTitle className="text-3xl break-words whitespace-pre-wrap">{card.question}</CardTitle>
          </CardHeader>
          <CardContent className="flex h-[320px] flex-col">
            <p className="mt-4 text-sm text-muted-foreground">Click the card to flip</p>
          </CardContent>
        </Card>

        <Card
          className="absolute inset-0 overflow-hidden border-2 border-secondary/30 bg-gradient-to-br from-secondary/20 to-transparent"
          style={{
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            opacity: flipped ? 1 : 0,
            visibility: flipped ? 'visible' : 'hidden'
          }}
        >
          <CardActionButtons onEdit={onEdit} onDelete={onDelete} />
          <CardHeader>
            <CardDescription>Question</CardDescription>
            <CardTitle className="text-2xl break-words whitespace-pre-wrap">{card.question}</CardTitle>
          </CardHeader>
          <CardContent className="flex h-[320px] flex-col">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Answer</div>
            <div className="max-h-[230px] overflow-y-auto pr-1 text-xl font-medium whitespace-pre-wrap break-words">
              {card.answer}
            </div>
            <p className="mt-auto pt-4 text-sm text-muted-foreground">Choose “Know” or “Don't Know”</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function App() {
  const [themeKey, setThemeKey] = useState(localStorage.getItem(THEME_STORAGE_KEY) || 'catppuccin')
  const [authChecked, setAuthChecked] = useState(false)
  const [user, setUser] = useState(null)
  const [telegramBotUsername, setTelegramBotUsername] = useState('')
  const [collections, setCollections] = useState([])
  const [folders, setFolders] = useState([])
  const [selectedCollectionId, setSelectedCollectionId] = useState(null)
  const [selectedCollectionDetail, setSelectedCollectionDetail] = useState(null)
  const [nameInput, setNameInput] = useState('')
  const [folderNameInput, setFolderNameInput] = useState('')
  const [jsonFile, setJsonFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [snack, setSnack] = useState(null)
  const [sessionQueue, setSessionQueue] = useState([])
  const [flipped, setFlipped] = useState(false)
  const [editCard, setEditCard] = useState(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editAnswer, setEditAnswer] = useState('')
  const [draggedCollectionId, setDraggedCollectionId] = useState(null)
  const [collapsedFolders, setCollapsedFolders] = useState({})
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const telegramContainerRef = useRef(null)

  const selectedCollectionStats = useMemo(
    () => collections.find((c) => c.id === selectedCollectionId) || null,
    [collections, selectedCollectionId]
  )

  const currentCard = sessionQueue[0] || null
  const ungroupedCollections = useMemo(
    () => collections.filter((collection) => collection.folder_id == null),
    [collections]
  )
  const collectionsByFolder = useMemo(() => {
    const grouped = new Map()
    folders.forEach((folder) => grouped.set(folder.id, []))
    collections.forEach((collection) => {
      if (collection.folder_id != null && grouped.has(collection.folder_id)) {
        grouped.get(collection.folder_id).push(collection)
      }
    })
    return grouped
  }, [collections, folders])

  function notify(message, type = 'success') {
    setSnack({ message, type })
    window.setTimeout(() => setSnack(null), 3000)
  }

  async function fetchCollections() {
    const list = await api.getCollections()
    setCollections(list)

    if (!selectedCollectionId && list.length > 0) {
      setSelectedCollectionId(list[0].id)
    }

    if (selectedCollectionId && !list.some((c) => c.id === selectedCollectionId)) {
      setSelectedCollectionId(list.length ? list[0].id : null)
      setSelectedCollectionDetail(null)
      setSessionQueue([])
    }
  }

  async function fetchFolders() {
    const list = await api.getFolders()
    setFolders(list)
    setCollapsedFolders((prev) => {
      const next = { ...prev }
      list.forEach((folder) => {
        if (next[folder.id] == null) {
          next[folder.id] = false
        }
      })
      return next
    })
  }

  async function fetchCollectionDetail(collectionId) {
    if (!collectionId) {
      setSelectedCollectionDetail(null)
      setSessionQueue([])
      return
    }
    const detail = await api.getCollection(collectionId)
    setSelectedCollectionDetail(detail)
  }

  async function loadStudyCards(collectionId) {
    if (!collectionId) {
      setSessionQueue([])
      return
    }
    const result = await api.getStudyCards(collectionId)
    setSessionQueue(result.cards)
    setFlipped(false)
  }

  useEffect(() => {
    ;(async () => {
      try {
        const cfg = await api.getAuthConfig()
        setTelegramBotUsername(cfg.telegram_bot_username)
      } catch (err) {
        notify(err.message, 'error')
      }

      try {
        const me = await api.getMe()
        setUser(me)
        await Promise.all([fetchCollections(), fetchFolders()])
      } catch (err) {
        if (err.status !== 401) {
          notify(err.message, 'error')
        }
      } finally {
        setAuthChecked(true)
      }
    })()
  }, [])

  useEffect(() => {
    const theme = THEMES.find((item) => item.key === themeKey) || THEMES[0]
    localStorage.setItem(THEME_STORAGE_KEY, theme.key)
    document.documentElement.classList.toggle('dark', theme.dark)
    document.documentElement.setAttribute('data-theme', theme.key)
  }, [themeKey])

  useEffect(() => {
    if (!user || !selectedCollectionId) {
      return
    }

    Promise.all([fetchCollectionDetail(selectedCollectionId), loadStudyCards(selectedCollectionId)]).catch((err) =>
      notify(err.message, 'error')
    )
  }, [selectedCollectionId])

  useEffect(() => {
    if (!authChecked || user || !telegramBotUsername || !telegramContainerRef.current) {
      return
    }

    window.onTelegramAuth = async (telegramUser) => {
      try {
        await api.telegramAuth(telegramUser)
        const me = await api.getMe()
        setUser(me)
        await Promise.all([fetchCollections(), fetchFolders()])
        notify(`Welcome, ${me.first_name || me.username || 'user'}`)
      } catch (err) {
        notify(err.message, 'error')
      }
    }

    const container = telegramContainerRef.current
    container.innerHTML = ''
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', telegramBotUsername)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    container.appendChild(script)

    return () => {
      delete window.onTelegramAuth
    }
  }, [authChecked, user, telegramBotUsername])

  async function handleImport(event) {
    event.preventDefault()
    if (!nameInput.trim() || !jsonFile) {
      notify('Provide a collection name and JSON file', 'error')
      return
    }

    setLoading(true)
    try {
      const result = await api.importCollection(nameInput.trim(), jsonFile)
      setNameInput('')
      setJsonFile(null)
      await Promise.all([fetchCollections(), fetchFolders()])
      setSelectedCollectionId(result.collection_id)
      notify(`Imported ${result.imported_count} cards`)
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function markCurrentCard(known) {
    if (!currentCard) return

    try {
      await api.markCardProgress(currentCard.id, known)
      if (known) {
        setSessionQueue((prev) => prev.slice(1))
      } else {
        const repeatAfter = randomRepeatAfter()
        setSessionQueue((prev) => {
          const rest = prev.slice(1)
          const insertIndex = Math.min(repeatAfter, rest.length)
          return [...rest.slice(0, insertIndex), currentCard, ...rest.slice(insertIndex)]
        })
      }
      setFlipped(false)
      await Promise.all([fetchCollections(), fetchCollectionDetail(selectedCollectionId)])
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  async function resetProgress() {
    if (!selectedCollectionId) return
    setLoading(true)
    try {
      await api.resetCollection(selectedCollectionId)
      await Promise.all([
        fetchCollections(),
        fetchCollectionDetail(selectedCollectionId),
        loadStudyCards(selectedCollectionId)
      ])
      notify('Collection progress has been reset')
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function reloadSession() {
    if (!selectedCollectionId) return
    try {
      await loadStudyCards(selectedCollectionId)
      notify('Session reloaded')
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  async function removeCollection() {
    if (!selectedCollectionId) return
    if (!window.confirm('Delete this collection and all cards?')) return

    setLoading(true)
    try {
      await api.deleteCollection(selectedCollectionId)
      await Promise.all([fetchCollections(), fetchFolders()])
      notify('Collection deleted')
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function openEditDialog(card) {
    setEditCard(card)
    setEditQuestion(card.question)
    setEditAnswer(card.answer)
  }

  async function saveCardEdit() {
    if (!editCard) return
    setLoading(true)
    try {
      await api.updateCard(editCard.id, {
        question: editQuestion.trim(),
        answer: editAnswer.trim()
      })
      setEditCard(null)
      await Promise.all([
        fetchCollections(),
        fetchCollectionDetail(selectedCollectionId),
        loadStudyCards(selectedCollectionId)
      ])
      notify('Card updated')
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function removeCard(cardId) {
    if (!window.confirm('Delete this card?')) return

    setLoading(true)
    try {
      await api.deleteCard(cardId)
      await Promise.all([
        fetchCollections(),
        fetchCollectionDetail(selectedCollectionId),
        loadStudyCards(selectedCollectionId)
      ])
      notify('Card deleted')
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function createFolder(event) {
    event.preventDefault()
    const name = folderNameInput.trim()
    if (!name) {
      notify('Folder name cannot be empty', 'error')
      return
    }

    setLoading(true)
    try {
      await api.createFolder(name)
      setFolderNameInput('')
      await fetchFolders()
      notify('Folder created')
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function moveCollection(collectionId, folderId) {
    try {
      await api.moveCollectionToFolder(collectionId, folderId)
      await Promise.all([fetchCollections(), fetchFolders()])
      notify('Collection moved')
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setDraggedCollectionId(null)
    }
  }

  function toggleFolderCollapsed(folderId) {
    setCollapsedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }))
  }

  async function renameFolder(folder) {
    const nextName = window.prompt('New folder name', folder.name)
    if (!nextName || !nextName.trim() || nextName.trim() === folder.name) return

    try {
      await api.renameFolder(folder.id, nextName.trim())
      await fetchFolders()
      notify('Folder renamed')
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  async function deleteFolder(folder) {
    if (!window.confirm(`Delete folder "${folder.name}"? Collections will move to Ungrouped.`)) return

    try {
      await api.deleteFolder(folder.id)
      await Promise.all([fetchFolders(), fetchCollections()])
      notify('Folder deleted')
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  function collectionItemClass(collection) {
    if (collection.id === selectedCollectionId && collection.is_mastered) {
      return 'border-emerald-500 bg-emerald-500/20'
    }
    if (collection.id === selectedCollectionId) {
      return 'border-primary bg-primary/10'
    }
    if (collection.is_mastered) {
      return 'border-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15'
    }
    return 'hover:bg-accent'
  }

  async function exportCollection() {
    if (!selectedCollectionId || !selectedCollectionStats) return
    try {
      await api.exportCollection(selectedCollectionId, selectedCollectionStats.name)
      notify('Export is ready')
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  async function handleLogout() {
    try {
      await api.logout()
      setUser(null)
      setCollections([])
      setFolders([])
      setSelectedCollectionId(null)
      setSelectedCollectionDetail(null)
      setSessionQueue([])
      notify('Logged out')
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">Ankie Web</h1>
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => setThemeMenuOpen(true)}
            >
              <Palette size={16} />
              Theme
            </Button>
          </div>
          {user && (
            <Button type="button" variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </div>
      </header>

      {themeMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={() => setThemeMenuOpen(false)}
        >
          <Card
            className="w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>Choose Theme</CardTitle>
              <CardDescription>Pick one of the popular themes. Your choice is saved automatically.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {THEMES.map((theme) => {
                  const selected = themeKey === theme.key
                  return (
                    <button
                      key={theme.key}
                      className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
                        selected ? 'border-primary bg-primary/15' : 'hover:bg-accent'
                      }`}
                      onClick={() => {
                        setThemeKey(theme.key)
                        setThemeMenuOpen(false)
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${theme.dark ? 'bg-slate-800 dark:bg-slate-200' : 'bg-amber-400'}`} />
                        {theme.label}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="rounded border px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                          {theme.dark ? 'Dark' : 'Light'}
                        </span>
                        {selected && <Check size={14} />}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 flex justify-end">
                <Button type="button" variant="outline" onClick={() => setThemeMenuOpen(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!authChecked && (
        <div className="mx-auto max-w-[900px] p-6">
          <Card>
            <CardHeader>
              <CardTitle>Checking session…</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Please wait.</CardContent>
          </Card>
        </div>
      )}

      {authChecked && !user && (
        <div className="mx-auto max-w-[900px] p-6">
          <Card>
            <CardHeader>
              <CardTitle>Sign in with Telegram</CardTitle>
              <CardDescription>Each user gets isolated folders, collections, and progress.</CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={telegramContainerRef} />
            </CardContent>
          </Card>
        </div>
      )}

      {authChecked && user && (
        <div className="mx-auto grid max-w-[1800px] grid-cols-1 gap-4 p-4 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">New Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={handleImport}>
                <Input
                  placeholder="Collection name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  disabled={loading}
                />
                <label className="block">
                  <span className="mb-2 block text-sm text-muted-foreground">JSON file</span>
                  <Input
                    type="file"
                    accept="application/json,.json,text/json,text/plain"
                    onChange={(e) => setJsonFile(e.target.files?.[0] || null)}
                    disabled={loading}
                  />
                </label>
                <Button type="submit" className="w-full" disabled={loading}>
                  <Upload size={16} /> Create and import
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Folders & Collections</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[62vh] space-y-2 overflow-y-auto">
              <form className="flex gap-2" onSubmit={createFolder}>
                <Input
                  placeholder="New folder"
                  value={folderNameInput}
                  onChange={(e) => setFolderNameInput(e.target.value)}
                  disabled={loading}
                />
                <Button type="submit" variant="outline" disabled={loading}>
                  <FolderPlus size={16} />
                </Button>
              </form>

              <div
                className="rounded-md border border-dashed p-2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedCollectionId != null) {
                    moveCollection(draggedCollectionId, null)
                  }
                }}
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ungrouped</p>
                <div className="space-y-2">
                  {ungroupedCollections.map((collection) => (
                    <button
                      key={collection.id}
                      draggable
                      onDragStart={() => setDraggedCollectionId(collection.id)}
                      className={`w-full rounded-md border p-3 text-left transition ${collectionItemClass(collection)}`}
                      onClick={() => setSelectedCollectionId(collection.id)}
                    >
                      <div className={`font-medium ${collection.is_mastered ? 'text-emerald-700 dark:text-emerald-300' : ''}`}>
                        {collection.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Remaining: {collection.remaining_cards} / {collection.total_cards}
                      </div>
                    </button>
                  ))}
                  {ungroupedCollections.length === 0 && (
                    <p className="text-xs text-muted-foreground">Drop collections here</p>
                  )}
                </div>
              </div>

              {folders.map((folder) => {
                const folderCollections = collectionsByFolder.get(folder.id) || []
                const isCollapsed = Boolean(collapsedFolders[folder.id])
                return (
                  <div
                    key={folder.id}
                    className="rounded-md border p-2"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedCollectionId != null) {
                        moveCollection(draggedCollectionId, folder.id)
                      }
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <button
                        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        onClick={() => toggleFolderCollapsed(folder.id)}
                      >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                        {folder.name}
                        <span className="ml-1 rounded border px-1 py-0 text-[10px]">
                          {folderCollections.length}
                        </span>
                      </button>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => renameFolder(folder)}
                        >
                          <Pencil size={12} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-destructive"
                          onClick={() => deleteFolder(folder)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                    {!isCollapsed && (
                      <div className="space-y-2">
                        {folderCollections.map((collection) => (
                          <button
                            key={collection.id}
                            draggable
                            onDragStart={() => setDraggedCollectionId(collection.id)}
                            className={`w-full rounded-md border p-3 text-left transition ${collectionItemClass(collection)}`}
                            onClick={() => setSelectedCollectionId(collection.id)}
                          >
                            <div className={`font-medium ${collection.is_mastered ? 'text-emerald-700 dark:text-emerald-300' : ''}`}>
                              {collection.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Remaining: {collection.remaining_cards} / {collection.total_cards}
                            </div>
                          </button>
                        ))}
                        {folderCollections.length === 0 && (
                          <p className="text-xs text-muted-foreground">Drop collections here</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {collections.length === 0 && <p className="text-sm text-muted-foreground">No collections yet</p>}
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-4">
          {!selectedCollectionStats && (
            <Card>
              <CardHeader>
                <CardTitle>Upload your first JSON collection</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Formats: [{'{"question":"...","answer":"..."}'}] or {'{"cards":[{"q":"...","a":"..."}]}' }
              </CardContent>
            </Card>
          )}

          {selectedCollectionStats && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle>{selectedCollectionStats.name}</CardTitle>
                      <CardDescription>
                        Total: {selectedCollectionStats.total_cards} | Known: {selectedCollectionStats.known_cards} | Remaining:{' '}
                        {selectedCollectionStats.remaining_cards}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={reloadSession}><RefreshCcw size={16} /> Reload session</Button>
                      <Button variant="outline" onClick={resetProgress}><RotateCcw size={16} /> Reset progress</Button>
                      <Button variant="outline" onClick={exportCollection}><Download size={16} /> Export</Button>
                      <Button variant="destructive" onClick={removeCollection}><Trash2 size={16} /> Delete</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                  {selectedCollectionStats.is_mastered ? (
                    <Badge variant="secondary">Collection mastered</Badge>
                  ) : (
                    <Badge variant="outline">In progress</Badge>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex flex-col items-center gap-6 pt-6">
                  {!currentCard && <p className="text-xl font-semibold">No cards left for this session</p>}
                  {currentCard && (
                    <>
                      <FlipCard
                        card={currentCard}
                        flipped={flipped}
                        onFlip={() => setFlipped((v) => !v)}
                        onEdit={() => openEditDialog(currentCard)}
                        onDelete={() => removeCard(currentCard.id)}
                      />
                      <div className="flex gap-3">
                        <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50" onClick={() => markCurrentCard(false)}>
                          Don't Know
                        </Button>
                        <Button variant="secondary" onClick={() => markCurrentCard(true)}>Know</Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

            </>
          )}
        </main>
      </div>
      )}

      <Dialog open={Boolean(editCard)} onOpenChange={(isOpen) => !isOpen && setEditCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit card</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <textarea
              className="min-h-24 w-full rounded-md border border-input bg-background p-3 text-sm"
              value={editQuestion}
              onChange={(e) => setEditQuestion(e.target.value)}
              placeholder="Question"
            />
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-background p-3 text-sm"
              value={editAnswer}
              onChange={(e) => setEditAnswer(e.target.value)}
              placeholder="Answer"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCard(null)}>Cancel</Button>
            <Button onClick={saveCardEdit}><Save size={15} /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {snack && (
        <div
          className={`fixed bottom-4 right-4 rounded-md px-4 py-2 text-sm text-white shadow-lg ${
            snack.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          {snack.message}
        </div>
      )}
    </div>
  )
}
