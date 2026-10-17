const { QueryTypes } = require('sequelize');
const llmToSql = require('../utils/llmToSql');
const nlToSql = require('../utils/nlToSql');
const llmExplain = require('../utils/llmExplain');
const explainSQL = require('../utils/sqlExplain');
const llmErrorCorrection = require('../utils/llmErrorCorrection');
const {
  validateSqlForExecution,
  categorizeExecutionError,
} = require('../utils/sqlSecurity');
const { listTableNames } = require('../services/schemaService');
const {
  serializeResults,
  buildVisualizationMeta,
} = require('../utils/queryResultVisualization');
const { sequelize, QueryHistory } = require('../models');

async function buildSchemaSummary() {
  try {
    const tables = await listTableNames();
    const preview = tables.slice(0, 12);
    return `Tables: ${preview.join(', ')}${tables.length > preview.length ? ', …' : ''}`;
  } catch {
    return '';
  }
}

async function sendQueryError(res, status, {
  category,
  message,
  naturalLanguageQuery,
  generatedSql,
}) {
  const schemaSummary = await buildSchemaSummary();
  const assistance = await llmErrorCorrection({
    naturalLanguageQuery,
    generatedSql: generatedSql || null,
    errorCategory: category,
    safeErrorMessage: message,
    schemaSummary,
  });

  return res.status(status).json({
    status: 'error',
    message,
    errorCategory: category,
    input: naturalLanguageQuery,
    sql: generatedSql || null,
    assistance,
  });
}

async function resolveSqlFromNaturalLanguage(naturalLanguageQuery) {
  let llmFailed = false;
  let sqlQuery = null;

  try {
    sqlQuery = await llmToSql(naturalLanguageQuery);
  } catch {
    llmFailed = true;
  }

  if (!sqlQuery) {
    sqlQuery = nlToSql(naturalLanguageQuery);
  }

  if (!sqlQuery && llmFailed) {
    return { error: { category: 'LLM_FAILURE', message: 'AI translation is temporarily unavailable.' } };
  }

  if (!sqlQuery) {
    return {
      error: {
        category: 'QUERY_NOT_UNDERSTOOD',
        message: 'Your question could not be translated into SQL. Try being more specific.',
      },
    };
  }

  return { sqlQuery };
}

async function executeValidatedSelect(sqlQuery) {
  const validation = await validateSqlForExecution(sqlQuery, listTableNames);
  if (!validation.ok) {
    return {
      error: {
        category: 'SECURITY_VIOLATION',
        message: validation.reason,
      },
    };
  }

  try {
    const rawRows = await sequelize.query(validation.sql, {
      type: QueryTypes.SELECT,
    });
    return { sql: validation.sql, rawRows };
  } catch (execErr) {
    const { category, message } = categorizeExecutionError(execErr);
    return {
      error: { category, message },
      sql: validation.sql,
    };
  }
}

async function runNaturalLanguageQuery({ userId, query, rerunSql }) {
  const naturalLanguageQuery = String(query).trim();

  let sqlQuery = rerunSql ? String(rerunSql).trim() : null;

  if (!sqlQuery) {
    const resolved = await resolveSqlFromNaturalLanguage(naturalLanguageQuery);
    if (resolved.error) {
      return { ok: false, ...resolved.error, naturalLanguageQuery, generatedSql: null };
    }
    sqlQuery = resolved.sqlQuery;
  }

  const exec = await executeValidatedSelect(sqlQuery);
  if (exec.error) {
    return {
      ok: false,
      category: exec.error.category,
      message: exec.error.message,
      naturalLanguageQuery,
      generatedSql: exec.sql || sqlQuery,
    };
  }

  const results = serializeResults(exec.rawRows);
  const resultMeta = buildVisualizationMeta(results);

  let explanation = await llmExplain(exec.sql);
  if (!explanation || explanation.includes('not available')) {
    explanation = explainSQL(exec.sql);
  }

  let queryHistoryId = null;
  try {
    const row = await QueryHistory.create({
      userId,
      naturalLanguageQuery,
      generatedSql: exec.sql,
      explanation: explanation || '',
    });
    queryHistoryId = row.id;
  } catch (histErr) {
    console.error('QueryHistory save failed:', histErr.message);
  }

  return {
    ok: true,
    naturalLanguageQuery,
    sql: exec.sql,
    results,
    explanation,
    resultMeta,
    queryHistoryId,
  };
}

module.exports = {
  runNaturalLanguageQuery,
  sendQueryError,
  executeValidatedSelect,
};
