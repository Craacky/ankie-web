import { FolderPlus, Upload } from 'lucide-react'

import { CollectionsList } from './CollectionsList'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'

export function MobileCollectionsDialog({
  open,
  onOpenChange,
  onOpenCollectionDialog,
  onOpenFolderDialog,
  listProps
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="frosted-surface flex h-[88vh] w-[96vw] max-w-none flex-col sm:max-w-xl lg:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>Folders & Collections</DialogTitle>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="h-8 px-2" onClick={onOpenCollectionDialog} title="Add collection">
                <Upload size={14} />
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 px-2" onClick={onOpenFolderDialog} title="Add folder">
                <FolderPlus size={14} />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
          <CollectionsList {...listProps} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
