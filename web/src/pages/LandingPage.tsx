import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, Flame, Inbox, Layers, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDemoLogin } from '@/features/auth/useDemoLogin';
import { FeatureStrip } from '@/features/landing/components/FeatureStrip';
import { FilterChips, type FilterChipItem } from '@/features/landing/components/FilterChips';
import { LandingFooter } from '@/features/landing/components/LandingFooter';
import { LandingHero } from '@/features/landing/components/LandingHero';
import { LandingTopBar } from '@/features/landing/components/LandingTopBar';
import { ReplyCard } from '@/features/landing/components/ReplyCard';
import { SectionHeader } from '@/features/landing/components/SectionHeader';
import { SummaryPanel } from '@/features/landing/components/SummaryPanel';
import { TaskCard } from '@/features/landing/components/TaskCard';
import {
  SAMPLE_TASKS,
  SAMPLE_THREADS,
  TASK_EMPTY_COPY,
  THREAD_EMPTY_COPY,
  type SampleReplyThread,
  type TaskFilterId,
} from '@/features/landing/sampleData';
import { OWNER_META } from '@/lib/owners';
import { cn } from '@/lib/utils';
import type { Owner } from '@/types/api';

type OwnerFilter = 'all' | Owner;

const OWNER_CHIPS: FilterChipItem<OwnerFilter>[] = [
  { id: 'all', label: 'All' },
  { id: 'assistant', label: OWNER_META.assistant.label, icon: OWNER_META.assistant.icon },
  { id: 'client', label: OWNER_META.client.label, icon: OWNER_META.client.icon },
  { id: 'none', label: OWNER_META.none.label, icon: OWNER_META.none.icon },
  { id: 'review', label: OWNER_META.review.label, icon: OWNER_META.review.icon },
];

const TASK_CHIPS: FilterChipItem<TaskFilterId>[] = [
  { id: 'all', label: 'All' },
  { id: 'urgent', label: 'Urgent', icon: Flame },
  { id: 'due-today', label: 'Due today' },
  { id: 'waiting', label: 'Waiting on client' },
  { id: 'done', label: 'Done' },
];

const ANCHOR_ITEMS = [
  { id: 'who-replies', label: 'Who replies', icon: Inbox },
  { id: 'your-day', label: 'Your day', icon: CalendarDays },
  { id: 'summary', label: 'Summary', icon: Sparkles },
  { id: 'features', label: 'Features', icon: Layers },
];

export function LandingPage() {
  const prefersReducedMotion = useReducedMotion();
  const { demoLoading, handleDemo } = useDemoLogin();

  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [taskFilter, setTaskFilter] = useState<TaskFilterId>('all');
  const [selectedThread, setSelectedThread] = useState<SampleReplyThread>(SAMPLE_THREADS[0]);
  const [activeSection, setActiveSection] = useState<string>('who-replies');

  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    if (hadDark) root.classList.remove('dark');
    return () => {
      if (hadDark) root.classList.add('dark');
    };
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const elements = ANCHOR_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: 0.1 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const visibleThreads = useMemo(() => {
    if (ownerFilter === 'all') return SAMPLE_THREADS.slice(0, 4);
    return SAMPLE_THREADS.filter((t) => t.owner === ownerFilter);
  }, [ownerFilter]);

  const visibleTasks = useMemo(() => {
    if (taskFilter === 'all') return SAMPLE_TASKS;
    return SAMPLE_TASKS.filter((t) => t.tags.includes(taskFilter));
  }, [taskFilter]);

  const threadCountLabel =
    ownerFilter === 'all'
      ? `${visibleThreads.length} of ${SAMPLE_THREADS.length} threads`
      : `${visibleThreads.length} ${visibleThreads.length === 1 ? 'thread' : 'threads'}`;

  const taskCountLabel = `${visibleTasks.length} ${visibleTasks.length === 1 ? 'task' : 'tasks'}`;

  return (
    <div className="theme-landing min-h-screen bg-landing-canvas p-2 text-landing-ink antialiased selection:bg-landing-accent selection:text-landing-accent-foreground sm:p-4 md:p-6 lg:p-8">
      <div className="relative mx-auto max-w-[1400px] overflow-x-clip rounded-[28px] border border-landing-card/80 bg-landing-surface p-4 shadow-landing sm:rounded-[32px] sm:p-6 lg:p-8">
        <LandingTopBar demoLoading={demoLoading} onDemoLogin={handleDemo} />

        <main>
          <LandingHero demoLoading={demoLoading} onDemoLogin={handleDemo} />

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[44px_minmax(0,1fr)_340px] xl:gap-6">
            <nav
              aria-label="Landing section navigation"
              className="hidden xl:sticky xl:top-8 xl:flex xl:flex-col xl:gap-3 xl:self-start"
            >
              {ANCHOR_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <a
                        href={`#${item.id}`}
                        aria-label={item.label}
                        aria-current={isActive ? 'true' : undefined}
                        className={cn(
                          'flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink focus-visible:ring-offset-2',
                          isActive
                            ? 'bg-landing-ink text-landing-ink-foreground'
                            : 'border border-landing-line bg-landing-card text-landing-muted hover:text-landing-ink'
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>

            <div className="min-w-0 space-y-10">
              <section id="who-replies" aria-labelledby="who-replies-heading" className="space-y-4">
                <SectionHeader
                  id="who-replies-heading"
                  title="Who needs to reply"
                  countLabel={threadCountLabel}
                  liveText={`Showing ${visibleThreads.length} ${visibleThreads.length === 1 ? 'thread' : 'threads'}`}
                />
                <FilterChips items={OWNER_CHIPS} value={ownerFilter} onChange={setOwnerFilter} />

                <AnimatePresence mode="wait">
                  {visibleThreads.length === 0 ? (
                    <motion.p
                      key={`empty-${ownerFilter}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-[24px] border border-landing-line bg-landing-card/75 px-5 py-6 text-sm text-landing-muted"
                    >
                      {THREAD_EMPTY_COPY[ownerFilter]}
                    </motion.p>
                  ) : (
                    <motion.div
                      key={ownerFilter}
                      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                      className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4"
                    >
                      {visibleThreads.map((thread, index) => (
                        <motion.div
                          key={thread.id}
                          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.25,
                            delay: prefersReducedMotion ? 0 : index * 0.06,
                            ease: [0.2, 0.8, 0.2, 1],
                          }}
                          className="flex w-[82%] shrink-0 snap-start md:w-auto"
                        >
                          <ReplyCard
                            thread={thread}
                            selected={selectedThread.id === thread.id}
                            onSelect={setSelectedThread}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              <section id="your-day" aria-labelledby="your-day-heading" className="space-y-4">
                <SectionHeader
                  id="your-day-heading"
                  title="Your day"
                  countLabel={taskCountLabel}
                  liveText={`Showing ${visibleTasks.length} ${visibleTasks.length === 1 ? 'task' : 'tasks'}`}
                />
                <FilterChips items={TASK_CHIPS} value={taskFilter} onChange={setTaskFilter} />

                <AnimatePresence mode="wait">
                  {visibleTasks.length === 0 ? (
                    <motion.p
                      key={`empty-${taskFilter}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-[24px] border border-landing-line bg-landing-card px-5 py-6 text-sm text-landing-muted"
                    >
                      {TASK_EMPTY_COPY[taskFilter]}
                    </motion.p>
                  ) : (
                    <motion.div
                      key={taskFilter}
                      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                      className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0"
                    >
                      {visibleTasks.map((task, index) => (
                        <motion.div
                          key={task.id}
                          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                          transition={{
                            duration: 0.25,
                            delay: prefersReducedMotion ? 0 : index * 0.06,
                            ease: [0.2, 0.8, 0.2, 1],
                          }}
                          className="flex w-[82%] shrink-0 snap-start md:w-auto"
                        >
                          <TaskCard task={task} onTryDemo={() => handleDemo('assistant')} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            </div>

            <div className="xl:pt-1">
              <SummaryPanel thread={selectedThread} onTryDemo={handleDemo} />
            </div>
          </div>

          <FeatureStrip />
        </main>

        <LandingFooter demoLoading={demoLoading} onDemoLogin={handleDemo} />
      </div>
    </div>
  );
}
