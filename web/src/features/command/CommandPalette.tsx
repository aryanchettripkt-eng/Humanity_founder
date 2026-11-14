import { Search, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SEGMENTS } from '@/lib/segments';
import { useCommandStore } from '@/stores/command';

export function CommandPalette() {
  const { open, setOpen, openAsk } = useCommandStore();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const filteredSegments = SEGMENTS.filter((s) =>
    s.label.toLowerCase().includes(query.toLowerCase())
  );

  const goSegment = (id: string) => {
    setOpen(false);
    navigate(id === 'today' ? '/app/today' : `/app/inbox/${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg p-4">
        <DialogHeader className="sr-only">
          <DialogTitle>Command palette</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to segment, or ask AI anything…"
            className="pl-9"
          />
        </div>

        <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
          <button
            type="button"
            onClick={() => openAsk(query)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-primary hover:bg-surface"
          >
            <Sparkles className="h-4 w-4" />
            <span>{query ? `Ask AI: "${query}"` : 'Ask AI about your inbox…'}</span>
          </button>

          <div className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Segments
          </div>
          {filteredSegments.map((seg) => {
            const Icon = seg.icon;
            return (
              <button
                key={seg.id}
                type="button"
                onClick={() => goSegment(seg.id)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-surface"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span>{seg.label}</span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

