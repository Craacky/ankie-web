import { memo } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

const CardActionButtons = memo(function CardActionButtons({ onEdit, onDelete }) {
  return (
    <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-2"
        onClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
      >
        <Pencil size={14} /> Edit
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="h-8 px-2"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <Trash2 size={14} /> Delete
      </Button>
    </div>
  )
})

export const FlipCard = memo(function FlipCard({ card, flipped, onFlip, onEdit, onDelete }) {
  return (
    <div onClick={onFlip} className="w-full max-w-6xl cursor-pointer [perspective:1400px]">
      <div
        className="relative min-h-[440px] w-full [transform-style:preserve-3d] transition-transform duration-500 sm:min-h-[520px]"
        style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        <Card
          className="glass-panel absolute inset-0 overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-transparent"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            opacity: flipped ? 0 : 1,
            visibility: flipped ? 'hidden' : 'visible'
          }}
        >
          <CardActionButtons onEdit={onEdit} onDelete={onDelete} />
          <CardHeader className="pb-2 sm:pb-4">
            <CardDescription>Question</CardDescription>
            <CardTitle className="text-2xl break-words whitespace-pre-wrap sm:text-3xl">
              {card.is_markdown ? (
                <div className="obsidian-preview">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.question}</ReactMarkdown>
                </div>
              ) : (
                card.question
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex h-[240px] flex-col sm:h-[320px]">
            <p className="mt-4 text-sm text-muted-foreground">Click the card to flip</p>
          </CardContent>
        </Card>

        <Card
          className="glass-panel absolute inset-0 overflow-hidden border-2 border-secondary/30 bg-gradient-to-br from-secondary/20 to-transparent"
          style={{
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            opacity: flipped ? 1 : 0,
            visibility: flipped ? 'visible' : 'hidden'
          }}
        >
          <CardActionButtons onEdit={onEdit} onDelete={onDelete} />
          <CardHeader className="pb-2 sm:pb-4">
            <CardDescription>Question</CardDescription>
            <CardTitle className="text-xl break-words whitespace-pre-wrap sm:text-2xl">
              {card.is_markdown ? (
                <div className="obsidian-preview">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.question}</ReactMarkdown>
                </div>
              ) : (
                card.question
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex h-[290px] flex-col sm:h-[390px]">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Answer</div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1 text-lg font-medium whitespace-pre-wrap break-words sm:text-xl">
              {card.is_markdown ? (
                <div className="obsidian-preview">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.answer}</ReactMarkdown>
                </div>
              ) : (
                card.answer
              )}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Choose "Know" or "Don't Know"</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
})
