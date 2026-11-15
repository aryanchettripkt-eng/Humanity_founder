import {
  ArrowRight,
  CalendarPlus,
  Crown,
  Inbox,
  Mail,
  MessageSquareQuote,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AssistantTopNav } from '@/components/grove/AssistantTopNav';
import { HeroBand } from '@/components/grove/HeroBand';
import { OwnerPill } from '@/components/common/OwnerPill';
import { useMe } from '@/features/auth/api';
import { getOwnerShortLabel, OWNER_META, OWNER_ORDER } from '@/lib/owners';
import { useUiStore } from '@/stores/ui';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="glass-card min-w-0 rounded-[20px] p-5 sm:p-6">
      <h2 className="mb-4 font-display text-[22px] font-semibold leading-tight text-[var(--fg)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['j', 'k'], label: 'Next and previous email' },
  { keys: ['o'], label: 'Change who it’s for' },
  { keys: ['r'], label: 'Reply' },
  { keys: ['s'], label: 'Star' },
  { keys: ['u'], label: 'Read or unread' },
  { keys: ['d'], label: 'Done' },
  { keys: ['e'], label: 'Archive' },
  { keys: ['⌘', 'K'], label: 'Search or ask AI' },
];

/** About (/app/about): what Relay is, how it works, and what is and isn't live yet. */
export function AboutPage() {
  const { data: me } = useMe();
  const activeClientId = useUiStore((s) => s.activeClientId) || undefined;
  const activeClient = me?.clients?.find((c) => c.id === activeClientId) ?? me?.clients?.[0];
  const client = activeClient?.name.split(' ')[0] || 'your client';

  const steps: { icon: typeof Mail; title: string; body: string }[] = [
    {
      icon: Mail,
      title: 'Connect an inbox',
      body: 'Relay reads your client’s email. Gmail sync is read-only for now (beta).',
    },
    {
      icon: Sparkles,
      title: 'The AI sorts each email',
      body: 'Every email gets an owner, a one-line reason and a confidence score. When the AI isn’t sure, it goes to Needs your call.',
    },
    {
      icon: UserRoundCheck,
      title: 'You handle yours',
      body: 'Draft with AI, edit, and save the reply. Correct a sort once and Relay can remember the sender or domain.',
    },
    {
      icon: Crown,
      title: `${client[0].toUpperCase()}${client.slice(1)} handles theirs`,
      body: `Emails for ${client} wait in their own queue. They can say they’re on it, mark it handled, hand it back, or leave you a note. A note can become a draft.`,
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <HeroBand
        size="short"
        nav={<AssistantTopNav />}
        left={
          <div className="space-y-1">
            <h1
              style={{ textShadow: 'var(--hero-text-shadow)' }}
              className="font-display text-[36px] font-semibold leading-[1.05] tracking-tight text-[var(--fg)] md:text-[48px]"
            >
              About Relay
            </h1>
            <p className="max-w-[60ch] text-base text-[var(--fg-muted)] md:text-lg">
              Every email answers one question: who needs to reply? You, {client}, or nobody.
            </p>
          </div>
        }
      />

      <div className="mx-[clamp(16px,2.5vw,32px)] mb-[clamp(16px,2.5vw,32px)] flex min-h-0 flex-1 flex-col">
        <div
          data-stagger=""
          className="working-panel grove-scroll min-h-0 flex-1 space-y-4 overflow-y-auto"
        >
          <Section title="How it works">
            <ol className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s.title} className="glass flex flex-col gap-3 rounded-[20px] p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--chip-bg)] text-[var(--chip-fg)]">
                      <s.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-[var(--fg-subtle)]">
                      Step {i + 1}
                    </span>
                  </div>
                  <h3 className="font-display text-[18px] font-semibold leading-snug text-[var(--fg)]">
                    {s.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-[var(--fg-muted)]">{s.body}</p>
                </li>
              ))}
            </ol>
          </Section>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Section title="The four owners">
              <ul className="space-y-3">
                {OWNER_ORDER.map((o) => (
                  <li key={o} className="flex items-start gap-3">
                    <OwnerPill
                      owner={o}
                      label={activeClient ? getOwnerShortLabel(o, client) : undefined}
                      className="shrink-0"
                    />
                    <span className="pt-0.5 text-[15px] text-[var(--fg-muted)]">
                      {OWNER_META[o].description}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Inbox shortcuts">
              <ul className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
                {SHORTCUTS.map((s) => (
                  <li key={s.label} className="flex items-center justify-between gap-3">
                    <span className="text-[15px] text-[var(--fg-muted)]">{s.label}</span>
                    <span className="flex shrink-0 gap-1">
                      {s.keys.map((k) => (
                        <kbd
                          key={k}
                          className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-lg border border-[var(--pane-border)] bg-[var(--card-glass-bg)] px-1.5 font-sans text-xs font-semibold text-[var(--fg)]"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <Section title="What works today">
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                {
                  icon: Inbox,
                  title: 'Gmail is read-only (beta)',
                  body: 'Relay reads and sorts your email. It doesn’t change anything in Gmail.',
                },
                {
                  icon: Mail,
                  title: 'Replies are saved, not emailed',
                  body: 'Save reply keeps your reply in Relay. Copy it into your mail app to send it.',
                },
                {
                  icon: Crown,
                  title: `Relay doesn’t notify ${client}`,
                  body: `Emails wait in ${client}’s queue until they open Relay.`,
                },
                {
                  icon: CalendarPlus,
                  title: 'Add to calendar downloads a file',
                  body: 'You get an .ics file to open in your calendar app.',
                },
                {
                  icon: MessageSquareQuote,
                  title: 'Notes become drafts',
                  body: `When ${client} leaves a note, you can turn it into a reply draft.`,
                },
              ].map((f) => (
                <li key={f.title} className="flex items-start gap-3">
                  <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--fg-muted)]" aria-hidden="true" />
                  <span>
                    <span className="block text-[15px] font-semibold text-[var(--fg)]">{f.title}</span>
                    <span className="block text-[15px] text-[var(--fg-muted)]">{f.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/app/inbox/inbox"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--cta-lime-bg)] px-5 text-base font-semibold text-[var(--cta-lime-fg)] transition-colors hover:bg-[var(--cta-lime-hover)]"
            >
              Open Inbox
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/app/stats"
              className="inline-flex min-h-[44px] items-center rounded-full border-[1.5px] border-[var(--btn-outline-border)] px-5 text-base font-semibold text-[var(--btn-outline-fg)] transition-colors hover:bg-[var(--btn-outline-hover)]"
            >
              See statistics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
