import { ChevronDown, ChevronRight, FileText, FolderOpen, Pencil, Trash2 } from 'lucide-react'

import { Button } from './ui/button'
import { noteParentPath } from '../features/notes/pathUtils'

function NoteNode({
  node,
  depth,
  selectedNotePath,
  focusedNoteFolderPath,
  collapsedNoteFolders,
  mobileNotesTreeOpen,
  onOpenNote,
  onSetFocusedFolder,
  onToggleFolderClick,
  onRename,
  onDelete,
  onCloseMobileTree
}) {
  const isFile = node.type === 'file'
  const isMd = node.path.toLowerCase().endsWith('.md')
  const isSelected = selectedNotePath === node.path
  const isFocusedFolder = !isFile && focusedNoteFolderPath === node.path
  const isCollapsed = !isFile && Boolean(collapsedNoteFolders[node.path])

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
              onOpenNote(node.path)
              onSetFocusedFolder(noteParentPath(node.path))
              if (mobileNotesTreeOpen) onCloseMobileTree()
            } else if (!isFile) {
              onToggleFolderClick(node.path)
            }
          }}
        >
          {!isFile && (isCollapsed ? <ChevronRight size={14} className="shrink-0" /> : <ChevronDown size={14} className="shrink-0" />)}
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
              onRename(node.path, node.name)
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
              onDelete(node.path, node.type)
            }}
            title="Delete"
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </div>
      {!isCollapsed &&
        node.children?.map((child) => (
          <NoteNode
            key={child.path || `child-${child.name}`}
            node={child}
            depth={depth + 1}
            selectedNotePath={selectedNotePath}
            focusedNoteFolderPath={focusedNoteFolderPath}
            collapsedNoteFolders={collapsedNoteFolders}
            mobileNotesTreeOpen={mobileNotesTreeOpen}
            onOpenNote={onOpenNote}
            onSetFocusedFolder={onSetFocusedFolder}
            onToggleFolderClick={onToggleFolderClick}
            onRename={onRename}
            onDelete={onDelete}
            onCloseMobileTree={onCloseMobileTree}
          />
        ))}
    </div>
  )
}

export function NotesTree({
  notesTree,
  selectedNotePath,
  focusedNoteFolderPath,
  collapsedNoteFolders,
  mobileNotesTreeOpen,
  onOpenNote,
  onSetFocusedFolder,
  onToggleFolderClick,
  onRename,
  onDelete,
  onCloseMobileTree
}) {
  if (!notesTree.length) {
    return <p className="text-sm text-muted-foreground">No notes yet</p>
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition ${
          !focusedNoteFolderPath ? 'bg-primary/15 text-primary' : 'hover:bg-accent'
        }`}
        onClick={() => onSetFocusedFolder('')}
        title="Use root folder as default parent"
      >
        <FolderOpen size={14} className="shrink-0" />
        <span className="truncate">/</span>
      </button>
      {notesTree.map((node) => (
        <NoteNode
          key={node.path || `root-${node.name}`}
          node={node}
          depth={0}
          selectedNotePath={selectedNotePath}
          focusedNoteFolderPath={focusedNoteFolderPath}
          collapsedNoteFolders={collapsedNoteFolders}
          mobileNotesTreeOpen={mobileNotesTreeOpen}
          onOpenNote={onOpenNote}
          onSetFocusedFolder={onSetFocusedFolder}
          onToggleFolderClick={onToggleFolderClick}
          onRename={onRename}
          onDelete={onDelete}
          onCloseMobileTree={onCloseMobileTree}
        />
      ))}
    </div>
  )
}
