type SectionHeaderProps = {
  id: string;
  title: string;
  countLabel: string;
  liveText: string;
};

export function SectionHeader({ id, title, countLabel, liveText }: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 id={id} className="text-xl font-normal tracking-tight text-landing-ink sm:text-2xl">
          {title}
        </h2>
        <span className="border-b-2 border-landing-ink pb-0.5 text-sm font-medium text-landing-ink tabular-nums">
          {countLabel}
        </span>
      </div>
      <span className="sr-only" aria-live="polite">
        {liveText}
      </span>
    </div>
  );
}

