const SQL_CLAUSE_PATTERN =
  /^(select|from|where|join|inner join|left join|right join|full join|cross join|group by|having|order by|limit|offset|union)$/i;

const OVERVIEW_TITLES = /^(purpose|query overview|overview|summary)$/i;
const HOW_IT_WORKS_TITLES = /^(how it works|how the query works|execution steps?|step-by-step)$/i;
const NOTES_TITLES = /^(important notes?|notes?|caveats?|things to note)$/i;
const CONDITIONS_TITLES = /^(where|conditions?( and filters?)?|filters?)$/i;
const JOINS_TITLES = /^(joins?( and relationships?)?|relationships?|table relationships?)$/i;
const SORTING_TITLES =
  /^(order by|group by|having|limit|offset|sorting( and results?)?|aggregation|aggregates?|functions?|results?)$/i;

/**
 * Split Markdown explanation into sections by ## headings.
 * @param {string} text
 * @returns {{ title: string | null, body: string }[]}
 */
export function splitMarkdownSections(text) {
  if (!text || typeof text !== "string") return [];

  const lines = text.split("\n");
  const sections = [];
  let current = { title: null, body: [] };

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      const bodyStr = current.body.join("\n").trim();
      if (current.title != null || bodyStr) {
        sections.push({ title: current.title, body: bodyStr });
      }
      current = { title: h2[1].trim(), body: [] };
    } else {
      current.body.push(line);
    }
  }

  const tail = current.body.join("\n").trim();
  if (current.title != null || tail) {
    sections.push({ title: current.title, body: tail });
  }

  return sections;
}

/**
 * @param {string | null} title
 * @returns {'overview' | 'breakdown' | 'conditions' | 'joins' | 'sorting' | 'howItWorks' | 'notes' | 'misc'}
 */
export function categorizeSection(title) {
  if (!title || !String(title).trim()) return "misc";

  const raw = String(title).trim();
  const t = raw.toLowerCase();

  if (OVERVIEW_TITLES.test(raw)) return "overview";
  if (HOW_IT_WORKS_TITLES.test(raw)) return "howItWorks";
  if (NOTES_TITLES.test(raw)) return "notes";
  if (CONDITIONS_TITLES.test(raw) || (t.startsWith("where ") && t.length > 5)) return "conditions";
  if (JOINS_TITLES.test(raw) || /\bjoin\b/.test(t)) return "joins";
  if (SORTING_TITLES.test(raw)) return "sorting";

  if (SQL_CLAUSE_PATTERN.test(raw)) {
    if (/^where$/i.test(raw)) return "conditions";
    if (/\bjoin\b/i.test(raw)) return "joins";
    if (/^(group by|having|order by|limit|offset)$/i.test(raw)) return "sorting";
    return "breakdown";
  }

  if (/^select\b/i.test(raw) || /^from\b/i.test(raw)) return "breakdown";

  return "misc";
}

/** @param {string | null} title */
export function displaySectionTitle(title) {
  if (!title) return "Details";
  const raw = String(title).trim();
  if (OVERVIEW_TITLES.test(raw)) return "Query Overview";
  if (/^purpose$/i.test(raw)) return "Query Overview";
  if (CONDITIONS_TITLES.test(raw) || /^where$/i.test(raw)) return "WHERE";
  return raw;
}

/**
 * @param {{ title: string | null, body: string }[]} sections
 */
export function groupExplanationSections(sections) {
  /** @type {Record<string, { title: string | null, body: string }[]>} */
  const groups = {
    overview: [],
    breakdown: [],
    conditions: [],
    joins: [],
    sorting: [],
    howItWorks: [],
    notes: [],
    misc: [],
  };

  for (const section of sections) {
    if (!section.body && !section.title) continue;
    if (section.title == null) {
      groups.overview.push(section);
      continue;
    }
    const cat = categorizeSection(section.title);
    groups[cat].push(section);
  }

  return groups;
}

export const EXPLANATION_GROUP_META = {
  overview: {
    key: "overview",
    heading: "Query Overview",
    tint: "bg-indigo-50/40 border-indigo-100/80",
  },
  breakdown: {
    key: "breakdown",
    heading: "SQL Breakdown",
    tint: "bg-white border-slate-100",
  },
  conditions: {
    key: "conditions",
    heading: "Conditions and Filters",
    tint: "bg-amber-50/30 border-amber-100/70",
  },
  joins: {
    key: "joins",
    heading: "Joins and Relationships",
    tint: "bg-sky-50/35 border-sky-100/70",
  },
  sorting: {
    key: "sorting",
    heading: "Sorting and Results",
    tint: "bg-violet-50/30 border-violet-100/70",
  },
  howItWorks: {
    key: "howItWorks",
    heading: "How It Works",
    tint: "bg-emerald-50/30 border-emerald-100/70",
  },
  notes: {
    key: "notes",
    heading: "Important Notes",
    tint: "bg-slate-50 border-slate-200/80",
  },
  misc: {
    key: "misc",
    heading: "Additional details",
    tint: "bg-white border-slate-100",
  },
};

/** @param {string} text */
export function looksLikeMarkdown(text) {
  if (!text) return false;
  return (
    /^##\s+/m.test(text) ||
    /^#\s+/m.test(text) ||
    /^\s*[-*+]\s+/m.test(text) ||
    /^\s*\d+\.\s+/m.test(text) ||
    /\*\*[^*]+\*\*/.test(text) ||
    /`[^`]+`/.test(text)
  );
}
