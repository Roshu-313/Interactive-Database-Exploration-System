const axios = require('axios');
const { validateSqlSecuritySync } = require('./sqlSecurity');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function defaultAssistance(category, safeMessage) {
  const titles = {
    INVALID_INPUT: 'Missing or invalid question',
    QUERY_NOT_UNDERSTOOD: 'Could not translate your question',
    LLM_FAILURE: 'AI assistant unavailable',
    SECURITY_VIOLATION: 'Query blocked for safety',
    SQL_SYNTAX: 'SQL syntax problem',
    UNKNOWN_SCHEMA: 'Unknown table or column',
    INVALID_FILTER_OR_TYPE: 'Invalid filter or data type',
    DATABASE_ERROR: 'Database error',
    INTERNAL_ERROR: 'Something went wrong',
  };

  return {
    title: titles[category] || 'Query error',
    explanation:
      safeMessage ||
      'Something prevented your query from running. Try rephrasing your question.',
    likelyCause: null,
    suggestedNaturalLanguage: null,
    suggestedSql: null,
    suggestedSqlSafe: false,
    correctionRationale: null,
  };
}

function parseJsonFromContent(content) {
  if (!content || typeof content !== 'string') return null;
  let text = content.trim();
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function validateAssistancePayload(raw, category, safeMessage) {
  const fallback = defaultAssistance(category, safeMessage);
  if (!raw || typeof raw !== 'object') return fallback;

  const title =
    typeof raw.title === 'string' && raw.title.trim()
      ? raw.title.trim().slice(0, 120)
      : fallback.title;
  const explanation =
    typeof raw.explanation === 'string' && raw.explanation.trim()
      ? raw.explanation.trim().slice(0, 2000)
      : fallback.explanation;
  const likelyCause =
    typeof raw.likelyCause === 'string' && raw.likelyCause.trim()
      ? raw.likelyCause.trim().slice(0, 500)
      : null;
  const suggestedNaturalLanguage =
    typeof raw.suggestedNaturalLanguage === 'string' &&
    raw.suggestedNaturalLanguage.trim()
      ? raw.suggestedNaturalLanguage.trim().slice(0, 500)
      : null;

  let suggestedSql = null;
  let suggestedSqlSafe = false;

  if (
    typeof raw.suggestedSql === 'string' &&
    raw.suggestedSql.trim() &&
    category !== 'SECURITY_VIOLATION'
  ) {
    const candidate = raw.suggestedSql.trim().slice(0, 4000);
    const check = validateSqlSecuritySync(candidate);
    if (check.ok) {
      suggestedSql = check.sql;
      suggestedSqlSafe = true;
    }
  }

  const correctionRationale =
    typeof raw.correctionRationale === 'string' &&
    raw.correctionRationale.trim()
      ? raw.correctionRationale.trim().slice(0, 800)
      : null;

  return {
    title,
    explanation,
    likelyCause,
    suggestedNaturalLanguage,
    suggestedSql,
    suggestedSqlSafe,
    correctionRationale,
  };
}

/**
 * Groq-powered error assistance for failed NL→SQL runs.
 */
async function llmErrorCorrection({
  naturalLanguageQuery,
  generatedSql,
  errorCategory,
  safeErrorMessage,
  schemaSummary,
}) {
  const category = errorCategory || 'INTERNAL_ERROR';
  const safeMessage = safeErrorMessage || 'The query could not be completed.';

  if (!process.env.GROQ_API_KEY) {
    return defaultAssistance(category, safeMessage);
  }

  const schemaBlock = schemaSummary
    ? `\nDatabase schema (for context only):\n${schemaSummary}\n`
    : '';

  const prompt = `You help beginner SQL students recover from query errors in a teaching app.

Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "title": "short error title",
  "explanation": "simple explanation of what went wrong",
  "likelyCause": "likely cause or null",
  "suggestedNaturalLanguage": "rephrased question or null",
  "suggestedSql": "corrected SELECT only when appropriate or null",
  "correctionRationale": "why the fix may work or null"
}

Rules:
- Use simple English suitable for students new to SQL.
- suggestedSql must be a single SELECT statement only when you are confident; otherwise null.
- Never suggest INSERT, UPDATE, DELETE, DROP, or multiple statements.
- If the error is a security block, do NOT provide suggestedSql.
- Do not include passwords or secrets.

User question: ${JSON.stringify(String(naturalLanguageQuery || ''))}
Generated SQL (if any): ${JSON.stringify(generatedSql || null)}
Error category: ${category}
Safe error message: ${safeMessage}
${schemaBlock}`;

  try {
    const response = await axios.post(
      GROQ_URL,
      {
        model: MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You return strict JSON for SQL learning error recovery. No prose outside JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 25000,
      },
    );

    const content = response.data?.choices?.[0]?.message?.content;
    const parsed = parseJsonFromContent(content);
    return validateAssistancePayload(parsed, category, safeMessage);
  } catch (err) {
    console.error(
      'Groq error correction failed:',
      err.response?.data || err.message,
    );
    return defaultAssistance(category, safeMessage);
  }
}

module.exports = llmErrorCorrection;
