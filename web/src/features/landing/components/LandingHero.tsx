import { Plus } from 'lucide-react';
import { StatWithBadge } from '@/components/common/StatWithBadge';
import { HERO_STATS } from '@/features/landing/sampleData';

type LandingHeroProps = {
  demoLoading: 'assistant' | 'client' | null;
  onDemoLogin: (role: 'assistant' | 'client') => void;
};

export function LandingHero({ demoLoading, onDemoLogin }: LandingHeroProps) {
  return (
    <section aria-labelledby="hero-heading" className="pb-8 pt-2">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <h1
              id="hero-heading"
              className="text-[40px] font-extrabold uppercase leading-[0.95] tracking-tight text-foreground sm:text-[52px] lg:text-[64px]"
            >
              WHO REPLIES?
            </h1>
            <button
              type="button"
              disabled={demoLoading !== null}
              onClick={() => onDemoLogin('assistant')}
              className="inline-flex h-11 items-center gap-2.5 rounded-full bg-primary pl-1.5 pr-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-surface text-accent-lime">
                <Plus className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>{demoLoading === 'assistant' ? 'Opening demo…' : 'Try the live demo'}</span>
            </button>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Relay reads your client&apos;s inbox and tells you, in seconds, which emails are yours,
            which need your client, and which need nobody.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-8">
          {HERO_STATS.map((stat) => (
            <StatWithBadge
              key={stat.id}
              value={stat.value}
              label={stat.label}
              badge={stat.delta}
              badgeTone={stat.direction}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
