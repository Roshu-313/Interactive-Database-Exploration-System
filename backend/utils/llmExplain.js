const axios = require("axios");

async function llmExplain(sqlQuery) {
  try {
    const prompt = `
You are a SQL teacher.

Explain the following SQL query to a beginner student in a clear and structured way.

Instructions:
- Return your answer ONLY in Markdown.
- Use proper Markdown headings (##), bullet points, and bold text.
- First, give a short "Purpose" of the query.
- Then explain ONLY the SQL clauses that are actually present in the query.
- Possible clauses include: SELECT, FROM, WHERE, GROUP BY, ORDER BY, LIMIT.
- Only include a section if that clause exists in the query.
- If there are conditions (AND / OR), explain them clearly under WHERE.
- If there are functions (like COUNT, SUM, TIMESTAMPDIFF), explain them in a "Functions" section.
- Use simple English.
- Do NOT repeat the SQL query.
- Do NOT include unnecessary sections.

SQL Query:
${sqlQuery}
`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You explain SQL queries simply." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let explanation = response.data.choices[0].message.content.trim();

    return explanation;

  } catch (error) {
    console.error("LLM Explain Error:", error.response?.data || error.message);
    return "Explanation not available.";
  }
}

module.exports = llmExplain;