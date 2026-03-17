import { useEffect, useMemo, useRef, useState } from 'react'
import { Palette, LogOut, PanelLeft, CircleHelp, FileText } from 'lucide-react'

import { api } from './api'
import { CollectionDialogs } from './components/CollectionDialogs'
import { FlashcardsMode } from './components/FlashcardsMode'
import { MobileCollectionsDialog } from './components/MobileCollectionsDialog'
import { MobileNotesDialog } from './components/MobileNotesDialog'
import { NotesDialogs } from './components/NotesDialogs'
import { NotesMode } from './components/NotesMode'
import { ThemePickerModal } from './components/ThemePickerModal'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './components/ui/dialog'
import { THEMES } from './constants/themes'
import { useFlashcardsFlow } from './hooks/useFlashcardsFlow'
import { useNotesFlow } from './hooks/useNotesFlow'

const THEME_STORAGE_KEY = 'ankie_theme'
const GUIDE_SEEN_KEY_PREFIX = 'ankie_guide_seen_'

export default function App() {
  const [themeKey, setThemeKey] = useState(localStorage.getItem(THEME_STORAGE_KEY) || 'catppuccin')
  const [authChecked, setAuthChecked] = useState(false)
  const [user, setUser] = useState(null)
  const [telegramBotUsername, setTelegramBotUsername] = useState('')
  const [snack, setSnack] = useState(null)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [appMode, setAppMode] = useState('flashcards')
  const telegramContainerRef = useRef(null)
  const profileMenuRef = useRef(null)
  const themeSyncIntervalRef = useRef(null)
  const suppressThemeSaveRef = useRef(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const displayName = useMemo(() => user?.first_name || user?.username || 'Telegram User', [user])
  const displayHandle = useMemo(
    () => (user?.username ? `@${user.username}` : `id: ${user?.telegram_id ?? ''}`),
    [user]
  )
  const userInitial = useMemo(() => (displayName?.trim()?.[0] || 'U').toUpperCase(), [displayName])
  const lightThemes = useMemo(() => THEMES.filter((theme) => !theme.dark), [])
  const darkThemes = useMemo(() => THEMES.filter((theme) => theme.dark), [])

  function notify(message, type = 'success') {
    setSnack({ message, type })
    window.setTimeout(() => setSnack(null), 3000)
  }

  const {
    collections,
    folders,
    selectedCollectionId,
    setSelectedCollectionId,
    selectedCollectionStats,
    sessionQueue,
    flipped,
    setFlipped,
    currentCard,
    ungroupedCollections,
    collectionsByFolder,
    nameInput,
    setNameInput,
    jsonFile,
    setJsonFile,
    folderNameInput,
    setFolderNameInput,
    loading,
    collectionDialogOpen,
    setCollectionDialogOpen,
    folderDialogOpen,
    setFolderDialogOpen,
    renameFolderTarget,
    setRenameFolderTarget,
    renameFolderInput,
    setRenameFolderInput,
    editCard,
    setEditCard,
    editQuestion,
    setEditQuestion,
    editAnswer,
    setEditAnswer,
    draggedCollectionId,
    setDraggedCollectionId,
    collapsedFolders,
    setCollapsedFolders,
    collectionMenuOpenId,
    setCollectionMenuOpenId,
    handleImport,
    createFolder,
    saveFolderRename,
    deleteFolder,
    moveCollectionToFolder,
    markCurrentCard,
    resetProgress,
    reloadSession,
    removeCollection,
    openEditDialog,
    saveCardEdit,
    removeCard
  } = useFlashcardsFlow({ user, notify })

  const {
    notesTree,
    selectedNotePath,
    selectedNoteName,
    noteContent,
    noteViewMode,
    notesLoading,
    noteFileDialogOpen,
    noteFolderDialogOpen,
    noteUploadDialogOpen,
    noteNameInput,
    mobileNotesTreeOpen,
    focusedNoteFolderPath,
    collapsedNoteFolders,
    noteHasUnsavedChanges,
    setNoteContent,
    setNoteViewMode,
    setNoteFileDialogOpen,
    setNoteFolderDialogOpen,
    setNoteUploadDialogOpen,
    setNoteNameInput,
    setNoteUploadFile,
    setMobileNotesTreeOpen,
    setFocusedNoteFolderPath,
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
  } = useNotesFlow({ user, appMode, notify })

  function showGuideIfNeeded(userPayload) {
    if (!userPayload?.id) return
    const key = `${GUIDE_SEEN_KEY_PREFIX}${userPayload.id}`
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1')
      setGuideOpen(true)
    }
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

  async function moveCollection(collectionId, folderId) {
    try {
      await moveCollectionToFolder(collectionId, folderId)
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

  async function deleteFolderByRef(folder) {
    await deleteFolder(folder.id)
  }

  function handleSelectCollection(collectionId) {
    setSelectedCollectionId(collectionId)
    if (mobileCollectionsOpen) {
      setMobileCollectionsOpen(false)
    }
  }

  function toggleCollectionMenu(nextId) {
    setCollectionMenuOpenId((prev) => {
      if (nextId == null) return null
      return prev === nextId ? null : nextId
    })
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
      notify('Logged out')
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  const collectionsListProps = {
    collections,
    folders,
    ungroupedCollections,
    collectionsByFolder,
    collapsedFolders,
    draggedCollectionId,
    collectionMenuOpenId,
    selectedCollectionId,
    onDragStart: setDraggedCollectionId,
    onSelect: handleSelectCollection,
    onToggleMenu: toggleCollectionMenu,
    onMove: moveCollection,
    onToggleFolderCollapsed: toggleFolderCollapsed,
    onOpenRenameFolderDialog: openRenameFolderDialog,
    onDeleteFolder: deleteFolderByRef
  }

  const notesTreeProps = {
    notesTree,
    selectedNotePath,
    focusedNoteFolderPath,
    collapsedNoteFolders,
    mobileNotesTreeOpen,
    onOpenNote: openNote,
    onSetFocusedFolder: setFocusedNoteFolderPath,
    onToggleFolderClick: handleNoteFolderClick,
    onRename: renameNotePath,
    onDelete: deleteNotePath,
    onCloseMobileTree: () => setMobileNotesTreeOpen(false)
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

      <ThemePickerModal
        open={themeMenuOpen}
        onClose={() => setThemeMenuOpen(false)}
        lightThemes={lightThemes}
        darkThemes={darkThemes}
        themeKey={themeKey}
        onSelectTheme={(key) => {
          setThemeKey(key)
          setThemeMenuOpen(false)
        }}
      />

      <MobileCollectionsDialog
        open={mobileCollectionsOpen}
        onOpenChange={setMobileCollectionsOpen}
        onOpenCollectionDialog={() => {
          setMobileCollectionsOpen(false)
          setCollectionDialogOpen(true)
        }}
        onOpenFolderDialog={() => {
          setMobileCollectionsOpen(false)
          setFolderDialogOpen(true)
        }}
        listProps={collectionsListProps}
      />

      <MobileNotesDialog
        open={mobileNotesTreeOpen}
        onOpenChange={setMobileNotesTreeOpen}
        onClearFocus={() => setFocusedNoteFolderPath('')}
        onOpenFileDialog={() => {
          setMobileNotesTreeOpen(false)
          setNoteFileDialogOpen(true)
        }}
        onOpenFolderDialog={() => {
          setMobileNotesTreeOpen(false)
          setNoteFolderDialogOpen(true)
        }}
        onOpenUploadDialog={() => {
          setMobileNotesTreeOpen(false)
          setNoteUploadDialogOpen(true)
        }}
        treeProps={notesTreeProps}
      />

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
            <FlashcardsMode
              setCollectionDialogOpen={setCollectionDialogOpen}
              setFolderDialogOpen={setFolderDialogOpen}
              collectionsListProps={collectionsListProps}
              selectedCollectionStats={selectedCollectionStats}
              reloadSession={reloadSession}
              resetProgress={resetProgress}
              exportCollection={exportCollection}
              removeCollection={removeCollection}
              currentCard={currentCard}
              flipped={flipped}
              setFlipped={setFlipped}
              openEditDialog={openEditDialog}
              removeCard={removeCard}
              markCurrentCard={markCurrentCard}
            />
          ) : (
            <NotesMode
              setFocusedNoteFolderPath={setFocusedNoteFolderPath}
              setNoteFileDialogOpen={setNoteFileDialogOpen}
              setNoteFolderDialogOpen={setNoteFolderDialogOpen}
              setNoteUploadDialogOpen={setNoteUploadDialogOpen}
              notesLoading={notesLoading}
              notesTreeProps={notesTreeProps}
              selectedNoteName={selectedNoteName}
              selectedNotePath={selectedNotePath}
              noteViewMode={noteViewMode}
              setNoteViewMode={setNoteViewMode}
              fetchNotesTree={fetchNotesTree}
              saveNote={saveNote}
              noteHasUnsavedChanges={noteHasUnsavedChanges}
              noteContent={noteContent}
              setNoteContent={setNoteContent}
              setPendingAnchor={setPendingAnchor}
              openNote={openNote}
            />
          )}
        </div>
      )}

      <NotesDialogs
        noteFileDialogOpen={noteFileDialogOpen}
        setNoteFileDialogOpen={setNoteFileDialogOpen}
        noteFolderDialogOpen={noteFolderDialogOpen}
        setNoteFolderDialogOpen={setNoteFolderDialogOpen}
        noteUploadDialogOpen={noteUploadDialogOpen}
        setNoteUploadDialogOpen={setNoteUploadDialogOpen}
        focusedNoteFolderPath={focusedNoteFolderPath}
        noteNameInput={noteNameInput}
        setNoteNameInput={setNoteNameInput}
        setNoteUploadFile={setNoteUploadFile}
        createNoteFile={createNoteFile}
        createNoteFolder={createNoteFolder}
        uploadNoteFile={uploadNoteFile}
      />

      <CollectionDialogs
        collectionDialogOpen={collectionDialogOpen}
        setCollectionDialogOpen={setCollectionDialogOpen}
        folderDialogOpen={folderDialogOpen}
        setFolderDialogOpen={setFolderDialogOpen}
        renameFolderTarget={renameFolderTarget}
        setRenameFolderTarget={setRenameFolderTarget}
        renameFolderInput={renameFolderInput}
        setRenameFolderInput={setRenameFolderInput}
        editCard={editCard}
        setEditCard={setEditCard}
        editQuestion={editQuestion}
        setEditQuestion={setEditQuestion}
        editAnswer={editAnswer}
        setEditAnswer={setEditAnswer}
        nameInput={nameInput}
        setNameInput={setNameInput}
        jsonFile={jsonFile}
        setJsonFile={setJsonFile}
        folderNameInput={folderNameInput}
        setFolderNameInput={setFolderNameInput}
        loading={loading}
        handleImport={handleImport}
        createFolder={createFolder}
        saveFolderRename={saveFolderRename}
        saveCardEdit={saveCardEdit}
      />

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
