import { memo, useEffect, useMemo, useRef, useState } from 'react'
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
  ChevronDown,
  MoreVertical,
  LogOut,
  PanelLeft,
  CircleHelp,
  FileText,
  Code2,
  Eye,
  Plus,
  FolderOpen
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { api } from './api'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'
import { Badge } from './components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './components/ui/dialog'

const MIN_REPEAT_AFTER = 1
const MAX_REPEAT_AFTER = 8
const THEME_STORAGE_KEY = 'ankie_theme'
const GUIDE_SEEN_KEY_PREFIX = 'ankie_guide_seen_'

function joinNotePath(parent, child) {
  const p = (parent || '').trim().replace(/^\/+|\/+$/g, '')
  const c = (child || '').trim().replace(/^\/+|\/+$/g, '')
  if (!p) return c
  if (!c) return p
  return `${p}/${c}`
}

function noteParentPath(path) {
  const normalized = (path || '').trim().replace(/^\/+|\/+$/g, '')
  if (!normalized.includes('/')) return ''
  return normalized.split('/').slice(0, -1).join('/')
}

function resolveRelativeNotePath(currentPath, relativePath) {
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
const THEMES = [
  { key: 'catppuccin', label: 'Catppuccin', dark: true, swatches: ['#cba6f7', '#89dceb', '#f38ba8'] },
  { key: 'solarized', label: 'Solarized', dark: false, swatches: ['#2aa198', '#cb4b16', '#b58900'] },
  { key: 'gruvbox', label: 'Gruvbox', dark: true, swatches: ['#d79921', '#98971a', '#cc241d'] },
  { key: 'dracula', label: 'Dracula', dark: true, swatches: ['#bd93f9', '#50fa7b', '#ff5555'] },
  { key: 'monokai', label: 'Monokai', dark: true, swatches: ['#a6e22e', '#66d9ef', '#f92672'] },
  { key: 'one-dark', label: 'One Dark', dark: true, swatches: ['#61afef', '#98c379', '#e06c75'] },
  { key: 'nord', label: 'Nord', dark: true, swatches: ['#88c0d0', '#a3be8c', '#bf616a'] },
  { key: 'tomorrow-night', label: 'Tomorrow Night', dark: true, swatches: ['#81a2be', '#b5bd68', '#cc6666'] },
  { key: 'tokyo-night', label: 'Tokyo Night', dark: true, swatches: ['#7aa2f7', '#73daca', '#f7768e'] },
  { key: 'material-theme', label: 'Material Theme', dark: true, swatches: ['#c792ea', '#89ddff', '#f07178'] },
  { key: 'ayu', label: 'Ayu', dark: true, swatches: ['#ffcc66', '#95e6cb', '#f28779'] },
  { key: 'palenight', label: 'Palenight', dark: true, swatches: ['#c792ea', '#89ddff', '#f07178'] },
  { key: 'papercolor', label: 'PaperColor', dark: false, swatches: ['#af005f', '#008700', '#d75f00'] },
  { key: 'base16-ocean', label: 'Base16 (Ocean)', dark: true, swatches: ['#8fa1b3', '#96b5b4', '#ab7967'] },
  { key: 'horizon', label: 'Horizon', dark: true, swatches: ['#fab795', '#59e1e3', '#e95678'] },
  { key: 'night-owl', label: 'Night Owl', dark: true, swatches: ['#82aaff', '#7fdbca', '#ff5874'] },
  { key: 'pop-dark', label: 'Pop Dark', dark: true, swatches: ['#be95ff', '#33b1ff', '#ff7eb6'] },
  { key: 'edge', label: 'Edge', dark: true, swatches: ['#4aa5f0', '#7ec699', '#ef6b73'] },
  { key: 'iceberg', label: 'Iceberg', dark: true, swatches: ['#84a0c6', '#89b8c2', '#e27878'] },
  { key: 'atom-one-light', label: 'Atom One Light', dark: false, swatches: ['#4078f2', '#50a14f', '#e45649'] },
  { key: 'github-light', label: 'GitHub Light', dark: false, swatches: ['#0969da', '#1a7f37', '#cf222e'] },
  { key: 'github-dark', label: 'GitHub Dark', dark: true, swatches: ['#58a6ff', '#3fb950', '#f85149'] },
  { key: 'github-dimmed', label: 'GitHub Dimmed', dark: true, swatches: ['#6cb6ff', '#57ab5a', '#f47067'] },
  { key: 'vscode-dark-plus', label: 'VS Code Dark+', dark: true, swatches: ['#569cd6', '#4ec9b0', '#f44747'] },
  { key: 'synthwave-84', label: 'Synthwave 84', dark: true, swatches: ['#f97e72', '#72f1b8', '#ff8bff'] },
  { key: 'cobalt2', label: 'Cobalt2', dark: true, swatches: ['#ffc600', '#3ad900', '#ff9d00'] },
  { key: 'rose-pine', label: 'Rosé Pine', dark: true, swatches: ['#c4a7e7', '#9ccfd8', '#eb6f92'] },
  { key: 'rose-pine-dawn', label: 'Rosé Pine Dawn', dark: false, swatches: ['#907aa9', '#56949f', '#b4637a'] },
  { key: 'everforest-dark', label: 'Everforest Dark', dark: true, swatches: ['#a7c080', '#7fbbb3', '#e67e80'] },
  { key: 'everforest-light', label: 'Everforest Light', dark: false, swatches: ['#8da101', '#35a77c', '#f85552'] },
  { key: 'kanagawa-wave', label: 'Kanagawa Wave', dark: true, swatches: ['#7e9cd8', '#98bb6c', '#e46876'] },
  { key: 'moonlight', label: 'Moonlight', dark: true, swatches: ['#82aaff', '#c3e88d', '#ff757f'] },
  { key: 'shades-of-purple', label: 'Shades of Purple', dark: true, swatches: ['#b362ff', '#00f5d4', '#ff628c'] },
  { key: 'xcode-dusk', label: 'Xcode Dusk', dark: true, swatches: ['#c77dff', '#7bd88f', '#ff6b6b'] },
  { key: 'tomorrow', label: 'Tomorrow', dark: false, swatches: ['#4271ae', '#718c00', '#c82829'] },
  { key: 'zenburn', label: 'Zenburn', dark: true, swatches: ['#8cd0d3', '#7f9f7f', '#cc9393'] },
  { key: 'high-contrast-light', label: 'High Contrast Light', dark: false, swatches: ['#0037ff', '#008a00', '#bf0000'] },
  { key: 'high-contrast-dark', label: 'High Contrast Dark', dark: true, swatches: ['#5ea1ff', '#68d391', '#fc8181'] },
  { key: 'arc-dark', label: 'Arc Dark', dark: true, swatches: ['#5294e2', '#99c794', '#ec5f67'] },
  { key: 'catppuccin-latte', label: 'Catppuccin Latte', dark: false, swatches: ['#8839ef', '#179299', '#d20f39'] }
]

function randomRepeatAfter() {
  return Math.floor(Math.random() * (MAX_REPEAT_AFTER - MIN_REPEAT_AFTER + 1)) + MIN_REPEAT_AFTER
}

const CardActionButtons = memo(function CardActionButtons({ onEdit, onDelete }) {
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
})

const FlipCard = memo(function FlipCard({ card, flipped, onFlip, onEdit, onDelete }) {
  return (
    <div onClick={onFlip} className="w-full max-w-6xl cursor-pointer [perspective:1400px]">
      <div
        className="relative min-h-[440px] w-full [transform-style:preserve-3d] transition-transform duration-500 sm:min-h-[520px]"
        style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        <Card
          className="glass-panel absolute inset-0 overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-transparent"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            opacity: flipped ? 0 : 1,
            visibility: flipped ? 'hidden' : 'visible'
          }}
        >
          <CardActionButtons onEdit={onEdit} onDelete={onDelete} />
          <CardHeader className="pb-2 sm:pb-4">
            <CardDescription>Question</CardDescription>
            <CardTitle className="text-2xl break-words whitespace-pre-wrap sm:text-3xl">{card.question}</CardTitle>
          </CardHeader>
          <CardContent className="flex h-[240px] flex-col sm:h-[320px]">
            <p className="mt-4 text-sm text-muted-foreground">Click the card to flip</p>
          </CardContent>
        </Card>

        <Card
          className="glass-panel absolute inset-0 overflow-hidden border-2 border-secondary/30 bg-gradient-to-br from-secondary/20 to-transparent"
          style={{
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            opacity: flipped ? 1 : 0,
            visibility: flipped ? 'visible' : 'hidden'
          }}
        >
          <CardActionButtons onEdit={onEdit} onDelete={onDelete} />
          <CardHeader className="pb-2 sm:pb-4">
            <CardDescription>Question</CardDescription>
            <CardTitle className="text-xl break-words whitespace-pre-wrap sm:text-2xl">{card.question}</CardTitle>
          </CardHeader>
          <CardContent className="flex h-[290px] flex-col sm:h-[390px]">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Answer</div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1 text-lg font-medium whitespace-pre-wrap break-words sm:text-xl">
              {card.answer}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Choose “Know” or “Don't Know”</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
})

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
  const [collectionMenuOpenId, setCollectionMenuOpenId] = useState(null)
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false)
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(false)
  const [renameFolderTarget, setRenameFolderTarget] = useState(null)
  const [renameFolderInput, setRenameFolderInput] = useState('')
  const [guideOpen, setGuideOpen] = useState(false)
  const [appMode, setAppMode] = useState('flashcards')
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
  const telegramContainerRef = useRef(null)
  const profileMenuRef = useRef(null)
  const statsSyncTimerRef = useRef(null)
  const themeSyncIntervalRef = useRef(null)
  const suppressThemeSaveRef = useRef(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

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
  const displayName = useMemo(() => user?.first_name || user?.username || 'Telegram User', [user])
  const displayHandle = useMemo(
    () => (user?.username ? `@${user.username}` : `id: ${user?.telegram_id ?? ''}`),
    [user]
  )
  const userInitial = useMemo(() => (displayName?.trim()?.[0] || 'U').toUpperCase(), [displayName])
  const lightThemes = useMemo(() => THEMES.filter((theme) => !theme.dark), [])
  const darkThemes = useMemo(() => THEMES.filter((theme) => theme.dark), [])
  const noteHasUnsavedChanges = noteContent !== noteOriginalContent

  function notify(message, type = 'success') {
    setSnack({ message, type })
    window.setTimeout(() => setSnack(null), 3000)
  }

  function scheduleStatsSync() {
    if (statsSyncTimerRef.current) {
      window.clearTimeout(statsSyncTimerRef.current)
    }
    statsSyncTimerRef.current = window.setTimeout(() => {
      fetchCollections().catch((err) => notify(err.message, 'error'))
    }, 900)
  }

  function showGuideIfNeeded(userPayload) {
    if (!userPayload?.id) return
    const key = `${GUIDE_SEEN_KEY_PREFIX}${userPayload.id}`
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1')
      setGuideOpen(true)
    }
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
        if (me.theme_key) {
          suppressThemeSaveRef.current = true
          setThemeKey(me.theme_key)
        }
        showGuideIfNeeded(me)
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
    if (!user) {
      return
    }
    if (suppressThemeSaveRef.current) {
      suppressThemeSaveRef.current = false
      return
    }
    api.updateTheme(theme.key).catch((err) => notify(err.message, 'error'))
  }, [themeKey, user])

  useEffect(() => {
    if (!user || !selectedCollectionId) {
      return
    }

    Promise.all([fetchCollectionDetail(selectedCollectionId), loadStudyCards(selectedCollectionId)]).catch((err) =>
      notify(err.message, 'error')
    )
  }, [selectedCollectionId])

  useEffect(() => {
    if (!user || appMode !== 'notes') {
      return
    }
    fetchNotesTree().catch((err) => notify(err.message, 'error'))
  }, [user, appMode])

  useEffect(() => {
    if (!authChecked || user || !telegramBotUsername || !telegramContainerRef.current) {
      return
    }

    window.onTelegramAuth = async (telegramUser) => {
      try {
        await api.telegramAuth(telegramUser)
        const me = await api.getMe()
        setUser(me)
        if (me.theme_key) {
          suppressThemeSaveRef.current = true
          setThemeKey(me.theme_key)
        }
        showGuideIfNeeded(me)
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

  useEffect(() => {
    function onDocumentClick(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', onDocumentClick)
    return () => document.removeEventListener('mousedown', onDocumentClick)
  }, [])

  useEffect(() => {
    return () => {
      if (statsSyncTimerRef.current) {
        window.clearTimeout(statsSyncTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!user) return

    const syncThemeFromServer = async () => {
      try {
        const me = await api.getMe()
        if (me.theme_key && me.theme_key !== themeKey) {
          suppressThemeSaveRef.current = true
          setThemeKey(me.theme_key)
        }
      } catch {
        // no-op: keep UI responsive if temporary network/auth issue
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncThemeFromServer()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    themeSyncIntervalRef.current = window.setInterval(syncThemeFromServer, 30000)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (themeSyncIntervalRef.current) {
        window.clearInterval(themeSyncIntervalRef.current)
        themeSyncIntervalRef.current = null
      }
    }
  }, [user, themeKey])

  async function handleImport(event) {
    event?.preventDefault()
    if (!nameInput.trim() || !jsonFile) {
      notify('Provide a collection name and JSON file', 'error')
      return
    }

    setLoading(true)
    try {
      const result = await api.importCollection(nameInput.trim(), jsonFile)
      setNameInput('')
      setJsonFile(null)
      setCollectionDialogOpen(false)
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
      if (selectedCollectionId && known) {
        setCollections((prev) =>
          prev.map((item) => {
            if (item.id !== selectedCollectionId) {
              return item
            }
            const knownCards = Math.min(item.total_cards, item.known_cards + 1)
            const remainingCards = Math.max(0, item.remaining_cards - 1)
            return {
              ...item,
              known_cards: knownCards,
              remaining_cards: remainingCards,
              is_mastered: item.total_cards > 0 && remainingCards === 0
            }
          })
        )
      }
      if (selectedCollectionId) {
        setSelectedCollectionDetail((prev) => {
          if (!prev || prev.id !== selectedCollectionId) {
            return prev
          }
          const nextKnown = known ? Math.min(prev.total_cards, prev.known_cards + 1) : prev.known_cards
          const nextRemaining = known ? Math.max(0, prev.remaining_cards - 1) : prev.remaining_cards
          return {
            ...prev,
            known_cards: nextKnown,
            remaining_cards: nextRemaining,
            is_mastered: prev.total_cards > 0 && nextRemaining === 0,
            cards: prev.cards.map((card) => (card.id === currentCard.id ? { ...card, known } : card))
          }
        })
      }
      setFlipped(false)
      scheduleStatsSync()
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
    event?.preventDefault()
    const name = folderNameInput.trim()
    if (!name) {
      notify('Folder name cannot be empty', 'error')
      return
    }

    setLoading(true)
    try {
      await api.createFolder(name)
      setFolderNameInput('')
      setFolderDialogOpen(false)
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

  function openRenameFolderDialog(folder) {
    setRenameFolderTarget(folder)
    setRenameFolderInput(folder.name)
  }

  async function saveFolderRename(event) {
    event?.preventDefault()
    if (!renameFolderTarget) return
    const nextName = renameFolderInput.trim()
    if (!nextName) {
      notify('Folder name cannot be empty', 'error')
      return
    }
    if (nextName === renameFolderTarget.name) {
      setRenameFolderTarget(null)
      return
    }

    try {
      await api.renameFolder(renameFolderTarget.id, nextName)
      await fetchFolders()
      setRenameFolderTarget(null)
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

  function renderCollectionItem(collection) {
    const isMenuOpen = collectionMenuOpenId === collection.id
    return (
      <div
        key={collection.id}
        draggable
        onDragStart={() => setDraggedCollectionId(collection.id)}
        className={`relative w-full rounded-md border bg-card/55 p-3 text-left transition ${collectionItemClass(collection)} ${
          isMenuOpen ? 'z-30' : ''
        }`}
        onClick={() => {
          setSelectedCollectionId(collection.id)
          if (mobileCollectionsOpen) {
            setMobileCollectionsOpen(false)
          }
        }}
      >
        <div className="pr-9">
          <div className={`font-medium ${collection.is_mastered ? 'text-emerald-700 dark:text-emerald-300' : ''}`}>
            {collection.name}
          </div>
          <div className="text-xs text-muted-foreground">
            Remaining: {collection.remaining_cards} / {collection.total_cards}
          </div>
        </div>
        <div className="absolute right-2 top-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation()
              setCollectionMenuOpenId((prev) => (prev === collection.id ? null : collection.id))
            }}
          >
            <MoreVertical size={14} />
          </Button>
          {isMenuOpen && (
            <div
              className="absolute right-0 z-50 mt-1 w-44 rounded-md border bg-card p-1 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={() => {
                  moveCollection(collection.id, null)
                  setCollectionMenuOpenId(null)
                }}
              >
                Move to Ungrouped
              </button>
              {folders.map((folder) => (
                <button
                  key={`${collection.id}-folder-${folder.id}`}
                  className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    moveCollection(collection.id, folder.id)
                    setCollectionMenuOpenId(null)
                  }}
                >
                  Move to {folder.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderCollectionsList(scrollClassName = '') {
    return (
      <div className={`space-y-2 ${scrollClassName}`}>
        <div
          className="rounded-md border border-dashed bg-card/45 p-2"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (draggedCollectionId != null) {
              moveCollection(draggedCollectionId, null)
            }
          }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ungrouped</p>
          <div className="space-y-2">
            {ungroupedCollections.map((collection) => renderCollectionItem(collection))}
            {ungroupedCollections.length === 0 && <p className="text-xs text-muted-foreground">Drop collections here</p>}
          </div>
        </div>

        {folders.map((folder) => {
          const folderCollections = collectionsByFolder.get(folder.id) || []
          const isCollapsed = Boolean(collapsedFolders[folder.id])
          return (
            <div
              key={folder.id}
              className="rounded-md border bg-card/45 p-2"
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
                  <span className="ml-1 rounded border px-1 py-0 text-[10px]">{folderCollections.length}</span>
                </button>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => openRenameFolderDialog(folder)}
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
                  {folderCollections.map((collection) => renderCollectionItem(collection))}
                  {folderCollections.length === 0 && <p className="text-xs text-muted-foreground">Drop collections here</p>}
                </div>
              )}
            </div>
          )
        })}

        {collections.length === 0 && <p className="text-sm text-muted-foreground">No collections yet</p>}
      </div>
    )
  }

  function renderNoteNode(node, depth = 0) {
    const isFile = node.type === 'file'
    const isMd = node.path.toLowerCase().endsWith('.md')
    const isSelected = selectedNotePath === node.path
    const isFocusedFolder = !isFile && focusedNoteFolderPath === node.path
    return (
      <div key={node.path || `root-${node.name}`}>
        <div
          className={`group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition ${
            isSelected || isFocusedFolder ? 'bg-primary/15 text-primary' : 'hover:bg-accent'
          }`}
          style={{ paddingLeft: `${0.5 + depth * 0.9}rem` }}
        >
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2"
            onClick={() => {
              if (isFile && isMd) {
                openNote(node.path)
                setFocusedNoteFolderPath(noteParentPath(node.path))
                if (mobileNotesTreeOpen) setMobileNotesTreeOpen(false)
              } else if (!isFile) {
                setFocusedNoteFolderPath(node.path)
              }
            }}
          >
            {isFile ? <FileText size={14} className="shrink-0" /> : <FolderOpen size={14} className="shrink-0" />}
            <span className="truncate">{node.name}</span>
          </button>
          <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                renameNotePath(node.path, node.name)
              }}
              title="Rename"
            >
              <Pencil size={12} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                deleteNotePath(node.path, node.type)
              }}
              title="Delete"
            >
              <Trash2 size={12} />
            </Button>
          </div>
        </div>
        {node.children?.map((child) => renderNoteNode(child, depth + 1))}
      </div>
    )
  }

  function renderNotesTree() {
    if (!notesTree.length) {
      return <p className="text-sm text-muted-foreground">No notes yet</p>
    }
    return <div className="space-y-1">{notesTree.map((node) => renderNoteNode(node))}</div>
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
      <header className="sticky top-3 z-30 px-4">
        <div className="frosted-surface mx-auto flex max-w-[1800px] items-center justify-between rounded-2xl px-3 py-2.5 sm:px-5 sm:py-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Ankie Web</h1>
            {user && (
              <div className="hidden items-center rounded-lg border bg-card/60 p-1 sm:flex">
                <Button
                  type="button"
                  size="sm"
                  variant={appMode === 'flashcards' ? 'secondary' : 'ghost'}
                  className="h-8"
                  onClick={() => setAppMode('flashcards')}
                >
                  Flashcards
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={appMode === 'notes' ? 'secondary' : 'ghost'}
                  className="h-8"
                  onClick={() => setAppMode('notes')}
                >
                  Notes
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="sm:hidden"
                onClick={() => setAppMode((prev) => (prev === 'flashcards' ? 'notes' : 'flashcards'))}
                title={appMode === 'flashcards' ? 'Switch to Notes' : 'Switch to Flashcards'}
              >
                <FileText size={16} />
              </Button>
            )}
            {user && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 lg:hidden"
                onClick={() => {
                  if (appMode === 'notes') {
                    setMobileNotesTreeOpen(true)
                  } else {
                    setMobileCollectionsOpen(true)
                  }
                }}
              >
                <PanelLeft size={16} />
                <span className="hidden sm:inline">{appMode === 'notes' ? 'Notes' : 'Collections'}</span>
              </Button>
            )}
            {user && (
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setGuideOpen(true)}
              >
                <CircleHelp size={16} />
                <span className="hidden sm:inline">Guide</span>
              </Button>
            )}
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setThemeMenuOpen(true)}
              >
                <Palette size={16} />
                <span className="hidden sm:inline">Theme</span>
              </Button>
            </div>
            {user && (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-white/25 bg-card/70 px-2 py-1 shadow-sm transition hover:bg-card"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                >
                  {user.photo_url ? (
                    <img
                      src={user.photo_url}
                      alt={displayName}
                      className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                      {userInitial}
                    </span>
                  )}
                  <span className="hidden max-w-[180px] truncate pr-1 text-sm font-medium sm:inline">{displayName}</span>
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 z-40 mt-2 w-60 rounded-xl border bg-card/95 p-2 shadow-xl backdrop-blur">
                    <div className="rounded-lg px-2 py-1.5">
                      <div className="truncate text-sm font-semibold">{displayName}</div>
                      <div className="truncate text-xs text-muted-foreground">{displayHandle}</div>
                    </div>
                    <button
                      type="button"
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-destructive transition hover:bg-destructive/10"
                      onClick={async () => {
                        setProfileMenuOpen(false)
                        await handleLogout()
                      }}
                    >
                      <LogOut size={14} />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {themeMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={() => setThemeMenuOpen(false)}
        >
          <Card className="frosted-surface w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Choose Theme</CardTitle>
              <CardDescription>
                Pick one of the popular themes. Your choice is saved automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[70vh] overflow-y-auto px-3 pb-3">
              <div className="space-y-4 rounded-xl border border-border/50 bg-background/25 p-3">
                <div>
                  <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Light Themes
                  </p>
                  <div className="space-y-2">
                    {lightThemes.map((theme) => {
                      const selected = themeKey === theme.key
                      return (
                        <button
                          key={theme.key}
                          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                            selected ? 'border-primary bg-primary/15' : 'hover:bg-accent'
                          }`}
                          onClick={() => {
                            setThemeKey(theme.key)
                            setThemeMenuOpen(false)
                          }}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="inline-flex items-center rounded-full border px-2 py-1">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.swatches[0] }} />
                              <span className="ml-1.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.swatches[1] }} />
                              <span className="ml-1.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.swatches[2] }} />
                            </span>
                            <span className="truncate">{theme.label}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="w-12 rounded border px-1.5 py-0.5 text-center text-[10px] uppercase text-muted-foreground">
                              Light
                            </span>
                            {selected && <Check size={14} />}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Dark Themes
                  </p>
                  <div className="space-y-2">
                    {darkThemes.map((theme) => {
                      const selected = themeKey === theme.key
                      return (
                        <button
                          key={theme.key}
                          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                            selected ? 'border-primary bg-primary/15' : 'hover:bg-accent'
                          }`}
                          onClick={() => {
                            setThemeKey(theme.key)
                            setThemeMenuOpen(false)
                          }}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="inline-flex items-center rounded-full border px-2 py-1">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.swatches[0] }} />
                              <span className="ml-1.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.swatches[1] }} />
                              <span className="ml-1.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.swatches[2] }} />
                            </span>
                            <span className="truncate">{theme.label}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="w-12 rounded border px-1.5 py-0.5 text-center text-[10px] uppercase text-muted-foreground">
                              Dark
                            </span>
                            {selected && <Check size={14} />}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
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

      <Dialog open={mobileCollectionsOpen} onOpenChange={setMobileCollectionsOpen}>
        <DialogContent className="frosted-surface flex h-[88vh] w-[96vw] max-w-none flex-col sm:max-w-xl lg:hidden">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle>Folders & Collections</DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => {
                    setMobileCollectionsOpen(false)
                    setCollectionDialogOpen(true)
                  }}
                  title="Add collection"
                >
                  <Upload size={14} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => {
                    setMobileCollectionsOpen(false)
                    setFolderDialogOpen(true)
                  }}
                  title="Add folder"
                >
                  <FolderPlus size={14} />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
            {renderCollectionsList()}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={mobileNotesTreeOpen} onOpenChange={setMobileNotesTreeOpen}>
        <DialogContent className="frosted-surface flex h-[88vh] w-[96vw] max-w-none flex-col sm:max-w-xl lg:hidden">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle>Notes</DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => {
                    setMobileNotesTreeOpen(false)
                    setNoteFileDialogOpen(true)
                  }}
                  title="Create file"
                >
                  <Plus size={14} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => {
                    setMobileNotesTreeOpen(false)
                    setNoteFolderDialogOpen(true)
                  }}
                  title="Create folder"
                >
                  <FolderPlus size={14} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => {
                    setMobileNotesTreeOpen(false)
                    setNoteUploadDialogOpen(true)
                  }}
                  title="Upload file"
                >
                  <Upload size={14} />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">{renderNotesTree()}</div>
        </DialogContent>
      </Dialog>

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="frosted-surface max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quick Start Guide</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm leading-relaxed text-foreground">
            <p>1. Choose mode in top bar: `Flashcards` for study or `Notes` for markdown files.</p>
            <p>2. In Flashcards, import JSON collection and start reviewing cards.</p>
            <p>3. JSON format: [{'{ "question": "...", "answer": "..." }'}] or {'{ "cards": [{ "q": "...", "a": "..." }] }'}.</p>
            <p>4. Use “Know” if answered correctly, or “Don't Know” to repeat the card later.</p>
            <p>5. In Notes, open a markdown file from sidebar and switch between `Preview` and `Code`.</p>
            <p>6. Create folder, create empty file, or upload file from notes toolbar.</p>
            <p>7. Change theme anytime and reopen this guide with the `Guide` button.</p>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setGuideOpen(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!authChecked && (
        <div className="mx-auto max-w-[900px] p-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Checking session…</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Please wait.</CardContent>
          </Card>
        </div>
      )}

      {authChecked && !user && (
        <div className="mx-auto max-w-[900px] p-6">
          <Card className="glass-panel">
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
        <div className="mx-auto grid max-w-[1800px] grid-cols-1 items-start gap-4 p-4 pt-8 lg:grid-cols-[340px_1fr]">
          {appMode === 'flashcards' ? (
            <>
              <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block">
                <Card className="glass-panel lg:h-[calc(100vh-7.5rem)]">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg">Folders & Collections</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" className="h-8 px-2" onClick={() => setCollectionDialogOpen(true)} title="Add collection">
                          <Upload size={14} />
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="h-8 px-2" onClick={() => setFolderDialogOpen(true)} title="Add folder">
                          <FolderPlus size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="hide-scrollbar overflow-y-auto lg:h-[calc(100vh-13.5rem)]">
                    {renderCollectionsList()}
                  </CardContent>
                </Card>
              </aside>

              <main className="space-y-4 lg:flex lg:h-[calc(100vh-7.5rem)] lg:flex-col lg:gap-4 lg:space-y-0">
                {!selectedCollectionStats && (
                  <Card className="glass-panel lg:h-full">
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
                    <Card className="glass-panel">
                      <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <CardTitle>{selectedCollectionStats.name}</CardTitle>
                            <CardDescription>
                              Total: {selectedCollectionStats.total_cards} | Known: {selectedCollectionStats.known_cards} | Remaining:{' '}
                              {selectedCollectionStats.remaining_cards}
                            </CardDescription>
                          </div>
                          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                            <Button className="w-full sm:w-auto" variant="outline" onClick={reloadSession}><RefreshCcw size={16} /> Reload session</Button>
                            <Button className="w-full sm:w-auto" variant="outline" onClick={resetProgress}><RotateCcw size={16} /> Reset progress</Button>
                            <Button className="w-full sm:w-auto" variant="outline" onClick={exportCollection}><Download size={16} /> Export</Button>
                            <Button className="w-full sm:w-auto" variant="destructive" onClick={removeCollection}><Trash2 size={16} /> Delete</Button>
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

                    <Card className="glass-panel lg:min-h-0 lg:flex-1">
                      <CardContent className="flex flex-col items-center gap-6 pt-6 lg:h-full lg:pb-6">
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
                            <div className="flex w-full max-w-2xl flex-col items-center gap-3 sm:flex-row sm:justify-center">
                              <Button variant="outline" className="w-full border-amber-500 text-amber-600 hover:bg-amber-50 sm:w-auto" onClick={() => markCurrentCard(false)}>
                                Don't Know
                              </Button>
                              <Button className="w-full sm:w-auto" variant="secondary" onClick={() => markCurrentCard(true)}>Know</Button>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </main>
            </>
          ) : (
            <>
              <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block">
                <Card className="glass-panel lg:h-[calc(100vh-7.5rem)]">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg">Notes</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" className="h-8 px-2" onClick={() => setNoteFileDialogOpen(true)} title="Create file">
                          <Plus size={14} />
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="h-8 px-2" onClick={() => setNoteFolderDialogOpen(true)} title="Create folder">
                          <FolderPlus size={14} />
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="h-8 px-2" onClick={() => setNoteUploadDialogOpen(true)} title="Upload file">
                          <Upload size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="hide-scrollbar overflow-y-auto lg:h-[calc(100vh-13.5rem)]">
                    {notesLoading ? <p className="text-sm text-muted-foreground">Loading notes...</p> : renderNotesTree()}
                  </CardContent>
                </Card>
              </aside>

              <main className="space-y-4 lg:flex lg:h-[calc(100vh-7.5rem)] lg:flex-col lg:gap-4 lg:space-y-0">
                <Card className="glass-panel">
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle>{selectedNoteName || 'Select a markdown file'}</CardTitle>
                        <CardDescription>{selectedNotePath || 'Choose a file from Notes sidebar'}</CardDescription>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant={noteViewMode === 'preview' ? 'secondary' : 'outline'} onClick={() => setNoteViewMode('preview')}>
                          <Eye size={16} /> Preview
                        </Button>
                        <Button type="button" variant={noteViewMode === 'code' ? 'secondary' : 'outline'} onClick={() => setNoteViewMode('code')}>
                          <Code2 size={16} /> Code
                        </Button>
                        <Button type="button" variant="outline" onClick={() => fetchNotesTree(selectedNotePath)}>
                          <RefreshCcw size={16} /> Reload
                        </Button>
                        <Button type="button" onClick={saveNote} disabled={!selectedNotePath || !noteHasUnsavedChanges}>
                          <Save size={16} /> Save
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="glass-panel lg:min-h-0 lg:flex-1">
                  <CardContent className="pt-6 lg:flex lg:h-full lg:flex-col">
                    {!selectedNotePath && <p className="text-sm text-muted-foreground">No markdown file selected.</p>}
                    {selectedNotePath && noteViewMode === 'code' && (
                      <textarea
                        className="hide-scrollbar h-[65vh] w-full resize-none rounded-md border border-input bg-background/70 p-3 font-mono text-sm lg:h-full lg:flex-1"
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Markdown content"
                      />
                    )}
                    {selectedNotePath && noteViewMode === 'preview' && (
                      <div className="obsidian-preview hide-scrollbar h-[65vh] overflow-y-auto rounded-md border bg-background/35 p-4 lg:h-full lg:flex-1">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            img: ({ src, alt }) => {
                              const resolved = resolveRelativeNotePath(selectedNotePath, String(src || ''))
                              return <img src={api.noteRawUrl(resolved)} alt={alt || ''} loading="lazy" />
                            },
                            a: ({ href, children }) => {
                              const raw = String(href || '')
                              const resolved = resolveRelativeNotePath(selectedNotePath, raw)
                              if (resolved.toLowerCase().endsWith('.md')) {
                                return (
                                  <button
                                    type="button"
                                    className="text-primary underline"
                                    onClick={() => openNote(resolved)}
                                  >
                                    {children}
                                  </button>
                                )
                              }
                              return (
                                <a href={resolved ? api.noteRawUrl(resolved) : raw} target="_blank" rel="noreferrer">
                                  {children}
                                </a>
                              )
                            }
                          }}
                        >
                          {noteContent || '*Empty file*'}
                        </ReactMarkdown>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </main>
            </>
          )}
        </div>
      )}

      <Dialog open={noteFileDialogOpen} onOpenChange={setNoteFileDialogOpen}>
        <DialogContent className="frosted-surface">
          <DialogHeader>
            <DialogTitle>Create Note File</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={createNoteFile}>
            <p className="text-xs text-muted-foreground">
              Parent: <span className="font-medium">{focusedNoteFolderPath || '/'}</span>
            </p>
            <Input
              placeholder="File name, e.g. notes.md"
              value={noteNameInput}
              onChange={(e) => setNoteNameInput(e.target.value)}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNoteFileDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Plus size={16} /> Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={noteFolderDialogOpen} onOpenChange={setNoteFolderDialogOpen}>
        <DialogContent className="frosted-surface">
          <DialogHeader>
            <DialogTitle>Create Note Folder</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={createNoteFolder}>
            <p className="text-xs text-muted-foreground">
              Parent: <span className="font-medium">{focusedNoteFolderPath || '/'}</span>
            </p>
            <Input
              placeholder="Folder name"
              value={noteNameInput}
              onChange={(e) => setNoteNameInput(e.target.value)}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNoteFolderDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <FolderPlus size={16} /> Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={noteUploadDialogOpen} onOpenChange={setNoteUploadDialogOpen}>
        <DialogContent className="frosted-surface">
          <DialogHeader>
            <DialogTitle>Upload Note File</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={uploadNoteFile}>
            <p className="text-xs text-muted-foreground">
              Parent: <span className="font-medium">{focusedNoteFolderPath || '/'}</span>
            </p>
            <Input
              type="file"
              onChange={(e) => setNoteUploadFile(e.target.files?.[0] || null)}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNoteUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Upload size={16} /> Upload
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={collectionDialogOpen} onOpenChange={setCollectionDialogOpen}>
        <DialogContent className="frosted-surface">
          <DialogHeader>
            <DialogTitle>Add Collection</DialogTitle>
          </DialogHeader>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCollectionDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Upload size={16} /> Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="frosted-surface">
          <DialogHeader>
            <DialogTitle>Add Folder</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={createFolder}>
            <Input
              placeholder="Folder name"
              value={folderNameInput}
              onChange={(e) => setFolderNameInput(e.target.value)}
              disabled={loading}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFolderDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <FolderPlus size={16} /> Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(renameFolderTarget)} onOpenChange={(isOpen) => !isOpen && setRenameFolderTarget(null)}>
        <DialogContent className="frosted-surface">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={saveFolderRename}>
            <Input
              placeholder="Folder name"
              value={renameFolderInput}
              onChange={(e) => setRenameFolderInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenameFolderTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save size={16} /> Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editCard)} onOpenChange={(isOpen) => !isOpen && setEditCard(null)}>
        <DialogContent className="glass-panel">
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
