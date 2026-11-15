import { Flame, Loader2, LogIn, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ChipRowItem } from '@/components/common/ChipRow';
import { AppTopBar } from '@/components/workspace/AppTopBar';
import { WorkspaceGrid } from '@/components/workspace/WorkspaceGrid';
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader';
import { useDemoLogin } from '@/features/auth/useDemoLogin';
import { FeatureStrip } from '@/features/landing/components/FeatureStrip';
import { LandingFooter } from '@/features/landing/components/LandingFooter';
import {
  LANDING_BRIEF,
  LANDING_STATS,
  SAMPLE_TASKS,
  SAMPLE_THREADS,
  SCHEDULE_DATE,
  SCHEDULE_NOW_PERCENT,
  SCHEDULE_NOW_TIME,
  SCHEDULE_SLOTS,
  TASK_EMPTY_COPY,
  THREAD_EMPTY_COPY,
  toLandingFocusPanel,
  toLandingPersonCards,
  toLandingTaskCards,
  type TaskFilterId,
} from '@/features/landing/sampleData';
import { OWNER_META } from '@/lib/owners';
import type { Owner } from '@/types/api';

type OwnerFilter = 'all' | Owner;

const OWNER_CHIPS: ChipRowItem<OwnerFilter>[] = [
  { id: 'all', label: 'All' },
  { id: 'assistant', label: OWNER_META.assistant.label, icon: OWNER_META.assistant.icon },
  { id: 'client', label: OWNER_META.client.label, icon: OWNER_META.client.icon },
  { id: 'none', label: OWNER_META.none.label, icon: OWNER_META.none.icon },
  { id: 'review', label: OWNER_META.review.label, icon: OWNER_META.review.icon },
];

const TASK_CHIPS: ChipRowItem<TaskFilterId>[] = [
  { id: 'all', label: 'All' },
  { id: 'urgent', label: 'Urgent', icon: Flame },
  { id: 'due-today', label: 'Due today' },
  { id: 'waiting', label: 'Waiting on client' },
  { id: 'done', label: 'Done' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Reads every thread, not just subjects',
    body: 'Relay syncs Gmail read-only and separates what you can handle from what only your client can decide.',
  },
  {
    step: '02',
    title: 'Drafts in your client’s voice',
    body: 'For assistant-owned threads, Relay prepares a concise draft with citations and extracted dates.',
  },
  {
    step: '03',
    title: 'Hands off cleanly on /c',
    body: 'Your client sees only the decisions that need them — never the noise, newsletters, or scheduling back-and-forth.',
  },
];

export function LandingPage() {
  const { demoLoading, handleDemo } = useDemoLogin();
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [taskFilter, setTaskFilter] = useState<TaskFilterId>('all');
  const [selectedId, setSelectedId] = useState<string>(SAMPLE_THREADS[0].id);

  const visibleThreads = useMemo(() => {
    if (ownerFilter === 'all') return SAMPLE_THREADS.slice(0, 4);
    return SAMPLE_THREADS.filter((t) => t.owner === ownerFilter);
  }, [ownerFilter]);

  const visibleTasks = useMemo(() => {
    if (taskFilter === 'all') return SAMPLE_TASKS;
    return SAMPLE_TASKS.filter((t) => t.tags.includes(taskFilter));
  }, [taskFilter]);

  const people = useMemo(() => toLandingPersonCards(visibleThreads), [visibleThreads]);
  const tasks = useMemo(() => toLandingTaskCards(visibleTasks), [visibleTasks]);
  const focusModel = useMemo(() => toLandingFocusPanel(selectedId), [selectedId]);

  const threadCountLabel =
    ownerFilter === 'all'
      ? `${visibleThreads.length} of ${SAMPLE_THREADS.length} threads`
      : `${visibleThreads.length} ${visibleThreads.length === 1 ? 'thread' : 'threads'}`;

  const taskCountLabel = `${visibleTasks.length} ${visibleTasks.length === 1 ? 'task' : 'tasks'}`;

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-background p-2 text-foreground antialiased selection:bg-accent-lime selection:text-accent-lime-foreground sm:p-4">
      <div className="mx-auto max-w-[1440px] rounded-[28px] border border-border/60 bg-surface px-4 pb-8 pt-3 shadow-sm sm:rounded-[32px] sm:px-8">
        <AppTopBar
          logoHref="/"
          dateLabel={SCHEDULE_DATE}
          slots={SCHEDULE_SLOTS}
          nowTime={SCHEDULE_NOW_TIME}
          nowPercent={SCHEDULE_NOW_PERCENT}
          actions={
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign in
              </Link>
              <button
                type="button"
                onClick={() => handleDemo('assistant')}
                disabled={demoLoading !== null}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {demoLoading === 'assistant' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {demoLoading === 'assistant' ? 'Opening demo…' : 'Try live demo'}
              </button>
            </div>
          }
        />

        <div className="mt-6 space-y-10">
          <WorkspaceHeader
            eyebrow="AI inbox triage for executive assistants"
            title="WHO NEEDS TO REPLY?"
            primaryLabel={demoLoading === 'assistant' ? 'Opening demo…' : 'Try live demo'}
            primaryDisabled={demoLoading !== null}
            onPrimaryAction={() => handleDemo('assistant')}
            stats={LANDING_STATS}
            briefText={LANDING_BRIEF}
            subtitle="Every email sorted into Assistant, Client, or No reply — with confidence, a one-line reason, and a clean hand-off."
          />

          <WorkspaceGrid
            peopleCountLabel={threadCountLabel}
            peopleChips={OWNER_CHIPS}
            activePeopleChip={ownerFilter}
            onPeopleChipChange={setOwnerFilter}
            people={people}
            emptyPeopleText={THREAD_EMPTY_COPY[ownerFilter]}
            tasksCountLabel={taskCountLabel}
            tasksChips={TASK_CHIPS}
            activeTasksChip={taskFilter}
            onTasksChipChange={setTaskFilter}
            tasks={tasks}
            emptyTasksText={TASK_EMPTY_COPY[taskFilter]}
            selectedId={selectedId}
            onSelectCard={setSelectedId}
            onOpenPerson={() => handleDemo('assistant')}
            onOpenTask={() => handleDemo('assistant')}
            onTaskPrimaryAction={() => handleDemo('assistant')}
            focusModel={focusModel}
            onOpenFocusThread={() => handleDemo('assistant')}
          />

          <section aria-label="How Relay works" className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="rounded-3xl border border-border bg-muted/30 p-5"
              >
                <span className="font-display text-xs font-bold text-muted-foreground">
                  {item.step}
                </span>
                <h3 className="mt-2 font-display text-base font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            ))}
          </section>

          <FeatureStrip />
          <LandingFooter demoLoading={demoLoading} onDemoLogin={handleDemo} />
        </div>
      </div>
    </div>
  );
}
