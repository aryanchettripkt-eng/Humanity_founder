import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, Flame, Inbox, Layers, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { demoLoginApi } from '@/features/auth/api';
import { FeatureStrip } from '@/features/landing/components/FeatureStrip';
import { FilterChips, type FilterChipItem } from '@/features/landing/components/FilterChips';
import { LandingFooter } from '@/features/landing/components/LandingFooter';
import { LandingHero } from '@/features/landing/components/LandingHero';
import { LandingTopBar } from '@/features/landing/components/LandingTopBar';
import { ReplyCard } from '@/features/landing/components/ReplyCard';
import { SummaryPanel } from '@/features/landing/components/SummaryPanel';
import { TaskCard } from '@/features/landing/components/TaskCard';
import {
  SAMPLE_TASKS,
  SAMPLE_THREADS,
  type SampleReplyThread,
  type TaskFilterId,
} from '@/features/landing/sampleData';
import { ApiError } from '@/lib/api';
import { OWNER_META } from '@/lib/owners';
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
  { id: 'who-replies', label: 'Who replies', icon: Inbox, active: true },
  { id: 'your-day', label: 'Your day', icon: CalendarDays, active: false },
  { id: 'summary', label: 'Summary', icon: Sparkles, active: false },
  { id: 'features', label: 'Features', icon: Layers, active: false },
];

export function LandingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prefersReducedMotion = useReducedMotion();

  const [demoLoading, setDemoLoading] = useState<'assistant' | 'client' | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [taskFilter, setTaskFilter] = useState<TaskFilterId>('all');
  const [selectedThread, setSelectedThread] = useState<SampleReplyThread>(SAMPLE_THREADS[0]);

  const handleDemo = async (role: 'assistant' | 'client') => {
    setDemoLoading(role);
    try {
      await demoLoginApi(role);
      queryClient.clear();
      navigate(role === 'client' ? '/c' : '/app/today', { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Demo login failed');
    } finally {
      setDemoLoading(null);
    }
  };

  const visibleThreads = useMemo(() => {
    if (ownerFilter === 'all') return SAMPLE_THREADS.slice(0, 4);
    return SAMPLE_THREADS.filter((t) => t.owner === ownerFilter);
  }, [ownerFilter]);

  const visibleTasks = useMemo(() => {
    if (taskFilter === 'all') return SAMPLE_TASKS;
    return SAMPLE_TASKS.filter((t) => t.tags.includes(taskFilter));
  }, [taskFilter]);

  return (
    <div className="theme-landing min-h-screen bg-landing-canvas p-2 text-landing-ink antialiased selection:bg-landing-accent selection:text-landing-accent-foreground sm:p-4 md:p-6 lg:p-8">
      <div className="relative mx-auto max-w-[1400px] overflow-x-clip rounded-[28px] border border-white/80 bg-landing-surface p-4 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.12)] sm:rounded-[32px] sm:p-6 lg:p-8">
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
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <a
                        href={`#${item.id}`}
                        aria-label={item.label}
                        className={
                          item.active
                            ? 'flex h-11 w-11 items-center justify-center rounded-full bg-landing-ink text-landing-ink-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink focus-visible:ring-offset-2'
                            : 'flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink focus-visible:ring-offset-2'
                        }
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
                <div className="flex flex-wrap items-baseline gap-3">
                  <h2
                    id="who-replies-heading"
                    className="text-xl font-normal tracking-tight text-landing-ink sm:text-2xl"
                  >
                    Who needs to reply
                  </h2>
                  <span className="border-b-2 border-landing-ink pb-0.5 text-sm font-medium text-landing-ink tabular-nums">
                    7 threads
                  </span>
                </div>

                <FilterChips items={OWNER_CHIPS} value={ownerFilter} onChange={setOwnerFilter} />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={ownerFilter}
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                    className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4"
                  >
                    {visibleThreads.map((thread, index) => (
                      <motion.div
                        key={thread.id}
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{
                          duration: 0.25,
                          delay: prefersReducedMotion ? 0 : index * 0.06,
                          ease: [0.2, 0.8, 0.2, 1],
                        }}
                        className="flex"
                      >
                        <ReplyCard
                          thread={thread}
                          selected={selectedThread.id === thread.id}
                          onSelect={setSelectedThread}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </section>

              <section id="your-day" aria-labelledby="your-day-heading" className="space-y-4">
                <div className="flex flex-wrap items-baseline gap-3">
                  <h2
                    id="your-day-heading"
                    className="text-xl font-normal tracking-tight text-landing-ink sm:text-2xl"
                  >
                    Your day
                  </h2>
                  <span className="border-b-2 border-landing-ink pb-0.5 text-sm font-medium text-landing-ink tabular-nums">
                    16 tasks
                  </span>
                </div>

                <FilterChips items={TASK_CHIPS} value={taskFilter} onChange={setTaskFilter} />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={taskFilter}
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
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
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{
                          duration: 0.25,
                          delay: prefersReducedMotion ? 0 : index * 0.06,
                          ease: [0.2, 0.8, 0.2, 1],
                        }}
                        className="flex"
                      >
                        <TaskCard task={task} onTryDemo={() => handleDemo('assistant')} />
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </section>
            </div>

            <div className="xl:pt-1">
              <SummaryPanel
                thread={selectedThread}
                onTryClientDemo={() => handleDemo('client')}
              />
            </div>
          </div>

          <FeatureStrip />
        </main>

        <LandingFooter demoLoading={demoLoading} onDemoLogin={handleDemo} />
      </div>
    </div>
  );
}

