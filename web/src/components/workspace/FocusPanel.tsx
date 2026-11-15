import { ArrowUpRight, Calendar, Clock, Sparkles, UserCheck } from 'lucide-react';
import { ConfidenceMeter } from '@/components/common/ConfidenceMeter';
import type { FocusPanelModel } from '@/components/workspace/models';
import { OWNER_META } from '@/lib/owners';
import { cn } from '@/lib/utils';

export type FocusPanelProps = {
  model: FocusPanelModel | null;
  onOpenThread?: (id: string) => void;
  onChangeOwner?: (id: string) => void;
  onAddDate?: (dateId: string, title: string, dateLabel: string) => void;
  className?: string;
};

function PhonePreview({ preview }: { preview: FocusPanelModel['phonePreview'] }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            preview.isClientQueue
              ? 'bg-accent text-accent-foreground'
              : 'bg-zinc-800 text-zinc-200'
          )}
        >
          {preview.badge}
        </span>
        {preview.lastAction ? (
          <span className="truncate text-[10px] text-zinc-400">{preview.lastAction}</span>
        ) : null}
      </div>
      <p className="mt-2.5 line-clamp-2 font-display text-sm font-semibold text-white">
        {preview.headline}
      </p>
      <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{preview.subline}</p>
    </div>
  );
}

function TimelineList({ items }: { items: FocusPanelModel['timeline'] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
        Activity
      </p>
      <div className="space-y-2 border-l border-zinc-800 pl-3">
        {items.map((entry, idx) => (
          <div key={`${entry.time}-${idx}`} className="relative flex items-baseline gap-2">
            <span className="absolute -left-[15px] top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="shrink-0 font-mono text-[10px] text-zinc-400">{entry.time}</span>
            <span className="truncate text-xs text-zinc-200">{entry.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KeyPointsCard({
  subject,
  sender,
  keyPoints,
}: {
  subject: string;
  sender: string;
  keyPoints: string[];
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
          <Sparkles className="h-3.5 w-3.5" />
          Key points
        </span>
        <span className="truncate text-[11px] text-zinc-400">{sender}</span>
      </div>
      <p className="mt-1.5 truncate text-xs font-semibold text-white">{subject}</p>
      <ul className="mt-2 space-y-1.5">
        {keyPoints.slice(0, 3).map((point, idx) => (
          <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-zinc-300">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WhyCard({
  model,
  onChangeOwner,
}: {
  model: FocusPanelModel;
  onChangeOwner?: (id: string) => void;
}) {
  const meta = OWNER_META[model.owner];
  const OwnerIcon = meta.icon;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
          <OwnerIcon className="h-3.5 w-3.5 text-accent" />
          {model.ownerLabel}
        </span>
        <ConfidenceMeter value={model.confidence} />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-zinc-300">{model.reason}</p>
      {onChangeOwner ? (
        <button
          type="button"
          onClick={() => onChangeOwner(model.id)}
          className="mt-2.5 inline-flex items-center gap-1 rounded-full border border-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
        >
          <UserCheck className="h-3 w-3" />
          Change owner
        </button>
      ) : null}
    </div>
  );
}

function DatesCard({
  dates,
  onAddDate,
}: {
  dates: NonNullable<FocusPanelModel['dates']>;
  onAddDate?: (dateId: string, title: string, dateLabel: string) => void;
}) {
  if (dates.length === 0) return null;
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3.5">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        <Calendar className="h-3.5 w-3.5" />
        Extracted dates
      </p>
      <div className="mt-2 space-y-2">
        {dates.slice(0, 2).map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white">{d.title}</p>
              <p className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                <Clock className="h-3 w-3" />
                {d.dateLabel}
              </p>
            </div>
            {onAddDate ? (
              <button
                type="button"
                onClick={() => onAddDate(d.id, d.title, d.dateLabel)}
                className="shrink-0 rounded-full bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
              >
                Add
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FocusPanel({
  model,
  onOpenThread,
  onChangeOwner,
  onAddDate,
  className,
}: FocusPanelProps) {
  if (!model) {
    return (
      <aside
        className={cn(
          'rounded-[28px] border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 shadow-lg',
          className
        )}
      >
        <p className="font-display text-lg font-bold text-white">Focus</p>
        <p className="mt-2 text-xs text-zinc-400">
          Select any email or task card to inspect who needs to reply, key points, and Priya&apos;s queue preview.
        </p>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        'rounded-[28px] border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 shadow-xl',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Client live view
          </p>
          <h2 className="font-display text-xl font-bold tracking-tight text-white">Summary</h2>
        </div>
        {onOpenThread ? (
          <button
            type="button"
            onClick={() => onOpenThread(model.id)}
            aria-label="Open selected thread"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-white transition-colors hover:bg-zinc-800"
          >
            <ArrowUpRight className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        <PhonePreview preview={model.phonePreview} />
        <TimelineList items={model.timeline} />
        <KeyPointsCard
          subject={model.subject}
          sender={model.sender}
          keyPoints={model.keyPoints}
        />
        <WhyCard model={model} onChangeOwner={onChangeOwner} />
        {model.dates && model.dates.length > 0 ? (
          <DatesCard dates={model.dates} onAddDate={onAddDate} />
        ) : null}
      </div>
    </aside>
  );
}

