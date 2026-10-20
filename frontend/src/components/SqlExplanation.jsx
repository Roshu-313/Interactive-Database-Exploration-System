import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { cn } from "./ui/cn";
import {
  EXPLANATION_GROUP_META,
  displaySectionTitle,
  groupExplanationSections,
  looksLikeMarkdown,
  splitMarkdownSections,
} from "../utils/explanationSections";

function isSafeHref(href) {
  if (!href || typeof href !== "string") return false;
  try {
    const url = new URL(href, "https://example.invalid");
    return url.protocol === "https:" || url.protocol === "http:" || url.protocol === "mailto:";
  } catch {
    return false;
  }
}

const markdownComponents = {
  h1: ({ children }) => (
    <h3 className="text-base font-semibold text-slate-900 mt-4 mb-2 first:mt-0">{children}</h3>
  ),
  h2: ({ children }) => (
    <h4 className="text-sm font-semibold text-slate-900 mt-3 mb-1.5 first:mt-0">{children}</h4>
  ),
  h3: ({ children }) => (
    <h5 className="text-sm font-medium text-slate-800 mt-2 mb-1 first:mt-0">{children}</h5>
  ),
  p: ({ children }) => (
    <p className="text-sm text-slate-700 leading-relaxed mb-2 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="text-sm text-slate-700 leading-relaxed mb-2 last:mb-0 pl-5 list-disc space-y-1 marker:text-indigo-400">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-sm text-slate-700 leading-relaxed mb-2 last:mb-0 pl-5 list-decimal space-y-1.5 marker:font-medium marker:text-indigo-700">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
  a: ({ href, children }) =>
    isSafeHref(href) ? (
      <a
        href={href}
        className="text-indigo-700 underline underline-offset-2 hover:text-indigo-900"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
  code: ({ inline, className, children, ...props }) => {
    const isBlock =
      inline === false ||
      className?.includes("language-") ||
      String(children).includes("\n");
    if (isBlock) {
      return (
        <pre className="text-xs md:text-sm bg-slate-900 text-slate-100 p-3 md:p-4 rounded-lg overflow-x-auto font-mono leading-relaxed my-2">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      );
    }
    return (
      <code
        className="font-mono text-[0.8125rem] font-medium text-indigo-900 bg-indigo-50 border border-indigo-100/90 px-1.5 py-0.5 rounded-md whitespace-normal break-words"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-indigo-200 pl-3 my-2 text-sm text-slate-600 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-slate-200" />,
};

function MarkdownBlock({ content, className }) {
  if (!content?.trim()) return null;
  return (
    <div className={cn("sql-explanation-md min-w-0", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

function SectionIcon({ groupKey, className }) {
  const cnBase = cn("h-4 w-4 shrink-0 text-indigo-600", className);
  switch (groupKey) {
    case "overview":
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" className={cnBase} aria-hidden>
          <path d="M10 3.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.75a1 1 0 00-1 1v6.5a1 1 0 102 0v-6.5a1 1 0 00-1-1z" />
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-1.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "breakdown":
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" className={cnBase} aria-hidden>
          <path
            fillRule="evenodd"
            d="M6 3.75A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h8.25A2.25 2.25 0 0016.5 14.25V6A2.25 2.25 0 0014.25 3.75H6zM5.25 6A.75.75 0 016 5.25h8.25a.75.75 0 01.75.75v8.25a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75V6z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "conditions":
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" className={cnBase} aria-hidden>
          <path
            fillRule="evenodd"
            d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 01-1.06 1.06L11 7.56V16.5a.75.75 0 01-1.5 0V7.56L6.03 10.53a.75.75 0 01-1.06-1.06l4.25-4.25z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "joins":
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" className={cnBase} aria-hidden>
          <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM7 18a3 3 0 100-6 3 3 0 000 6zM13 8a3 3 0 100-6 3 3 0 000 6z" />
          <path d="M9.5 5.5h1v3h-1v-3zm0 7h1v3h-1v-3zm3.5-3.5h-3v1h3v-1z" />
        </svg>
      );
    case "sorting":
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" className={cnBase} aria-hidden>
          <path d="M3 5.75A.75.75 0 013.75 5h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 5.75zM3 10a.75.75 0 01.75-.75h8.5a.75.75 0 010 1.5h-8.5A.75.75 0 013 10zm0 4.25a.75.75 0 01.75-.75h5.5a.75.75 0 010 1.5h-5.5A.75.75 0 013 14.25z" />
        </svg>
      );
    case "howItWorks":
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" className={cnBase} aria-hidden>
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.5a.75.75 0 00-1.5 0v4.19l-1.72 1.72a.75.75 0 101.06 1.06l2.25-2.25A.75.75 0 0010.75 10.5V6.5z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "notes":
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" className={cnBase} aria-hidden>
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
            clipRule="evenodd"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" className={cnBase} aria-hidden>
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
}

function ExplanationGroupBlock({ groupKey, sections }) {
  const meta = EXPLANATION_GROUP_META[groupKey] ?? EXPLANATION_GROUP_META.misc;
  if (!sections?.length) return null;

  const isBreakdown = groupKey === "breakdown";

  return (
    <section
      className={cn(
        "rounded-lg border px-4 py-3.5 md:px-5 md:py-4",
        meta.tint,
      )}
      aria-labelledby={`expl-${meta.key}-heading`}
    >
      <div className="flex items-center gap-2 mb-2.5 md:mb-3">
        <SectionIcon groupKey={groupKey} />
        <h4
          id={`expl-${meta.key}-heading`}
          className="text-sm font-semibold text-slate-900 tracking-tight"
        >
          {meta.heading}
        </h4>
      </div>

      {isBreakdown ? (
        <div className="space-y-3 md:space-y-3.5">
          {sections.map((section, idx) => (
            <div
              key={`${section.title ?? "clause"}-${idx}`}
              className="border-l-2 border-indigo-200/90 pl-3 md:pl-4"
            >
              {section.title ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800/90 mb-1">
                  {displaySectionTitle(section.title)}
                </p>
              ) : null}
              <MarkdownBlock content={section.body} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, idx) => (
            <div key={`${section.title ?? "block"}-${idx}`}>
              {section.title &&
              sections.length > 1 &&
              groupKey !== "overview" &&
              !OVERVIEW_SINGLE.test(section.title) ? (
                <p className="text-xs font-semibold text-slate-800 mb-1">{displaySectionTitle(section.title)}</p>
              ) : null}
              <MarkdownBlock content={section.body} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const OVERVIEW_SINGLE = /^(purpose|query overview|overview|summary)$/i;

const GROUP_ORDER = [
  "overview",
  "breakdown",
  "conditions",
  "joins",
  "sorting",
  "howItWorks",
  "notes",
  "misc",
];

/**
 * @param {{ explanation?: string | null, sql?: string | null }} props
 */
export function SqlExplanation({ explanation }) {
  const trimmed = typeof explanation === "string" ? explanation.trim() : "";
  if (!trimmed) return null;

  const unavailable =
    /^explanation not available\.?$/i.test(trimmed) ||
    trimmed.toLowerCase().includes("not available for this query");

  if (unavailable) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-900">SQL Explanation</h3>
        </CardHeader>
        <CardBody className="pt-0">
          <p className="text-sm text-slate-500 leading-relaxed">
            An explanation could not be generated for this query. The generated SQL above still shows
            what will run against the database.
          </p>
        </CardBody>
      </Card>
    );
  }

  const sections = splitMarkdownSections(trimmed);
  const hasStructuredHeadings = sections.some((s) => s.title != null);

  if (!hasStructuredHeadings) {
    const body = sections[0]?.body ?? trimmed;
    const useMarkdown = looksLikeMarkdown(body);

    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <SectionIcon groupKey="overview" className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">SQL Explanation</h3>
        </CardHeader>
        <CardBody className="pt-0">
          {useMarkdown ? (
            <ExplanationGroupBlock
              groupKey="overview"
              sections={[{ title: null, body }]}
            />
          ) : (
            <p className="text-sm text-slate-700 leading-relaxed">{trimmed}</p>
          )}
        </CardBody>
      </Card>
    );
  }

  const groups = groupExplanationSections(sections);

  const visibleGroups = GROUP_ORDER.filter((key) => {
    const items = groups[key];
    return items?.some((s) => s.body?.trim());
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <SectionIcon groupKey="overview" className="text-indigo-600" />
        <div>
          <h3 className="text-sm font-semibold text-slate-900">SQL Explanation</h3>
          <p className="text-xs text-slate-500 mt-0.5">Structured guide to the generated query</p>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="space-y-3 md:space-y-4">
          {visibleGroups.map((key) => (
            <ExplanationGroupBlock key={key} groupKey={key} sections={groups[key]} />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
