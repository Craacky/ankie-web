import { ChevronDown, ChevronRight, MoreVertical, Pencil, Trash2 } from 'lucide-react'

import { Button } from './ui/button'

function collectionItemClass(collection, selectedCollectionId) {
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

function CollectionItem({
  collection,
  folders,
  collectionMenuOpenId,
  selectedCollectionId,
  onDragStart,
  onSelect,
  onToggleMenu,
  onMove,
  onCloseMenu
}) {
  const isMenuOpen = collectionMenuOpenId === collection.id
  return (
    <div
      key={collection.id}
      draggable
      onDragStart={() => onDragStart(collection.id)}
      className={`relative w-full rounded-md border bg-card/55 p-3 text-left transition ${collectionItemClass(collection, selectedCollectionId)} ${
        isMenuOpen ? 'z-30' : ''
      }`}
      onClick={() => onSelect(collection.id)}
    >
      <div className="pr-9">
        <div className={`font-medium ${collection.is_mastered ? 'text-emerald-700 dark:text-emerald-300' : ''}`}>{collection.name}</div>
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
            onToggleMenu(collection.id)
          }}
        >
          <MoreVertical size={14} />
        </Button>
        {isMenuOpen && (
          <div className="absolute right-0 z-50 mt-1 w-44 rounded-md border bg-card p-1 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <button
              className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => {
                onMove(collection.id, null)
                onCloseMenu()
              }}
            >
              Move to Ungrouped
            </button>
            {folders.map((folder) => (
              <button
                key={`${collection.id}-folder-${folder.id}`}
                className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={() => {
                  onMove(collection.id, folder.id)
                  onCloseMenu()
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

export function CollectionsList({
  className = '',
  collections,
  folders,
  ungroupedCollections,
  collectionsByFolder,
  collapsedFolders,
  draggedCollectionId,
  collectionMenuOpenId,
  selectedCollectionId,
  onDragStart,
  onSelect,
  onToggleMenu,
  onMove,
  onToggleFolderCollapsed,
  onOpenRenameFolderDialog,
  onDeleteFolder
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className="rounded-md border border-dashed bg-card/45 p-2"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => {
          if (draggedCollectionId != null) {
            onMove(draggedCollectionId, null)
          }
        }}
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ungrouped</p>
        <div className="space-y-2">
          {ungroupedCollections.map((collection) => (
            <CollectionItem
              key={collection.id}
              collection={collection}
              folders={folders}
              collectionMenuOpenId={collectionMenuOpenId}
              selectedCollectionId={selectedCollectionId}
              onDragStart={onDragStart}
              onSelect={onSelect}
              onToggleMenu={onToggleMenu}
              onMove={onMove}
              onCloseMenu={() => onToggleMenu(null)}
            />
          ))}
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
                onMove(draggedCollectionId, folder.id)
              }
            }}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                onClick={() => onToggleFolderCollapsed(folder.id)}
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                {folder.name}
                <span className="ml-1 rounded border px-1 py-0 text-[10px]">{folderCollections.length}</span>
              </button>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => onOpenRenameFolderDialog(folder)}>
                  <Pencil size={12} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-destructive"
                  onClick={() => onDeleteFolder(folder)}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
            {!isCollapsed && (
              <div className="space-y-2">
                {folderCollections.map((collection) => (
                  <CollectionItem
                    key={collection.id}
                    collection={collection}
                    folders={folders}
                    collectionMenuOpenId={collectionMenuOpenId}
                    selectedCollectionId={selectedCollectionId}
                    onDragStart={onDragStart}
                    onSelect={onSelect}
                    onToggleMenu={onToggleMenu}
                    onMove={onMove}
                    onCloseMenu={() => onToggleMenu(null)}
                  />
                ))}
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
