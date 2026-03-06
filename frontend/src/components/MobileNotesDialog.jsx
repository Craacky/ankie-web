import { FolderPlus, Plus, Upload } from 'lucide-react'

import { NotesTree } from './NotesTree'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'

export function MobileNotesDialog({
  open,
  onOpenChange,
  onClearFocus,
  onOpenFileDialog,
  onOpenFolderDialog,
  onOpenUploadDialog,
  treeProps
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="frosted-surface flex h-[88vh] w-[96vw] max-w-none flex-col sm:max-w-xl lg:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>Notes</DialogTitle>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={onClearFocus} title="Clear focus">
                Clear focus
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 px-2" onClick={onOpenFileDialog} title="Create file">
                <Plus size={14} />
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 px-2" onClick={onOpenFolderDialog} title="Create folder">
                <FolderPlus size={14} />
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 px-2" onClick={onOpenUploadDialog} title="Upload file">
                <Upload size={14} />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
          <NotesTree {...treeProps} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
