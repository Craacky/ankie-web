import { FolderPlus, Plus, Upload } from 'lucide-react'

import { Button } from './ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'

export function NotesDialogs({
  noteFileDialogOpen,
  setNoteFileDialogOpen,
  noteFolderDialogOpen,
  setNoteFolderDialogOpen,
  noteUploadDialogOpen,
  setNoteUploadDialogOpen,
  focusedNoteFolderPath,
  noteNameInput,
  setNoteNameInput,
  setNoteUploadFile,
  createNoteFile,
  createNoteFolder,
  uploadNoteFile
}) {
  return (
    <>
      <Dialog open={noteFileDialogOpen} onOpenChange={setNoteFileDialogOpen}>
        <DialogContent className="frosted-surface">
          <DialogHeader>
            <DialogTitle>Create Note File</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={createNoteFile}>
            <p className="text-xs text-muted-foreground">
              Parent: <span className="font-medium">{focusedNoteFolderPath || '/'}</span>
            </p>
            <Input placeholder="File name, e.g. notes.md" value={noteNameInput} onChange={(e) => setNoteNameInput(e.target.value)} />
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
            <Input placeholder="Folder name" value={noteNameInput} onChange={(e) => setNoteNameInput(e.target.value)} />
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
            <Input type="file" onChange={(e) => setNoteUploadFile(e.target.files?.[0] || null)} />
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
    </>
  )
}
