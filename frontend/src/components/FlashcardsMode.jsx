import { Download, FolderPlus, RefreshCcw, RotateCcw, Trash2, Upload } from 'lucide-react'

import { CollectionsList } from './CollectionsList'
import { FlipCard } from './FlipCard'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

export function FlashcardsMode({
  setCollectionDialogOpen,
  setFolderDialogOpen,
  collectionsListProps,
  selectedCollectionStats,
  reloadSession,
  resetProgress,
  exportCollection,
  removeCollection,
  currentCard,
  flipped,
  setFlipped,
  openEditDialog,
  removeCard,
  markCurrentCard
}) {
  return (
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
            <CollectionsList {...collectionsListProps} />
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
                {selectedCollectionStats.is_mastered ? <Badge variant="secondary">Collection mastered</Badge> : <Badge variant="outline">In progress</Badge>}
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
                      <Button
                        variant="outline"
                        className="w-full border-amber-500 text-amber-600 hover:bg-amber-50 sm:w-auto"
                        onClick={() => markCurrentCard(false)}
                      >
                        Don't Know
                      </Button>
                      <Button className="w-full sm:w-auto" variant="secondary" onClick={() => markCurrentCard(true)}>
                        Know
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </>
  )
}
