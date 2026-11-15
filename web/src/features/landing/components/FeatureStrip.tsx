import { Command, Crown, Mail, Sparkles } from 'lucide-react';

const FEATURES = [
  {
    id: 'ask',
    icon: Command,
    title: '⌘K Ask your inbox',
    description: 'Ask plain-English questions across threads and jump straight to cited emails.',
  },
  {
    id: 'drafts',
    icon: Sparkles,
    title: 'AI drafts in your voice',
    description: "Generate replies tuned to your client's tone and review before anything sends.",
  },
  {
    id: 'gmail',
    icon: Mail,
    title: 'Gmail sync (read-only, beta)',
    description: 'Connect an approved Gmail account without changing labels or messages in Gmail.',
  },
  {
    id: 'handoff',
    icon: Crown,
    title: 'Live sync with your client',
    description: "Hand off decisions to your client's calm queue and see status updates in real time.",
  },
];

export function FeatureStrip() {
  return (
    <section id="features" aria-label="Key product capabilities" className="mt-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.id}
              className="flex items-start gap-3 rounded-[24px] border border-zinc-200/80 bg-white p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-landing-ink">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-landing-ink">{feature.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600">{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

