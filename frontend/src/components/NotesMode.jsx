import { Code2, Eye, FolderPlus, Plus, RefreshCcw, Save, Upload } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

import { api } from '../api'
import { resolveRelativeNotePath, splitHrefAndHash } from '../features/notes/pathUtils'
import { NotesTree } from './NotesTree'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

export function NotesMode({
  setFocusedNoteFolderPath,
  setNoteFileDialogOpen,
  setNoteFolderDialogOpen,
  setNoteUploadDialogOpen,
  notesLoading,
  notesTreeProps,
  selectedNoteName,
  selectedNotePath,
  noteViewMode,
  setNoteViewMode,
  fetchNotesTree,
  saveNote,
  noteHasUnsavedChanges,
  noteContent,
  setNoteContent,
  setPendingAnchor,
  openNote
}) {
  return (
    <>
      <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block">
        <Card className="glass-panel lg:h-[calc(100vh-7.5rem)]">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg">Notes</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => setFocusedNoteFolderPath('')}
                  title="Clear focus"
                >
                  Clear focus
                </Button>
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
            {notesLoading ? <p className="text-sm text-muted-foreground">Loading notes...</p> : <NotesTree {...notesTreeProps} />}
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
                  rehypePlugins={[rehypeSlug]}
                  components={{
                    img: ({ src, alt }) => {
                      const { hrefPath } = splitHrefAndHash(String(src || ''))
                      const resolved = resolveRelativeNotePath(selectedNotePath, hrefPath)
                      return <img src={api.noteRawUrl(resolved)} alt={alt || ''} loading="lazy" />
                    },
                    a: ({ href, children }) => {
                      const raw = String(href || '')
                      if (raw.startsWith('#')) {
                        return (
                          <button
                            type="button"
                            className="text-primary underline"
                            onClick={() => {
                              setPendingAnchor(raw.slice(1))
                              setNoteViewMode('preview')
                            }}
                          >
                            {children}
                          </button>
                        )
                      }
                      const { hrefPath, hash } = splitHrefAndHash(raw)
                      const resolved = resolveRelativeNotePath(selectedNotePath, hrefPath)
                      if (resolved.toLowerCase().endsWith('.md')) {
                        return (
                          <button
                            type="button"
                            className="text-primary underline"
                            onClick={async () => {
                              await openNote(resolved)
                              setNoteViewMode('preview')
                              if (hash) {
                                setPendingAnchor(hash)
                              }
                            }}
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
  )
}
