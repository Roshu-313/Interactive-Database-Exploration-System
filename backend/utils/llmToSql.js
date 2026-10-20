const axios = require("axios");

async function llmToSql(userQuery) {
  try {
    const prompt = `
You are an expert SQL generator.

Database schema:
Table: users
Columns: id, name, email, password, role, createdAt, updatedAt

Rules:
- Only generate SELECT queries
- No DELETE, UPDATE, INSERT
- Return ONLY SQL query
- No explanation, no extra text

User Query:
"${userQuery}"
`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: "You generate safe SQL queries." },
          { role: "user", content: prompt }
        ],
        temperature: 0,
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let sql = response.data.choices[0].message.content.trim();

    // 🔥 CLEAN RESPONSE (IMPORTANT)
    // Remove ```sql ``` or extra text if model adds it
    sql = sql.replace(/```sql|```/g, "").trim();

    return sql;

  } catch (error) {
    console.error("Groq API Error:", error.response?.data || error.message);
    return null;
  }
}

module.exports = llmToSql;