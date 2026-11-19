import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const MotionDiv = motion.div;
import { AppShell } from "../components/AppShell";
import { SqlCodeBlock } from "../components/learning/SqlCodeBlock";
import { MiniResultTable } from "../components/learning/MiniResultTable";
import { Button } from "../components/ui/Button";
import {
  Alert,
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
} from "../components/ui/Card";
import { SearchInput } from "../components/ui/Input";
import { Tab, TabList } from "../components/ui/Tabs";
import { cn } from "../components/ui/cn";
import { useAuth } from "../context/AuthContext";
import {
  BEGINNER_MISTAKES,
  BEST_PRACTICES,
  CONCEPT_LESSONS,
  CONFUSED_CONCEPTS,
  EXAMPLE_CATEGORIES,
  GUIDE_SECTIONS,
  INTRO_TOPICS,
  QUERY_EXAMPLES,
  READABILITY_TIPS,
  SAMPLE_SCHEMA,
  STRUCTURE_CLAUSES,
  STRUCTURE_WALKTHROUGH,
  TERMINOLOGY,
  searchGuide,
} from "../learning/sqlGuideContent";

const PROGRESS_KEY = (userId) => `ides.sql-guide.explored.${userId ?? "anon"}`;

function loadExplored(userId) {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function fadeUp(reduceMotion) {
  if (reduceMotion) return {};
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
    transition: { duration: 0.22, ease: "easeOut" },
  };
}

function SqlLearningGuide() {
  const { user } = useAuth();
  return <SqlLearningGuideBody key={user?.id ?? "anon"} userId={user?.id} />;
}

function SqlLearningGuideBody({ userId }) {
  const reduceMotion = useReducedMotion();
  const [section, setSection] = useState("intro");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [openLessonId, setOpenLessonId] = useState(CONCEPT_LESSONS[0]?.id ?? null);
  const [openExampleId, setOpenExampleId] = useState(null);
  const [explored, setExplored] = useState(() => loadExplored(userId));

  function markExplored(id) {
    setExplored((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(PROGRESS_KEY(userId), JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
      return next;
    });
  }

  function toggleLesson(id) {
    setOpenLessonId((current) => (current === id ? null : id));
    markExplored(id);
  }

  const searching = query.trim().length > 0;
  const { lessons: matchedLessons, examples: matchedExamples } = useMemo(
    () => searchGuide(query),
    [query],
  );

  const filteredExamples = useMemo(() => {
    if (searching) return matchedExamples;
    if (category === "All") return QUERY_EXAMPLES;
    return QUERY_EXAMPLES.filter((ex) => ex.category === category);
  }, [searching, matchedExamples, category]);

  const visibleLessons = searching ? matchedLessons : CONCEPT_LESSONS;
  const exploredCount = CONCEPT_LESSONS.filter((l) => explored.includes(l.id)).length;
  const progressPct = Math.round((exploredCount / CONCEPT_LESSONS.length) * 100);

  const motionProps = fadeUp(reduceMotion);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 md:px-8">
        <div className="mb-6 md:mb-8 rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50 via-white to-sky-50 p-5 md:p-6 shadow-sm shadow-indigo-100/60">
          <PageHeader
            className="mb-0"
            title="SQL Learning Guide"
            description="A built-in primer for students and non-technical users: core SQL ideas, common MySQL queries, how statements are structured, and beginner pitfalls. Examples use sample students, courses, and enrollments tables. Nothing on this page is sent to the live query executor."
          />
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <p className="text-xs font-medium text-slate-600">
                  Lessons explored
                </p>
                <p className="text-xs tabular-nums text-slate-500">
                  {exploredCount} of {CONCEPT_LESSONS.length}
                </p>
              </div>
              <div
                className="h-2 rounded-full bg-indigo-100 overflow-hidden"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPct}
                aria-label="SQL lessons explored"
              >
                <div
                  className="h-full rounded-full bg-indigo-600 transition-[width] duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
            <Badge variant="accent">Read-only learning · MySQL</Badge>
          </div>
        </div>

        <div className="mb-5 flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex-1 min-w-0">
            <label htmlFor="sql-guide-search" className="sr-only">
              Search SQL concepts and examples
            </label>
            <SearchInput
              id="sql-guide-search"
              placeholder="Search concepts, clauses, or examples…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10"
            />
          </div>
          {searching ? (
            <Button variant="ghost" size="sm" onClick={() => setQuery("")}>
              Clear search
            </Button>
          ) : null}
        </div>

        <div className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-[var(--color-surface-muted)]/95 backdrop-blur lg:static lg:mx-0 lg:px-0 lg:bg-transparent lg:backdrop-blur-none">
          <TabList className="w-full">
            {GUIDE_SECTIONS.map((item) => (
              <Tab
                key={item.id}
                id={`guide-tab-${item.id}`}
                active={!searching && section === item.id}
                onClick={() => {
                  setSection(item.id);
                  if (searching) setQuery("");
                }}
              >
                {item.label}
              </Tab>
            ))}
          </TabList>
        </div>

        <AnimatePresence mode="wait">
          {searching ? (
            <MotionDiv key="search" {...motionProps} className="pt-5 space-y-8">
              <SearchResults
                query={query}
                lessons={visibleLessons}
                examples={filteredExamples}
                openLessonId={openLessonId}
                onToggleLesson={toggleLesson}
                explored={explored}
                category={category}
                onCategory={setCategory}
                openExampleId={openExampleId}
                onToggleExample={setOpenExampleId}
                hideCategories
              />
            </MotionDiv>
          ) : (
            <MotionDiv key={section} {...motionProps} className="pt-5">
              {section === "intro" ? <IntroSection /> : null}
              {section === "concepts" ? (
                <ConceptsSection
                  lessons={CONCEPT_LESSONS}
                  openLessonId={openLessonId}
                  onToggleLesson={toggleLesson}
                  explored={explored}
                />
              ) : null}
              {section === "examples" ? (
                <ExamplesSection
                  examples={filteredExamples}
                  category={category}
                  onCategory={setCategory}
                  openExampleId={openExampleId}
                  onToggleExample={setOpenExampleId}
                />
              ) : null}
              {section === "structure" ? <StructureSection /> : null}
              {section === "beginners" ? <BeginnerSection /> : null}
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function SearchResults({
  query,
  lessons,
  examples,
  openLessonId,
  onToggleLesson,
  explored,
  category,
  onCategory,
  openExampleId,
  onToggleExample,
}) {
  const empty = lessons.length === 0 && examples.length === 0;

  if (empty) {
    return (
      <Card>
        <EmptyState
          title={`No matches for “${query}”`}
          description="Try a clause name such as WHERE, JOIN, or COUNT, or a topic such as sorting or primary key."
        />
      </Card>
    );
  }

  return (
    <>
      <p className="text-sm text-slate-600">
        Showing matches for <span className="font-medium text-slate-900">{query}</span>
        {" · "}
        {lessons.length} concept{lessons.length === 1 ? "" : "s"}, {examples.length} example
        {examples.length === 1 ? "" : "s"}
      </p>
      {lessons.length ? (
        <ConceptsSection
          lessons={lessons}
          openLessonId={openLessonId}
          onToggleLesson={onToggleLesson}
          explored={explored}
        />
      ) : null}
      {examples.length ? (
        <ExamplesSection
          examples={examples}
          category={category}
          onCategory={onCategory}
          openExampleId={openExampleId}
          onToggleExample={onToggleExample}
          heading="Matching examples"
          hideCategories
        />
      ) : null}
    </>
  );
}

function IntroSection() {
  return (
    <div className="space-y-6">
      <Alert variant="info" title="Learning data, not your live schema">
        <p>
          Illustrations use a tiny university database. Open Schema Explorer to inspect your
          real tables. IDES executes only SELECT queries; mutating examples later in this guide
          are labeled and never auto-run.
        </p>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTRO_TOPICS.map((topic) => (
          <Card key={topic.id}>
            <CardHeader className="py-3">
              <h2 className="text-sm font-semibold text-slate-900">{topic.title}</h2>
            </CardHeader>
            <CardBody className="pt-0 space-y-3">
              <p className="text-sm text-slate-700 leading-relaxed">{topic.body}</p>
              <p className="text-sm text-slate-600 leading-relaxed rounded-lg bg-indigo-50/70 border border-indigo-100 px-3 py-2">
                {topic.example}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Sample tables used in examples</h2>
          <p className="text-xs text-slate-500 mt-1">{SAMPLE_SCHEMA.description}</p>
        </CardHeader>
        <CardBody className="pt-0 grid grid-cols-1 xl:grid-cols-3 gap-4">
          {SAMPLE_SCHEMA.tables.map((table) => (
            <MiniResultTable
              key={table.name}
              caption={table.name}
              columns={table.columns}
              rows={table.rows}
            />
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

function ConceptsSection({ lessons, openLessonId, onToggleLesson, explored }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <h2 className="text-sm font-semibold text-slate-900">Basic SQL concepts</h2>
        <Badge variant="default">Expand a lesson to read the full explanation</Badge>
      </div>
      {lessons.map((lesson) => {
        const open = openLessonId === lesson.id;
        const seen = explored.includes(lesson.id);
        return (
          <Card
            key={lesson.id}
            className={cn(
              open && "ring-2 ring-indigo-500/30 border-indigo-200",
            )}
          >
            <button
              type="button"
              onClick={() => onToggleLesson(lesson.id)}
              className="w-full text-left px-5 py-4 flex items-start gap-3 rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-expanded={open}
              aria-controls={`lesson-panel-${lesson.id}`}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                  lesson.mutating
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-indigo-50 text-indigo-800 border border-indigo-100",
                )}
              >
                {lesson.name.slice(0, 2)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{lesson.name}</span>
                  {lesson.mutating ? (
                    <Badge variant="warning">Modifies data · not executed</Badge>
                  ) : (
                    <Badge variant="success">Read-only</Badge>
                  )}
                  {seen ? <Badge variant="accent">Explored</Badge> : null}
                </span>
                <span className="block text-sm text-slate-600 mt-1">{lesson.summary}</span>
              </span>
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className={cn(
                  "h-5 w-5 shrink-0 text-slate-400 transition-transform",
                  open && "rotate-180",
                )}
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <AnimatePresence initial={false}>
              {open ? (
                <MotionDiv
                  id={`lesson-panel-${lesson.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-700 leading-relaxed">{lesson.explanation}</p>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                        Syntax
                      </p>
                      <SqlCodeBlock sql={lesson.syntax} mutating={lesson.mutating} label="Syntax" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                        Practical example
                      </p>
                      <SqlCodeBlock
                        sql={lesson.exampleSql}
                        mutating={lesson.mutating}
                        label="Example"
                      />
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{lesson.exampleExplanation}</p>
                    {lesson.result ? (
                      <MiniResultTable
                        caption={lesson.result.caption}
                        columns={lesson.result.columns}
                        rows={lesson.result.rows}
                      />
                    ) : null}
                    {lesson.resultNote ? (
                      <Alert variant="warning" title="Not run against your database">
                        <p>{lesson.resultNote}</p>
                      </Alert>
                    ) : null}
                  </div>
                </MotionDiv>
              ) : null}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}

function ExamplesSection({
  examples,
  category,
  onCategory,
  openExampleId,
  onToggleExample,
  heading = "Common SQL query examples",
  hideCategories = false,
}) {
  const categories = ["All", ...EXAMPLE_CATEGORIES];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">{heading}</h2>
        {hideCategories ? null : (
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCategory(cat)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                category === cat
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        )}
      </div>

      {examples.length === 0 ? (
        <Card>
          <EmptyState
            title="No examples in this category"
            description="Choose another category or clear the search to see the full collection."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {examples.map((ex) => {
            const open = openExampleId === ex.id;
            return (
              <Card
                key={ex.id}
                className={cn(open && "ring-2 ring-indigo-500/25 border-indigo-200")}
              >
                <CardHeader className="py-3 flex flex-row items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Badge variant="accent">{ex.category}</Badge>
                    <h3 className="text-sm font-semibold text-slate-900 mt-2">{ex.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{ex.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleExample(open ? null : ex.id)}
                    aria-expanded={open}
                  >
                    {open ? "Hide" : "Details"}
                  </Button>
                </CardHeader>
                <CardBody className="pt-0 space-y-3">
                  <SqlCodeBlock sql={ex.sql} mutating={false} />
                  {open ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-700 leading-relaxed">{ex.explanation}</p>
                      <p className="text-sm text-slate-600 leading-relaxed rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                        <span className="font-medium text-slate-800">Expected output. </span>
                        {ex.expected}
                      </p>
                    </div>
                  ) : null}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StructureSection() {
  const [activeClause, setActiveClause] = useState(STRUCTURE_CLAUSES[0].id);
  const active = STRUCTURE_CLAUSES.find((c) => c.id === activeClause) ?? STRUCTURE_CLAUSES[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">How a SQL query is structured</h2>
          <p className="text-xs text-slate-500 mt-1">
            Select a clause to see its purpose. Written order (SELECT first) differs from logical
            processing order (FROM first).
          </p>
        </CardHeader>
        <CardBody className="pt-0 space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 font-mono text-xs md:text-sm leading-8 overflow-x-auto">
            {STRUCTURE_CLAUSES.filter((c) =>
              ["select", "from", "where", "order", "limit"].includes(c.id),
            ).map((clause) => (
              <button
                key={clause.id}
                type="button"
                onClick={() => setActiveClause(clause.id)}
                className={cn(
                  "block w-full text-left rounded-md px-2 py-0.5 transition-colors",
                  activeClause === clause.id
                    ? "bg-indigo-500/30 text-white ring-1 ring-indigo-300/40"
                    : "text-slate-200 hover:bg-white/5",
                )}
              >
                {clause.snippet}
                {clause.id === "limit" ? ";" : ""}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {STRUCTURE_CLAUSES.map((clause, index) => (
              <button
                key={clause.id}
                type="button"
                onClick={() => setActiveClause(clause.id)}
                className={cn(
                  "rounded-lg border px-2 py-2 text-left transition-colors",
                  activeClause === clause.id
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-slate-200 bg-white hover:bg-slate-50",
                )}
              >
                <span className="block text-[10px] uppercase tracking-wide text-slate-400">
                  {index + 1}
                </span>
                <span className="block text-xs font-semibold text-slate-900">{clause.keyword}</span>
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800">
              {active.keyword}
            </p>
            <p className="text-sm text-slate-800 mt-1 leading-relaxed">{active.purpose}</p>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{active.orderNote}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">{STRUCTURE_WALKTHROUGH.title}</h2>
        </CardHeader>
        <CardBody className="pt-0 space-y-4">
          <SqlCodeBlock sql={STRUCTURE_WALKTHROUGH.sql} mutating={false} />
          <ol className="space-y-3">
            {STRUCTURE_WALKTHROUGH.steps.map((step) => (
              <li
                key={step.title}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3"
              >
                <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
          <Alert variant="info">{STRUCTURE_WALKTHROUGH.logicalOrder}</Alert>
        </CardBody>
      </Card>
    </div>
  );
}

function BeginnerSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">SQL terminology</h2>
        </CardHeader>
        <CardBody className="pt-0">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TERMINOLOGY.map((item) => (
              <div key={item.term} className="rounded-lg border border-slate-200 px-4 py-3">
                <dt className="text-sm font-semibold text-slate-900">{item.term}</dt>
                <dd className="text-sm text-slate-600 mt-1 leading-relaxed">{item.definition}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Common beginner mistakes</h2>
        </CardHeader>
        <CardBody className="pt-0 grid grid-cols-1 md:grid-cols-2 gap-3">
          {BEGINNER_MISTAKES.map((item) => (
            <div key={item.title} className="rounded-lg border border-amber-100 bg-amber-50/40 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Tips for readable SQL</h2>
          </CardHeader>
          <CardBody className="pt-0">
            <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5 marker:text-indigo-400">
              {READABILITY_TIPS.map((tip) => (
                <li key={tip} className="leading-relaxed">
                  {tip}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Basic best practices</h2>
          </CardHeader>
          <CardBody className="pt-0">
            <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5 marker:text-indigo-400">
              {BEST_PRACTICES.map((tip) => (
                <li key={tip} className="leading-relaxed">
                  {tip}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Frequently confused concepts</h2>
        {CONFUSED_CONCEPTS.map((pair) => (
          <Card key={pair.id}>
            <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Badge variant="accent">{pair.left}</Badge>
                <p className="text-sm text-slate-700 mt-2 leading-relaxed">{pair.leftText}</p>
              </div>
              <div>
                <Badge variant="default">{pair.right}</Badge>
                <p className="text-sm text-slate-700 mt-2 leading-relaxed">{pair.rightText}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default SqlLearningGuide;
