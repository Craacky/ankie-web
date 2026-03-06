import { FolderPlus, Save, Upload } from 'lucide-react'

import { Button } from './ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'

export function CollectionDialogs({
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
  nameInput,
  setNameInput,
  jsonFile,
  setJsonFile,
  folderNameInput,
  setFolderNameInput,
  loading,
  handleImport,
  createFolder,
  saveFolderRename,
  saveCardEdit
}) {
  return (
    <>
      <Dialog open={collectionDialogOpen} onOpenChange={setCollectionDialogOpen}>
        <DialogContent className="frosted-surface">
          <DialogHeader>
            <DialogTitle>Add Collection</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleImport}>
            <Input placeholder="Collection name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} disabled={loading} />
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
            <Input placeholder="Folder name" value={folderNameInput} onChange={(e) => setFolderNameInput(e.target.value)} disabled={loading} />
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
            <Button variant="outline" onClick={() => setEditCard(null)}>
              Cancel
            </Button>
            <Button onClick={saveCardEdit}>
              <Save size={15} /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
