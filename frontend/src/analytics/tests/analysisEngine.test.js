import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { classifyColumns, inferNumericColumns, parseStrictDate } from "../columnTyping.js";
import { computeStatistics } from "../statistics.js";
import { detectOutliers } from "../outliers.js";
import { computeCorrelations } from "../correlation.js";
import { analyzeDataset, buildInsights } from "../insights.js";
import { aggregateXY, lineSeries } from "../chartData.js";
import { coerceNumber, coerceNumberForStats } from "../formatters.js";

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

describe("column typing", () => {
  it("classifies mixed columns and ignores missing values", () => {
    const rows = [
      {
        amount: 10,
        label: "a",
        active: true,
        created: "2024-01-15",
        userId: 1,
        note: null,
      },
      {
        amount: "20.5",
        label: "b",
        active: false,
        created: "2024-02-01",
        userId: 2,
        note: "",
      },
      {
        amount: null,
        label: "a",
        active: true,
        created: "2024/03/10",
        userId: 3,
        note: "ok",
      },
    ];
    const typed = classifyColumns(rows);
    assert.equal(typed.types.amount, "numeric");
    assert.equal(typed.types.label, "categorical");
    assert.equal(typed.types.active, "boolean");
    assert.equal(typed.types.created, "date");
    assert.equal(typed.types.userId, "id");
    assert.equal(typed.types.note, "categorical");
  });

  it("does not treat arbitrary text as dates", () => {
    assert.equal(parseStrictDate("hello"), null);
    assert.equal(parseStrictDate("March 2020"), null);
    assert.equal(parseStrictDate("2024-13-40"), null);
    assert.equal(parseStrictDate("01/02/2024"), null);
    assert.ok(parseStrictDate("2024-03-15") instanceof Date);
    assert.ok(parseStrictDate("2024-03-15T12:00:00Z") instanceof Date);
  });

  it("keeps chart numeric inference treating booleans as numeric", () => {
    const rows = [{ flag: true }, { flag: false }];
    const numeric = inferNumericColumns(rows, ["flag"]);
    assert.deepEqual(numeric, ["flag"]);
    assert.equal(classifyColumns(rows).types.flag, "boolean");
  });
});

describe("statistics", () => {
  it("computes numeric summaries on a normal dataset", () => {
    const rows = [{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }, { n: 5 }];
    const stats = computeStatistics(rows);
    assert.equal(stats.rowCount, 5);
    assert.equal(stats.columnCount, 1);
    assert.equal(stats.numeric.n.count, 5);
    assert.equal(stats.numeric.n.sum, 15);
    assert.equal(stats.numeric.n.mean, 3);
    assert.equal(stats.numeric.n.median, 3);
    assert.equal(stats.numeric.n.min, 1);
    assert.equal(stats.numeric.n.max, 5);
    assert.ok(stats.numeric.n.stddev != null);
  });

  it("computes categorical frequencies", () => {
    const rows = [
      { city: "Lahore" },
      { city: "Lahore" },
      { city: "Karachi" },
    ];
    const stats = computeStatistics(rows);
    assert.equal(stats.categorical.city.distinctCount, 2);
    assert.equal(stats.categorical.city.mostFrequent.value, "Lahore");
    assert.equal(stats.categorical.city.mostFrequent.count, 2);
  });

  it("handles mixed data, nulls, empty strings, and numeric strings", () => {
    const rows = [
      { amount: "10", name: "x", skip: null },
      { amount: "", name: "y", skip: undefined },
      { amount: 20, name: "", skip: "z" },
    ];
    const stats = computeStatistics(rows);
    assert.equal(stats.numeric.amount.count, 2);
    assert.equal(stats.numeric.amount.sum, 30);
    assert.equal(stats.numeric.amount.mean, 15);
    assert.equal(stats.missingByColumn.amount, 1);
    assert.equal(stats.missingByColumn.name, 1);
    assert.equal(stats.missingByColumn.skip, 2);
  });

  it("does not average boolean or id columns", () => {
    const rows = [
      { active: true, userId: 1, score: 10 },
      { active: true, userId: 2, score: 20 },
      { active: false, userId: 3, score: 30 },
    ];
    const stats = computeStatistics(rows);
    assert.equal(stats.numeric.active, undefined);
    assert.equal(stats.numeric.userId, undefined);
    assert.equal(stats.numeric.score.sum, 60);
    assert.equal(stats.classification.idColumns.includes("userId"), true);
    assert.equal(stats.booleans.active.mostFrequent.value, "true");
    assert.equal(stats.booleans.active.mostFrequent.count, 2);
  });

  it("summarizes valid dates and ignores invalid ones", () => {
    const rows = [
      ...Array.from({ length: 9 }, (_, i) => ({
        d: `2024-01-${String(i + 1).padStart(2, "0")}`,
      })),
      { d: "not-a-date" },
      { d: "2024-06-01" },
      { d: null },
    ];
    const stats = computeStatistics(rows);
    assert.equal(stats.classification.types.d, "date");
    assert.equal(stats.dates.d.validCount, 10);
    assert.equal(stats.dates.d.invalidCount, 1);
    assert.equal(stats.dates.d.missingCount, 1);
    assert.ok(stats.dates.d.earliest.startsWith("2024-01-01"));
    assert.ok(stats.dates.d.latest.startsWith("2024-06-01"));
  });

  it("handles an empty dataset without inventing values", () => {
    const stats = computeStatistics([]);
    assert.equal(stats.rowCount, 0);
    assert.equal(stats.columnCount, 0);
    assert.equal(stats.missingCells, 0);
    assert.equal(stats.missingRatio, null);
    assert.deepEqual(stats.numeric, {});
  });
});

describe("outliers", () => {
  it("flags IQR outliers without mutating rows", () => {
    const rows = [1, 2, 3, 4, 5, 100].map((n) => ({ n }));
    const snapshot = clone(rows);
    const report = detectOutliers(rows);
    assert.equal(report.byColumn.n.skipped, false);
    assert.equal(report.byColumn.n.count, 1);
    assert.equal(report.byColumn.n.values[0].value, 100);
    assert.deepEqual(rows, snapshot);
  });

  it("skips constant numeric columns and tiny samples", () => {
    const constant = [{ n: 5 }, { n: 5 }, { n: 5 }, { n: 5 }, { n: 5 }];
    const tiny = [{ n: 1 }, { n: 100 }];
    assert.equal(detectOutliers(constant).byColumn.n.skipped, true);
    assert.equal(detectOutliers(tiny).byColumn.n.skipped, true);
    assert.equal(detectOutliers(tiny).byColumn.n.reason, "insufficient_numeric_values");
  });
});

describe("correlation", () => {
  it("computes Pearson r for aligned numeric columns", () => {
    const rows = [1, 2, 3, 4, 5].map((x) => ({ x, y: x * 2 }));
    const corr = computeCorrelations(rows);
    assert.equal(corr.pairs.length, 1);
    assert.equal(corr.pairs[0].skipped, false);
    assert.equal(corr.pairs[0].r, 1);
    assert.match(corr.note, /not causation/i);
  });

  it("skips insufficient data, missing pairs, and constant columns", () => {
    const few = [
      { a: 1, b: 2 },
      { a: 2, b: 3 },
      { a: 3, b: 4 },
    ];
    assert.equal(computeCorrelations(few).pairs[0].skipped, true);
    assert.equal(computeCorrelations(few).pairs[0].reason, "insufficient_pairwise_samples");

    const missing = [
      { a: 1, b: null },
      { a: 2, b: 4 },
      { a: 3, b: 6 },
      { a: 4, b: 8 },
      { a: 5, b: 10 },
    ];
    const withMissing = computeCorrelations(missing).pairs[0];
    assert.equal(withMissing.n, 4);
    assert.equal(withMissing.skipped, true);

    const constant = [1, 2, 3, 4, 5].map((x) => ({ x, z: 7 }));
    assert.equal(computeCorrelations(constant).pairs[0].reason, "constant_column");
  });
});

describe("insights and immutability", () => {
  it("builds findings only from calculated statistics", () => {
    const rows = [
      { score: 1, city: "A" },
      { score: 2, city: "A" },
      { score: 3, city: "B" },
      { score: 4, city: "A" },
      { score: 50, city: "C" },
    ];
    const analysis = analyzeDataset(rows);
    assert.doesNotThrow(() => JSON.stringify(analysis));
    assert.ok(analysis.insights.some((f) => f.type === "numeric_range"));
    assert.ok(analysis.insights.some((f) => f.type === "most_frequent"));
    assert.ok(analysis.insights.some((f) => f.type === "potential_outliers"));
    const range = analysis.insights.find((f) => f.type === "numeric_range");
    assert.equal(range.evidence.min, 1);
    assert.equal(range.evidence.max, 50);
    const freq = analysis.insights.find((f) => f.type === "most_frequent");
    assert.equal(freq.evidence.value, "A");
    assert.equal(freq.evidence.count, 3);
  });

  it("does not mutate input rows", () => {
    const rows = [
      { amount: 1, label: "x" },
      { amount: 2, label: "y" },
    ];
    Object.freeze(rows);
    Object.freeze(rows[0]);
    Object.freeze(rows[1]);
    const snapshot = clone(rows);
    analyzeDataset(rows);
    computeStatistics(rows);
    detectOutliers(rows);
    computeCorrelations(rows);
    aggregateXY(rows, "label", "amount");
    lineSeries(rows, "label", "amount");
    assert.deepEqual(clone(rows), snapshot);
  });

  it("returns empty-dataset insight without invented stats", () => {
    const findings = buildInsights({ statistics: computeStatistics([]) });
    assert.equal(findings.length, 1);
    assert.equal(findings[0].type, "empty");
  });
});

describe("chart data extraction", () => {
  it("preserves aggregateXY summing and lineSeries truncation flags", () => {
    const rows = [
      { cat: "a", v: 2 },
      { cat: "a", v: 3 },
      { cat: "b", v: 1 },
    ];
    const bars = aggregateXY(rows, "cat", "v");
    assert.deepEqual(
      bars.filter((d) => d.name === "a"),
      [{ name: "a", value: 5 }],
    );
    const line = lineSeries(rows, "cat", "v");
    assert.equal(line.data.length, 3);
    assert.equal(line.truncated, false);
  });

  it("chart coerce still maps booleans to 0/1; stats coerce does not", () => {
    assert.equal(coerceNumber(true), 1);
    assert.equal(coerceNumberForStats(true), null);
    assert.equal(coerceNumber("4.5"), 4.5);
    assert.equal(coerceNumberForStats("4.5"), 4.5);
    assert.equal(coerceNumberForStats("12px"), null);
  });
});
