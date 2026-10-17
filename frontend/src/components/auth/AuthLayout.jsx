import { IdesLogo } from "../brand/IdesLogo";

const SQL_EXAMPLE = "SELECT name, email FROM users LIMIT 10;";

function FeatureIcon() {
  return (
    <span
      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/25"
      aria-hidden
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path
          fillRule="evenodd"
          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

function BrandVisual() {
  return (
    <div
      className="flex w-full max-w-md flex-col items-stretch gap-3 [@media(max-height:780px)]:gap-2"
      aria-hidden
    >
      <div className="relative flex justify-center py-1">
        <div className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 h-24 rounded-3xl bg-indigo-500/10 blur-2xl" />
        <svg
          viewBox="0 0 360 148"
          className="relative w-full max-w-[320px] h-auto max-h-[min(132px,20svh)] [@media(max-height:780px)]:max-h-[min(108px,18svh)] text-indigo-300/90"
        >
          <defs>
            <linearGradient id="ides-brand-g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <ellipse cx="180" cy="40" rx="100" ry="26" fill="none" stroke="url(#ides-brand-g)" strokeWidth="2" />
          <path
            d="M80 40v48c0 20 44 36 100 36s100-16 100-36V40"
            fill="none"
            stroke="url(#ides-brand-g)"
            strokeWidth="2"
          />
          <path
            d="M80 88v48c0 20 44 36 100 36s100-16 100-36V88"
            fill="none"
            stroke="url(#ides-brand-g)"
            strokeWidth="2"
          />
          <circle cx="120" cy="108" r="5" fill="#a5b4fc" />
          <circle cx="180" cy="124" r="5" fill="#93c5fd" />
          <circle cx="240" cy="102" r="5" fill="#c4b5fd" />
          <path
            d="M120 108 L180 124 L240 102"
            stroke="#6366f1"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.75"
          />
        </svg>
      </div>

      <div className="rounded-lg border border-indigo-400/25 bg-slate-900/45 px-3 py-2.5 shadow-inner shadow-black/20 backdrop-blur-[2px]">
        <p className="text-[10px] font-medium uppercase tracking-wider text-indigo-300/70 mb-1">
          Example query
        </p>
        <code className="block font-mono text-[11px] leading-relaxed text-indigo-100/90 break-words">
          {SQL_EXAMPLE}
        </code>
      </div>
    </div>
  );
}

const features = [
  { title: "Natural-language querying", desc: "Ask in plain English, get read-only SQL." },
  { title: "Explainable SQL", desc: "Understand every clause before you run it." },
  { title: "Interactive insights", desc: "Tables and charts from real query results." },
];

function BrandPanel() {
  return (
    <aside
      className="relative hidden lg:flex lg:w-[min(52%,520px)] xl:w-[48%] shrink-0 flex-col bg-[#0f172a] text-white min-h-[100svh] min-h-screen h-[100svh] max-h-[100svh] overflow-hidden"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#312e81_0%,_transparent_55%)] opacity-80"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-12 xl:px-16 py-8 xl:py-10 [@media(max-height:780px)]:py-6 [@media(max-height:780px)]:px-10 gap-6 xl:gap-7 [@media(max-height:780px)]:gap-4">
        <header className="shrink-0 space-y-4 [@media(max-height:780px)]:space-y-3">
          <IdesLogo className="[&_p:first-child]:text-white [&_p:last-child]:text-indigo-200/80" />
          <div className="max-w-[26rem]">
            <h1 className="text-[2rem] xl:text-[2.625rem] font-semibold tracking-tight leading-[1.15] text-white [@media(max-height:780px)]:text-[1.75rem]">
              Your database. Your questions. Clear answers.
            </h1>
            <p className="mt-3 text-sm text-indigo-100/85 leading-relaxed max-w-[24rem] [@media(max-height:780px)]:mt-2 [@media(max-height:780px)]:text-[13px]">
              Explore data in natural language, understand the SQL behind every answer, and turn
              query results into useful insights.
            </p>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col justify-center py-1 [@media(max-height:780px)]:py-0">
          <BrandVisual />
        </div>

        <ul className="shrink-0 space-y-3 pb-1 [@media(max-height:780px)]:space-y-2.5 max-w-md">
          {features.map((f) => (
            <li key={f.title} className="flex gap-3 items-start">
              <FeatureIcon />
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-medium text-white leading-snug">{f.title}</p>
                <p className="text-xs text-indigo-200/75 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export function AuthLayout({ heading, subheading, children, footer }) {
  return (
    <div className="flex min-h-[100svh] min-h-screen flex-col bg-slate-50 lg:h-[100svh] lg:max-h-[100svh] lg:flex-row lg:overflow-hidden">
      <BrandPanel />

      <div className="flex min-h-0 flex-1 flex-col lg:h-full lg:overflow-y-auto">
        <div className="lg:hidden px-4 py-4 border-b border-slate-200 bg-white shrink-0">
          <IdesLogo compact />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-[440px]">
            <header className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{heading}</h2>
              {subheading ? (
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{subheading}</p>
              ) : null}
            </header>
            {children}
            {footer ? <div className="mt-6">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthLoadingScreen() {
  return (
    <div className="min-h-[100svh] min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-600">
      <span className="inline-flex items-center gap-2">
        <span className="h-4 w-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
        Loading…
      </span>
    </div>
  );
}
