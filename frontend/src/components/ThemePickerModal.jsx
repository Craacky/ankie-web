import { Check } from 'lucide-react'

import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

export function ThemePickerModal({ open, onClose, lightThemes, darkThemes, themeKey, onSelectTheme }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <Card className="frosted-surface w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle>Choose Theme</CardTitle>
          <CardDescription>Pick one of the popular themes. Your choice is saved automatically.</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[70vh] overflow-y-auto px-3 pb-3">
          <div className="space-y-4 rounded-xl border border-border/50 bg-background/25 p-3">
            <div>
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Light Themes</p>
              <div className="space-y-2">
                {lightThemes.map((theme) => {
                  const selected = themeKey === theme.key
                  return (
                    <button
                      key={theme.key}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                        selected ? 'border-primary bg-primary/15' : 'hover:bg-accent'
                      }`}
                      onClick={() => onSelectTheme(theme.key)}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex items-center rounded-full border px-2 py-1">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.swatches[0] }} />
                          <span className="ml-1.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.swatches[1] }} />
                          <span className="ml-1.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.swatches[2] }} />
                        </span>
                        <span className="truncate">{theme.label}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-12 rounded border px-1.5 py-0.5 text-center text-[10px] uppercase text-muted-foreground">Light</span>
                        {selected && <Check size={14} />}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dark Themes</p>
              <div className="space-y-2">
                {darkThemes.map((theme) => {
                  const selected = themeKey === theme.key
                  return (
                    <button
                      key={theme.key}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                        selected ? 'border-primary bg-primary/15' : 'hover:bg-accent'
                      }`}
                      onClick={() => onSelectTheme(theme.key)}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex items-center rounded-full border px-2 py-1">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.swatches[0] }} />
                          <span className="ml-1.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.swatches[1] }} />
                          <span className="ml-1.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.swatches[2] }} />
                        </span>
                        <span className="truncate">{theme.label}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-12 rounded border px-1.5 py-0.5 text-center text-[10px] uppercase text-muted-foreground">Dark</span>
                        {selected && <Check size={14} />}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
