import { useEffect, useMemo, useRef, useState } from 'react'

import { api } from '../api'

const MIN_REPEAT_AFTER = 1
const MAX_REPEAT_AFTER = 8

function randomRepeatAfter() {
  return Math.floor(Math.random() * (MAX_REPEAT_AFTER - MIN_REPEAT_AFTER + 1)) + MIN_REPEAT_AFTER
}

export function useFlashcardsFlow({ user, notify }) {
  const [collections, setCollections] = useState([])
  const [folders, setFolders] = useState([])
  const [selectedCollectionId, setSelectedCollectionId] = useState(null)
  const [nameInput, setNameInput] = useState('')
  const [folderNameInput, setFolderNameInput] = useState('')
  const [jsonFile, setJsonFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sessionQueue, setSessionQueue] = useState([])
  const [flipped, setFlipped] = useState(false)
  const [editCard, setEditCard] = useState(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editAnswer, setEditAnswer] = useState('')
  const [draggedCollectionId, setDraggedCollectionId] = useState(null)
  const [collapsedFolders, setCollapsedFolders] = useState({})
  const [collectionMenuOpenId, setCollectionMenuOpenId] = useState(null)
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false)
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [renameFolderTarget, setRenameFolderTarget] = useState(null)
  const [renameFolderInput, setRenameFolderInput] = useState('')
  const [studyOffset, setStudyOffset] = useState(0)
  const [studyRemaining, setStudyRemaining] = useState(0)

  const statsSyncTimerRef = useRef(null)

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

  function scheduleStatsSync() {
    if (statsSyncTimerRef.current) {
      window.clearTimeout(statsSyncTimerRef.current)
    }
    statsSyncTimerRef.current = window.setTimeout(() => {
      fetchCollections().catch((err) => notify(err.message, 'error'))
    }, 900)
  }

  async function fetchCollections() {
    const list = await api.getCollections()
    setCollections(list)

    if (!selectedCollectionId && list.length > 0) {
      setSelectedCollectionId(list[0].id)
    }

    if (selectedCollectionId && !list.some((c) => c.id === selectedCollectionId)) {
      setSelectedCollectionId(list.length ? list[0].id : null)
      setSessionQueue([])
      setStudyOffset(0)
      setStudyRemaining(0)
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

  async function loadStudyCards(collectionId, { reset = false } = {}) {
    if (!collectionId) {
      setSessionQueue([])
      setStudyOffset(0)
      setStudyRemaining(0)
      return
    }
    const offset = reset ? 0 : studyOffset
    const result = await api.getStudyCards(collectionId, { offset, limit: 200 })
    const shuffled = [...result.cards].sort(() => Math.random() - 0.5)
    setStudyRemaining(result.remaining_cards)
    setStudyOffset(offset + result.cards.length)
    setSessionQueue((prev) => (reset ? shuffled : [...prev, ...shuffled]))
    setFlipped(false)
  }

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
        setStudyRemaining((prev) => Math.max(0, prev - 1))
      }
      setFlipped(false)
      const nextQueueLength = known ? Math.max(0, sessionQueue.length - 1) : sessionQueue.length
      if (nextQueueLength <= 2 && studyOffset < studyRemaining) {
        await loadStudyCards(selectedCollectionId)
      }
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
      await Promise.all([fetchCollections(), loadStudyCards(selectedCollectionId, { reset: true })])
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
      await loadStudyCards(selectedCollectionId, { reset: true })
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
      await Promise.all([fetchCollections(), loadStudyCards(selectedCollectionId, { reset: true })])
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
      await Promise.all([fetchCollections(), loadStudyCards(selectedCollectionId, { reset: true })])
      notify('Card deleted')
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function createFolder(event) {
    event?.preventDefault()
    if (!folderNameInput.trim()) {
      notify('Folder name cannot be empty', 'error')
      return
    }

    setLoading(true)
    try {
      await api.createFolder(folderNameInput.trim())
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

  async function saveFolderRename(event) {
    event?.preventDefault()
    if (!renameFolderTarget || !renameFolderInput.trim()) return
    setLoading(true)
    try {
      await api.renameFolder(renameFolderTarget.id, renameFolderInput.trim())
      setRenameFolderTarget(null)
      setRenameFolderInput('')
      await fetchFolders()
      notify('Folder renamed')
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function deleteFolder(folderId) {
    if (!window.confirm('Delete this folder?')) return

    setLoading(true)
    try {
      await api.deleteFolder(folderId)
      await Promise.all([fetchCollections(), fetchFolders()])
      notify('Folder deleted')
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function moveCollectionToFolder(collectionId, folderId) {
    try {
      const updated = await api.moveCollectionToFolder(collectionId, folderId)
      setCollections((prev) => prev.map((collection) => (collection.id === updated.id ? updated : collection)))
      notify('Collection moved')
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  useEffect(() => {
    if (!user) {
      setCollections([])
      setFolders([])
      setSelectedCollectionId(null)
      setSessionQueue([])
      setStudyOffset(0)
      setStudyRemaining(0)
      return
    }
    fetchCollections().catch((err) => notify(err.message, 'error'))
    fetchFolders().catch((err) => notify(err.message, 'error'))
  }, [user])

  useEffect(() => {
    if (!user || !selectedCollectionId) {
      return
    }
    loadStudyCards(selectedCollectionId, { reset: true }).catch((err) => notify(err.message, 'error'))
  }, [selectedCollectionId, user])

  useEffect(() => {
    return () => {
      if (statsSyncTimerRef.current) {
        window.clearTimeout(statsSyncTimerRef.current)
      }
    }
  }, [])

  return {
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
    fetchCollections,
    fetchFolders,
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
  }
}
