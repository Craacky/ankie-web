import { useEffect, useMemo, useState } from 'react'
import {
  Moon,
  Sun,
  RotateCcw,
  RefreshCcw,
  Download,
  Trash2,
  Pencil,
  Save,
  Upload
} from 'lucide-react'

import { api } from './api'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'
import { Badge } from './components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './components/ui/dialog'

const MIN_REPEAT_AFTER = 1
const MAX_REPEAT_AFTER = 8

function randomRepeatAfter() {
  return Math.floor(Math.random() * (MAX_REPEAT_AFTER - MIN_REPEAT_AFTER + 1)) + MIN_REPEAT_AFTER
}

function FlipCard({ card, flipped, onFlip }) {
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
  const [mode, setMode] = useState(localStorage.getItem('ankie_theme') || 'light')
  const [collections, setCollections] = useState([])
  const [selectedCollectionId, setSelectedCollectionId] = useState(null)
  const [selectedCollectionDetail, setSelectedCollectionDetail] = useState(null)
  const [nameInput, setNameInput] = useState('')
  const [jsonFile, setJsonFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [snack, setSnack] = useState(null)
  const [sessionQueue, setSessionQueue] = useState([])
  const [flipped, setFlipped] = useState(false)
  const [editCard, setEditCard] = useState(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editAnswer, setEditAnswer] = useState('')

  const selectedCollectionStats = useMemo(
    () => collections.find((c) => c.id === selectedCollectionId) || null,
    [collections, selectedCollectionId]
  )

  const currentCard = sessionQueue[0] || null

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
    fetchCollections().catch((err) => notify(err.message, 'error'))
  }, [])

  useEffect(() => {
    localStorage.setItem('ankie_theme', mode)
    document.documentElement.classList.toggle('dark', mode === 'dark')
  }, [mode])

  useEffect(() => {
    if (!selectedCollectionId) {
      return
    }

    Promise.all([fetchCollectionDetail(selectedCollectionId), loadStudyCards(selectedCollectionId)]).catch((err) =>
      notify(err.message, 'error')
    )
  }, [selectedCollectionId])

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
      await fetchCollections()
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
      await fetchCollections()
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

  async function exportCollection() {
    if (!selectedCollectionId || !selectedCollectionStats) return
    try {
      await api.exportCollection(selectedCollectionId, selectedCollectionStats.name)
      notify('Export is ready')
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">Ankie Web</h1>
          <Button variant="outline" size="icon" onClick={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}>
            {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>
      </header>

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
              <CardTitle className="text-lg">Collections</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[62vh] space-y-2 overflow-y-auto">
              {collections.length === 0 && <p className="text-sm text-muted-foreground">No collections yet</p>}
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  className={`w-full rounded-md border p-3 text-left transition ${
                    collection.id === selectedCollectionId ? 'border-primary bg-primary/10' : 'hover:bg-accent'
                  }`}
                  onClick={() => setSelectedCollectionId(collection.id)}
                >
                  <div className="font-medium">{collection.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Remaining: {collection.remaining_cards} / {collection.total_cards}
                  </div>
                </button>
              ))}
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
                      <FlipCard card={currentCard} flipped={flipped} onFlip={() => setFlipped((v) => !v)} />
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

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Collection cards</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(selectedCollectionDetail?.cards || []).map((card) => (
                    <Card key={card.id} className="border-dashed">
                      <CardContent className="pt-6">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Question</p>
                        <p className="mt-1 whitespace-pre-wrap break-words">{card.question}</p>
                        <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">Answer</p>
                        <p className="mt-1 whitespace-pre-wrap break-words">{card.answer}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Badge variant={card.known ? 'secondary' : 'outline'}>{card.known ? 'Known' : 'Unanswered'}</Badge>
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(card)}><Pencil size={14} /> Edit</Button>
                          <Button variant="destructive" size="sm" onClick={() => removeCard(card.id)}><Trash2 size={14} /> Delete</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {selectedCollectionDetail?.cards?.length === 0 && (
                    <p className="text-sm text-muted-foreground">No cards in this collection</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>

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
