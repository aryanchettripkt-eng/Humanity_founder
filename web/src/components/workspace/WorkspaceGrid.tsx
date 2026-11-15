import { useState } from 'react';
import { ArrowRight, Inbox, PanelRightOpen, X } from 'lucide-react';
import { ChipRow, type ChipRowItem } from '@/components/common/ChipRow';
import { EmptyState } from '@/components/common/EmptyState';
import { NotchedCard } from '@/components/common/NotchedCard';
import { SectionHeader } from '@/components/common/SectionHeader';
import { FocusPanel } from '@/components/workspace/FocusPanel';
import { PersonCard } from '@/components/workspace/PersonCard';
import { TaskCard } from '@/components/workspace/TaskCard';
import type {
  FocusPanelModel,
  PersonCardModel,
  TaskCardModel,
} from '@/components/workspace/models';
import type { Owner } from '@/types/api';

export type WorkspaceGridProps<
  TPersonChip extends string = string,
  TTaskChip extends string = string,
> = {
  peopleTitle?: string;
  peopleCountLabel: string;
  peopleChips: ChipRowItem<TPersonChip>[];
  activePeopleChip: TPersonChip;
  onPeopleChipChange: (chip: TPersonChip) => void;
  people: PersonCardModel[];
  emptyPeopleText?: string;
  viewAllHref?: string;
  onViewAll?: () => void;

  tasksTitle?: string;
  tasksCountLabel: string;
  tasksChips: ChipRowItem<TTaskChip>[];
  activeTasksChip: TTaskChip;
  onTasksChipChange: (chip: TTaskChip) => void;
  tasks: TaskCardModel[];
  emptyTasksText?: string;

  selectedId: string | null;
  onSelectCard: (id: string) => void;
  onOpenPerson?: (item: PersonCardModel) => void;
  onQuickAssign?: (id: string, owner: Exclude<Owner, 'review'>) => void;
  assigningId?: string | null;
  assigningOwner?: Owner | null;

  onOpenTask?: (item: TaskCardModel) => void;
  onTaskPrimaryAction?: (item: TaskCardModel) => void;
  onTaskStatusChange?: (item: TaskCardModel, statusId: string) => void;

  focusModel: FocusPanelModel | null;
  onOpenFocusThread?: (id: string) => void;
  onChangeOwner?: (id: string) => void;
  onAddDate?: (dateId: string, title: string, dateLabel: string) => void;
};

export function WorkspaceGrid<
  TPersonChip extends string = string,
  TTaskChip extends string = string,
>({
  peopleTitle = 'Who needs to reply',
  peopleCountLabel,
  peopleChips,
  activePeopleChip,
  onPeopleChipChange,
  people,
  emptyPeopleText = 'Inbox is clear.',
  onViewAll,
  tasksTitle = 'Your day',
  tasksCountLabel,
  tasksChips,
  activeTasksChip,
  onTasksChipChange,
  tasks,
  emptyTasksText = 'Nothing scheduled for today.',
  selectedId,
  onSelectCard,
  onOpenPerson,
  onQuickAssign,
  assigningId,
  assigningOwner,
  onOpenTask,
  onTaskPrimaryAction,
  onTaskStatusChange,
  focusModel,
  onOpenFocusThread,
  onChangeOwner,
  onAddDate,
}: WorkspaceGridProps<TPersonChip, TTaskChip>) {
  const [mobileFocusOpen, setMobileFocusOpen] = useState(false);

  return (
    <div className="relative grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-8">
        <section aria-label={peopleTitle} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeader id="who-replies" title={peopleTitle} countLabel={peopleCountLabel} />
            <ChipRow
              items={peopleChips}
              value={activePeopleChip}
              onChange={onPeopleChipChange}
            />
          </div>

          {people.length === 0 ? (
            <EmptyState icon={Inbox} title={emptyPeopleText} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {people.map((person) => (
                <PersonCard
                  key={person.id}
                  item={person}
                  selected={selectedId === person.id}
                  onSelect={onSelectCard}
                  onOpen={onOpenPerson}
                  onQuickAssign={onQuickAssign}
                  assigningOwner={assigningId === person.id ? assigningOwner ?? null : null}
                />
              ))}

              {onViewAll ? (
                <NotchedCard
                  tone="soft"
                  className="flex min-h-[168px] flex-col justify-between p-4"
                >
                  <p className="font-display text-base font-bold text-foreground">
                    More conversations in Inbox
                  </p>
                  <button
                    type="button"
                    onClick={onViewAll}
                    className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    View all in Inbox
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </NotchedCard>
              ) : null}
            </div>
          )}
        </section>

        <section aria-label={tasksTitle} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeader id="your-day" title={tasksTitle} countLabel={tasksCountLabel} />
            <ChipRow items={tasksChips} value={activeTasksChip} onChange={onTasksChipChange} />
          </div>

          {tasks.length === 0 ? (
            <EmptyState icon={Inbox} title={emptyTasksText} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  item={task}
                  selected={selectedId === task.id}
                  onSelect={onSelectCard}
                  onOpen={onOpenTask}
                  onPrimaryAction={onTaskPrimaryAction}
                  onStatusChange={onTaskStatusChange}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Desktop sticky focus panel (>=1280px) and tablet docked (>=768px) */}
      <div className="hidden md:block">
        <div className="xl:sticky xl:top-6">
          <FocusPanel
            model={focusModel}
            onOpenThread={onOpenFocusThread}
            onChangeOwner={onChangeOwner}
            onAddDate={onAddDate}
          />
        </div>
      </div>

      {/* Mobile focus trigger & sheet (<768px) */}
      {focusModel ? (
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setMobileFocusOpen(true)}
            className="inline-flex min-h-[44px] w-full items-center justify-between rounded-2xl bg-zinc-950 px-4 py-3 text-left text-white shadow-md"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              <PanelRightOpen className="h-4 w-4 text-accent" />
              Summary: {focusModel.sender}
            </span>
            <span className="text-xs text-zinc-400">Open</span>
          </button>

          {mobileFocusOpen ? (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Thread summary"
              className="fixed inset-0 z-50 flex items-end bg-black/50 p-3"
              onClick={() => setMobileFocusOpen(false)}
            >
              <div
                className="max-h-[85vh] w-full overflow-y-auto rounded-[28px]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMobileFocusOpen(false)}
                    aria-label="Close summary"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <FocusPanel
                  model={focusModel}
                  onOpenThread={onOpenFocusThread}
                  onChangeOwner={onChangeOwner}
                  onAddDate={onAddDate}
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
