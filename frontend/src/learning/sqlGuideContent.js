export const GUIDE_SECTIONS = [
  { id: "intro", label: "Introduction" },
  { id: "concepts", label: "Basic concepts" },
  { id: "examples", label: "Query examples" },
  { id: "structure", label: "Query structure" },
  { id: "beginners", label: "Beginner support" },
];

export const SAMPLE_SCHEMA = {
  description:
    "Examples in this guide use a small university schema: students, courses, and enrollments.",
  tables: [
    {
      name: "students",
      columns: ["id", "name", "age", "major", "gpa"],
      rows: [
        { id: 1, name: "Amina", age: 20, major: "Computer Science", gpa: 3.7 },
        { id: 2, name: "Bilal", age: 19, major: "Mathematics", gpa: 3.2 },
        { id: 3, name: "Chen", age: 22, major: "Computer Science", gpa: 3.9 },
      ],
    },
    {
      name: "courses",
      columns: ["id", "title", "credits", "department"],
      rows: [
        { id: 101, title: "Databases", credits: 3, department: "CS" },
        { id: 102, title: "Calculus I", credits: 4, department: "Math" },
        { id: 103, title: "Algorithms", credits: 3, department: "CS" },
      ],
    },
    {
      name: "enrollments",
      columns: ["id", "student_id", "course_id", "grade"],
      rows: [
        { id: 1, student_id: 1, course_id: 101, grade: "A" },
        { id: 2, student_id: 1, course_id: 103, grade: "B" },
        { id: 3, student_id: 2, course_id: 102, grade: "A" },
        { id: 4, student_id: 3, course_id: 101, grade: "A" },
      ],
    },
  ],
};

export const INTRO_TOPICS = [
  {
    id: "what-is-sql",
    title: "What is SQL?",
    body: "SQL (Structured Query Language) is the standard language for asking questions of a relational database. You write a statement that describes the data you want, and the database engine finds matching rows. You do not tell the computer how to walk the files — you describe the result.",
    example:
      "Think of SQL as a precise question: “Show me the names of Computer Science students older than 18.”",
  },
  {
    id: "what-is-database",
    title: "What is a database?",
    body: "A database is an organized collection of related data. IDES works with MySQL, a relational database: information is stored in tables that can be linked together. The database keeps data consistent, searchable, and shared among many users.",
    example:
      "A university database might store students, courses, and which students are enrolled in which courses.",
  },
  {
    id: "what-is-table",
    title: "What is a table?",
    body: "A table is a named grid of data, similar to a spreadsheet. Each table represents one kind of thing — for example, one row per student. Tables have a fixed set of columns (fields) and any number of rows (records).",
    example: "The students table has columns id, name, age, major, and gpa.",
  },
  {
    id: "rows-columns",
    title: "Rows and columns",
    body: "A column is a named attribute with a data type (text, number, date). A row is one complete record. The intersection of a row and a column is a single value, such as Amina’s GPA of 3.7.",
    example:
      "Column major holds the same kind of value for every student. One row is everything we know about Amina.",
  },
  {
    id: "sql-uses",
    title: "What SQL is used for",
    body: "SQL is used to retrieve, summarize, and (in some systems) change data. In IDES, live query execution is limited to read-only SELECT statements so exploration cannot accidentally change production data. INSERT, UPDATE, and DELETE still matter as concepts — they add, change, or remove rows — but they are shown here only as learning examples.",
    example:
      "Typical student tasks: list records, filter by a condition, join related tables, and compute counts or averages.",
  },
  {
    id: "how-sql-talks",
    title: "How SQL talks to the database",
    body: "Your application (or IDES) sends a SQL text string to MySQL. The server parses the statement, checks permissions, plans how to read the tables, then returns a result set — column names plus rows. If the statement is invalid, MySQL returns an error instead of rows.",
    example:
      "In IDES you usually type a question in English. The system generates SQL, explains it, and only then runs a safe SELECT against MySQL.",
  },
];

export const CONCEPT_LESSONS = [
  {
    id: "select",
    name: "SELECT",
    mutating: false,
    summary: "Chooses which columns (or expressions) appear in the result.",
    explanation:
      "SELECT is the starting point of almost every read query. List column names separated by commas, or use * to return every column. You can also compute values, such as COUNT(*) or gpa * 4. SELECT never changes stored data; it only describes the output.",
    syntax: "SELECT column1, column2\nFROM table_name;",
    exampleSql: "SELECT name, major\nFROM students;",
    exampleExplanation:
      "This asks MySQL for two columns from every row in students. The table still contains age and gpa, but they are omitted from the result.",
    result: {
      caption: "Illustrative result",
      columns: ["name", "major"],
      rows: [
        { name: "Amina", major: "Computer Science" },
        { name: "Bilal", major: "Mathematics" },
        { name: "Chen", major: "Computer Science" },
      ],
    },
  },
  {
    id: "from",
    name: "FROM",
    mutating: false,
    summary: "Names the table (or joined tables) that supply the rows.",
    explanation:
      "FROM tells the database where the data lives. A simple query uses one table. More advanced queries list several tables connected with JOIN. Aliases (FROM students AS s) shorten names in longer statements.",
    syntax: "SELECT columns\nFROM table_name;",
    exampleSql: "SELECT title, credits\nFROM courses;",
    exampleExplanation:
      "FROM courses means every row is drawn from the courses table. SELECT then keeps only title and credits.",
    result: {
      caption: "Illustrative result",
      columns: ["title", "credits"],
      rows: [
        { title: "Databases", credits: 3 },
        { title: "Calculus I", credits: 4 },
        { title: "Algorithms", credits: 3 },
      ],
    },
  },
  {
    id: "where",
    name: "WHERE",
    mutating: false,
    summary: "Keeps only rows that match a condition.",
    explanation:
      "WHERE filters rows before grouping or aggregation. Common operators include =, <>, >, <, >=, <=, LIKE, IN, BETWEEN, IS NULL, AND, and OR. String comparisons in MySQL are case-insensitive for most collations, but you should still write clear, exact values.",
    syntax: "SELECT columns\nFROM table_name\nWHERE condition;",
    exampleSql: "SELECT name, age\nFROM students\nWHERE age > 18;",
    exampleExplanation:
      "Each student row is tested. Ages 20, 19, and 22 all pass age > 18, so all three sample students appear. A student aged 17 would be excluded.",
    result: {
      caption: "Illustrative result",
      columns: ["name", "age"],
      rows: [
        { name: "Amina", age: 20 },
        { name: "Bilal", age: 19 },
        { name: "Chen", age: 22 },
      ],
    },
  },
  {
    id: "order-by",
    name: "ORDER BY",
    mutating: false,
    summary: "Sorts the result rows.",
    explanation:
      "Without ORDER BY, MySQL may return rows in any order. ASC is the default (A–Z, smallest first). DESC reverses the order. You can sort by several columns: first by major, then by name. ORDER BY runs after WHERE and grouping.",
    syntax: "SELECT columns\nFROM table_name\nORDER BY column ASC | DESC;",
    exampleSql: "SELECT name, gpa\nFROM students\nORDER BY gpa DESC;",
    exampleExplanation:
      "Students are listed from highest GPA to lowest: Chen (3.9), Amina (3.7), then Bilal (3.2).",
    result: {
      caption: "Illustrative result",
      columns: ["name", "gpa"],
      rows: [
        { name: "Chen", gpa: 3.9 },
        { name: "Amina", gpa: 3.7 },
        { name: "Bilal", gpa: 3.2 },
      ],
    },
  },
  {
    id: "group-by",
    name: "GROUP BY",
    mutating: false,
    summary: "Collapses rows that share the same value into one group.",
    explanation:
      "GROUP BY is used with aggregate functions. Each unique combination of grouped columns becomes one output row. Any non-aggregated column in SELECT must appear in GROUP BY (MySQL’s ONLY_FULL_GROUP_BY mode).",
    syntax: "SELECT column, AGG(column)\nFROM table_name\nGROUP BY column;",
    exampleSql:
      "SELECT major, COUNT(*) AS student_count\nFROM students\nGROUP BY major;",
    exampleExplanation:
      "Rows are bundled by major. Computer Science has two students; Mathematics has one. COUNT(*) tallies rows in each group.",
    result: {
      caption: "Illustrative result",
      columns: ["major", "student_count"],
      rows: [
        { major: "Computer Science", student_count: 2 },
        { major: "Mathematics", student_count: 1 },
      ],
    },
  },
  {
    id: "having",
    name: "HAVING",
    mutating: false,
    summary: "Filters groups after aggregation.",
    explanation:
      "WHERE cannot see aggregate results because it runs before GROUP BY. HAVING runs afterwards, so you can keep groups that meet a summary condition such as COUNT(*) > 1 or AVG(gpa) >= 3.5.",
    syntax:
      "SELECT column, AGG(column)\nFROM table_name\nGROUP BY column\nHAVING condition;",
    exampleSql:
      "SELECT major, COUNT(*) AS student_count\nFROM students\nGROUP BY major\nHAVING COUNT(*) > 1;",
    exampleExplanation:
      "After grouping, only majors with more than one student remain. Computer Science (2) is kept; Mathematics (1) is dropped.",
    result: {
      caption: "Illustrative result",
      columns: ["major", "student_count"],
      rows: [{ major: "Computer Science", student_count: 2 }],
    },
  },
  {
    id: "limit",
    name: "LIMIT",
    mutating: false,
    summary: "Restricts how many rows are returned.",
    explanation:
      "LIMIT n returns at most n rows. Combine with ORDER BY so the “first” rows are meaningful (for example, the ten newest records). OFFSET skips rows and is useful for paging. IDES often uses LIMIT to keep result sets manageable.",
    syntax: "SELECT columns\nFROM table_name\nLIMIT n;",
    exampleSql: "SELECT name, gpa\nFROM students\nORDER BY gpa DESC\nLIMIT 2;",
    exampleExplanation:
      "Students are sorted by GPA descending, then only the first two rows are kept: Chen and Amina.",
    result: {
      caption: "Illustrative result",
      columns: ["name", "gpa"],
      rows: [
        { name: "Chen", gpa: 3.9 },
        { name: "Amina", gpa: 3.7 },
      ],
    },
  },
  {
    id: "distinct",
    name: "DISTINCT",
    mutating: false,
    summary: "Removes duplicate values from the result.",
    explanation:
      "SELECT DISTINCT returns unique combinations of the listed columns. It is useful for “what values exist?” questions. DISTINCT is not a substitute for GROUP BY when you also need counts or averages.",
    syntax: "SELECT DISTINCT column\nFROM table_name;",
    exampleSql: "SELECT DISTINCT major\nFROM students;",
    exampleExplanation:
      "Two students share Computer Science, but DISTINCT lists that major only once.",
    result: {
      caption: "Illustrative result",
      columns: ["major"],
      rows: [{ major: "Computer Science" }, { major: "Mathematics" }],
    },
  },
  {
    id: "insert",
    name: "INSERT",
    mutating: true,
    summary: "Adds new rows to a table.",
    explanation:
      "INSERT INTO names the table and the columns you are filling, then VALUES supplies one or more rows. Columns with defaults or AUTO_INCREMENT can be omitted. INSERT changes stored data. IDES will not run INSERT against your database; this example is for learning only.",
    syntax:
      "INSERT INTO table_name (column1, column2)\nVALUES (value1, value2);",
    exampleSql:
      "INSERT INTO students (name, age, major, gpa)\nVALUES ('Dina', 21, 'Physics', 3.4);",
    exampleExplanation:
      "A new student named Dina would be added. MySQL would assign the next id if id is AUTO_INCREMENT. This statement is not executed in IDES.",
    resultNote:
      "If it ran, students would gain a fourth row for Dina. IDES blocks this class of statement on the live query path.",
  },
  {
    id: "update",
    name: "UPDATE",
    mutating: true,
    summary: "Changes values in existing rows.",
    explanation:
      "UPDATE table SET column = value WHERE condition. Always include a WHERE clause unless you truly intend to change every row. UPDATE modifies data. IDES will not execute UPDATE statements.",
    syntax: "UPDATE table_name\nSET column = value\nWHERE condition;",
    exampleSql: "UPDATE students\nSET gpa = 3.8\nWHERE name = 'Amina';",
    exampleExplanation:
      "Only Amina’s GPA would change from 3.7 to 3.8. Without WHERE, every student’s GPA would become 3.8.",
    resultNote:
      "Learning example only. The live IDES executor accepts SELECT (read) queries, not UPDATE.",
  },
  {
    id: "delete",
    name: "DELETE",
    mutating: true,
    summary: "Removes rows from a table.",
    explanation:
      "DELETE FROM table WHERE condition removes matching rows but keeps the table itself. DELETE without WHERE removes all rows. Contrast this with DROP TABLE, which removes the table definition. IDES will not execute DELETE.",
    syntax: "DELETE FROM table_name\nWHERE condition;",
    exampleSql: "DELETE FROM enrollments\nWHERE student_id = 2;",
    exampleExplanation:
      "Bilal’s enrollment in Calculus I would be removed. The students and courses tables would be unchanged.",
    resultNote:
      "Learning example only. Use SELECT to inspect data in IDES; never rely on this guide to delete production rows.",
  },
  {
    id: "join",
    name: "JOIN",
    mutating: false,
    summary: "Combines rows from related tables.",
    explanation:
      "Relational data is split across tables and connected by keys. JOIN reconstructs a wider row. INNER JOIN keeps matches only. LEFT JOIN keeps every row from the left table and fills missing right-side columns with NULL. Always write an ON condition that compares related keys.",
    syntax:
      "SELECT columns\nFROM table_a\nINNER JOIN table_b\n  ON table_a.id = table_b.a_id;",
    exampleSql:
      "SELECT s.name, c.title, e.grade\nFROM students AS s\nINNER JOIN enrollments AS e\n  ON s.id = e.student_id\nINNER JOIN courses AS c\n  ON c.id = e.course_id;",
    exampleExplanation:
      "Each enrollment is matched to its student and course. The result is a readable list of who took which class and what grade they received.",
    result: {
      caption: "Illustrative result",
      columns: ["name", "title", "grade"],
      rows: [
        { name: "Amina", title: "Databases", grade: "A" },
        { name: "Amina", title: "Algorithms", grade: "B" },
        { name: "Bilal", title: "Calculus I", grade: "A" },
        { name: "Chen", title: "Databases", grade: "A" },
      ],
    },
  },
  {
    id: "aggregates",
    name: "COUNT, SUM, AVG, MIN, MAX",
    mutating: false,
    summary: "Summarize many rows into a single statistic.",
    explanation:
      "Aggregate functions collapse a set of values. COUNT(*) counts rows. COUNT(column) counts non-NULL values in that column. SUM adds numbers. AVG returns the mean. MIN and MAX return extremes. Use them alone for a single summary, or with GROUP BY for a summary per category.",
    syntax:
      "SELECT COUNT(*) AS n,\n       AVG(column) AS average_value\nFROM table_name;",
    exampleSql:
      "SELECT COUNT(*) AS student_count,\n       AVG(gpa) AS average_gpa,\n       MIN(gpa) AS lowest_gpa,\n       MAX(gpa) AS highest_gpa\nFROM students;",
    exampleExplanation:
      "One output row describes the whole table: three students, average GPA about 3.60, lowest 3.2, highest 3.9.",
    result: {
      caption: "Illustrative result",
      columns: ["student_count", "average_gpa", "lowest_gpa", "highest_gpa"],
      rows: [
        {
          student_count: 3,
          average_gpa: 3.6,
          lowest_gpa: 3.2,
          highest_gpa: 3.9,
        },
      ],
    },
  },
];

export const EXAMPLE_CATEGORIES = [
  "Basic Queries",
  "Filtering",
  "Sorting",
  "Aggregate Functions",
  "Grouping",
  "Joins",
  "Advanced Queries",
];

export const QUERY_EXAMPLES = [
  {
    id: "ex-all-students",
    category: "Basic Queries",
    title: "List every student",
    description: "Return all columns for every row in students.",
    sql: "SELECT *\nFROM students;",
    explanation:
      "The star means “all columns.” Use this to inspect a table, then switch to named columns in finished queries for clarity.",
    expected:
      "Three rows with id, name, age, major, and gpa for Amina, Bilal, and Chen.",
  },
  {
    id: "ex-selected-columns",
    category: "Basic Queries",
    title: "Select specific columns",
    description: "Return only names and majors.",
    sql: "SELECT name, major\nFROM students;",
    explanation:
      "Listing columns reduces noise and is safer than SELECT * when tables grow extra fields.",
    expected: "Three rows: Amina / Computer Science, Bilal / Mathematics, Chen / Computer Science.",
  },
  {
    id: "ex-alias",
    category: "Basic Queries",
    title: "Rename a column with AS",
    description: "Present gpa under a clearer heading.",
    sql: "SELECT name, gpa AS grade_point_average\nFROM students;",
    explanation:
      "AS does not change the stored column name. It only labels the result set, which helps reports.",
    expected: "Same three students, with the second column titled grade_point_average.",
  },
  {
    id: "ex-where-equals",
    category: "Filtering",
    title: "Filter by an exact value",
    description: "Find Computer Science students.",
    sql: "SELECT name, major\nFROM students\nWHERE major = 'Computer Science';",
    explanation:
      "Text values use single quotes in MySQL. The condition is checked for every row.",
    expected: "Amina and Chen. Bilal is excluded because his major is Mathematics.",
  },
  {
    id: "ex-where-and",
    category: "Filtering",
    title: "Combine conditions with AND",
    description: "Students who are at least 20 and in Computer Science.",
    sql: "SELECT name, age, major\nFROM students\nWHERE age >= 20\n  AND major = 'Computer Science';",
    explanation:
      "AND requires both conditions. Amina (20, CS) and Chen (22, CS) match; Bilal fails the major test.",
    expected: "Amina and Chen.",
  },
  {
    id: "ex-where-in",
    category: "Filtering",
    title: "Match any value in a list",
    description: "Courses in CS or Math.",
    sql: "SELECT title, department\nFROM courses\nWHERE department IN ('CS', 'Math');",
    explanation:
      "IN is a readable alternative to several OR comparisons on the same column.",
    expected: "All three sample courses, because each department is CS or Math.",
  },
  {
    id: "ex-like",
    category: "Filtering",
    title: "Pattern match with LIKE",
    description: "Names that start with the letter A.",
    sql: "SELECT name\nFROM students\nWHERE name LIKE 'A%';",
    explanation:
      "% is a wildcard for any number of characters. LIKE 'A%' means “starts with A.”",
    expected: "Amina only.",
  },
  {
    id: "ex-order-name",
    category: "Sorting",
    title: "Sort names alphabetically",
    description: "List students from A to Z.",
    sql: "SELECT name, major\nFROM students\nORDER BY name ASC;",
    explanation:
      "ASC is optional because it is the default, but writing it makes intent obvious.",
    expected: "Amina, then Bilal, then Chen.",
  },
  {
    id: "ex-order-multi",
    category: "Sorting",
    title: "Sort by two columns",
    description: "Group by major, then sort names inside each major.",
    sql: "SELECT major, name\nFROM students\nORDER BY major ASC, name ASC;",
    explanation:
      "The first sort key is applied first. Ties are broken by the second key.",
    expected:
      "Computer Science rows (Amina, Chen), then Mathematics (Bilal).",
  },
  {
    id: "ex-top-gpa",
    category: "Sorting",
    title: "Highest GPA with LIMIT",
    description: "Find the student with the best GPA.",
    sql: "SELECT name, gpa\nFROM students\nORDER BY gpa DESC\nLIMIT 1;",
    explanation:
      "Sort descending so the largest GPA is first, then keep a single row.",
    expected: "Chen with 3.9.",
  },
  {
    id: "ex-count-all",
    category: "Aggregate Functions",
    title: "Count rows in a table",
    description: "How many students are stored?",
    sql: "SELECT COUNT(*) AS student_count\nFROM students;",
    explanation:
      "COUNT(*) counts rows, including those with NULL in some columns.",
    expected: "One row: student_count = 3.",
  },
  {
    id: "ex-avg-gpa",
    category: "Aggregate Functions",
    title: "Average GPA",
    description: "Compute the mean grade point average.",
    sql: "SELECT AVG(gpa) AS average_gpa\nFROM students;",
    explanation:
      "AVG ignores NULL values. All three sample GPAs are present, so the mean is (3.7 + 3.2 + 3.9) / 3.",
    expected: "average_gpa ≈ 3.6000.",
  },
  {
    id: "ex-sum-credits",
    category: "Aggregate Functions",
    title: "Total course credits",
    description: "Add every credits value in courses.",
    sql: "SELECT SUM(credits) AS total_credits\nFROM courses;",
    explanation:
      "SUM works only on numeric columns. 3 + 4 + 3 = 10.",
    expected: "total_credits = 10.",
  },
  {
    id: "ex-group-major",
    category: "Grouping",
    title: "Count students per major",
    description: "One summary row for each major.",
    sql: "SELECT major, COUNT(*) AS n\nFROM students\nGROUP BY major;",
    explanation:
      "GROUP BY major creates a bucket per unique major, then COUNT(*) fills n.",
    expected: "Computer Science → 2, Mathematics → 1.",
  },
  {
    id: "ex-having",
    category: "Grouping",
    title: "Keep large groups with HAVING",
    description: "Majors that have more than one student.",
    sql: "SELECT major, COUNT(*) AS n\nFROM students\nGROUP BY major\nHAVING COUNT(*) > 1;",
    explanation:
      "HAVING filters after grouping. WHERE could not use COUNT(*) because the count does not exist yet.",
    expected: "Only Computer Science with n = 2.",
  },
  {
    id: "ex-group-dept",
    category: "Grouping",
    title: "Average credits by department",
    description: "Summarize courses per department.",
    sql: "SELECT department, AVG(credits) AS avg_credits\nFROM courses\nGROUP BY department;",
    explanation:
      "CS courses are 3 and 3 credits; Math has a single 4-credit course.",
    expected: "CS → 3.0000, Math → 4.0000.",
  },
  {
    id: "ex-inner-join",
    category: "Joins",
    title: "Students and their courses",
    description: "Match enrollments to names and titles.",
    sql: "SELECT s.name, c.title, e.grade\nFROM students AS s\nINNER JOIN enrollments AS e\n  ON s.id = e.student_id\nINNER JOIN courses AS c\n  ON c.id = e.course_id;",
    explanation:
      "INNER JOIN drops students who have no enrollment. In the sample data everyone is enrolled, so four combined rows appear.",
    expected:
      "Amina–Databases–A, Amina–Algorithms–B, Bilal–Calculus I–A, Chen–Databases–A.",
  },
  {
    id: "ex-left-join",
    category: "Joins",
    title: "LEFT JOIN keeps unmatched left rows",
    description: "List every student even if they have no enrollment.",
    sql: "SELECT s.name, e.course_id, e.grade\nFROM students AS s\nLEFT JOIN enrollments AS e\n  ON s.id = e.student_id;",
    explanation:
      "If a student had no matching enrollment, course_id and grade would be NULL. That is the difference from INNER JOIN.",
    expected:
      "Four rows for the current sample (Amina twice). A student without enrollments would still appear once with NULL course fields.",
  },
  {
    id: "ex-join-filter",
    category: "Joins",
    title: "Join, then filter",
    description: "Who earned an A in Databases?",
    sql: "SELECT s.name, c.title, e.grade\nFROM students AS s\nINNER JOIN enrollments AS e\n  ON s.id = e.student_id\nINNER JOIN courses AS c\n  ON c.id = e.course_id\nWHERE c.title = 'Databases'\n  AND e.grade = 'A';",
    explanation:
      "Joins build the combined rows first (logically), then WHERE keeps Databases with grade A.",
    expected: "Amina and Chen.",
  },
  {
    id: "ex-subquery",
    category: "Advanced Queries",
    title: "Subquery for a threshold",
    description: "Students with GPA above the class average.",
    sql: "SELECT name, gpa\nFROM students\nWHERE gpa > (\n  SELECT AVG(gpa)\n  FROM students\n);",
    explanation:
      "The inner SELECT runs first and returns one number (about 3.6). The outer query then keeps rows with a higher gpa.",
    expected: "Amina (3.7) and Chen (3.9). Bilal (3.2) is below the average.",
  },
  {
    id: "ex-case",
    category: "Advanced Queries",
    title: "Classify rows with CASE",
    description: "Label GPA as High or Standard.",
    sql: "SELECT name,\n       gpa,\n       CASE\n         WHEN gpa >= 3.7 THEN 'High'\n         ELSE 'Standard'\n       END AS gpa_band\nFROM students;",
    explanation:
      "CASE is SQL’s if/else. It creates a computed column without changing stored data.",
    expected: "Amina High, Bilal Standard, Chen High.",
  },
  {
    id: "ex-union",
    category: "Advanced Queries",
    title: "Combine result sets with UNION",
    description: "A single name list from two similar queries.",
    sql: "SELECT name AS label\nFROM students\nUNION\nSELECT title AS label\nFROM courses;",
    explanation:
      "UNION stacks rows and removes duplicates. Both SELECTs must have the same number of columns and compatible types. UNION ALL would keep duplicates.",
    expected: "Student names and course titles in one column named label.",
  },
];

export const STRUCTURE_CLAUSES = [
  {
    id: "select",
    keyword: "SELECT",
    purpose: "List the columns or expressions you want to see.",
    orderNote: "Written first, evaluated after FROM / WHERE / GROUP BY in the logical plan.",
    snippet: "SELECT name, age",
  },
  {
    id: "from",
    keyword: "FROM",
    purpose: "Identify the source table (and later JOINs).",
    orderNote: "Logically first: the engine must know which rows exist.",
    snippet: "FROM students",
  },
  {
    id: "where",
    keyword: "WHERE",
    purpose: "Filter individual rows before grouping.",
    orderNote: "Applies to raw rows, not to aggregate results.",
    snippet: "WHERE age > 18",
  },
  {
    id: "group",
    keyword: "GROUP BY",
    purpose: "Bundle rows that share the same values.",
    orderNote: "Happens after WHERE; produces one row per group.",
    snippet: "GROUP BY major",
  },
  {
    id: "having",
    keyword: "HAVING",
    purpose: "Filter those groups using aggregates.",
    orderNote: "After GROUP BY; this is where COUNT/AVG conditions belong.",
    snippet: "HAVING COUNT(*) > 1",
  },
  {
    id: "order",
    keyword: "ORDER BY",
    purpose: "Sort the final rows.",
    orderNote: "After HAVING; does not change which rows qualify.",
    snippet: "ORDER BY name ASC",
  },
  {
    id: "limit",
    keyword: "LIMIT",
    purpose: "Keep only the first n sorted rows.",
    orderNote: "Last step of a typical SELECT.",
    snippet: "LIMIT 10",
  },
];

export const STRUCTURE_WALKTHROUGH = {
  title: "A complete query, step by step",
  sql: "SELECT name, age\nFROM students\nWHERE age > 18\nORDER BY name ASC\nLIMIT 10;",
  steps: [
    {
      title: "1. FROM students",
      body: "Start with every row in the students table (Amina, Bilal, Chen in the sample).",
    },
    {
      title: "2. WHERE age > 18",
      body: "Keep only students older than 18. All three sample students still qualify.",
    },
    {
      title: "3. SELECT name, age",
      body: "Drop unused columns such as major and gpa. Only name and age remain in the output shape.",
    },
    {
      title: "4. ORDER BY name ASC",
      body: "Sort remaining rows A–Z by name: Amina, Bilal, Chen.",
    },
    {
      title: "5. LIMIT 10",
      body: "Return at most ten rows. With three matches, all three are returned.",
    },
  ],
  logicalOrder:
    "MySQL’s logical processing order is roughly FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. That is why HAVING can use COUNT(*) but WHERE cannot.",
};

export const TERMINOLOGY = [
  {
    term: "Query",
    definition:
      "A SQL statement sent to the database, usually a SELECT that returns a result set.",
  },
  {
    term: "Result set",
    definition: "The table of rows and columns returned by a successful SELECT.",
  },
  {
    term: "Primary key",
    definition:
      "A column (or set of columns) that uniquely identifies each row, such as students.id.",
  },
  {
    term: "Foreign key",
    definition:
      "A column that points to a primary key in another table, such as enrollments.student_id.",
  },
  {
    term: "Schema",
    definition:
      "The blueprint of the database: table names, columns, types, and relationships.",
  },
  {
    term: "Alias",
    definition:
      "A short temporary name for a table or column (FROM students AS s).",
  },
  {
    term: "NULL",
    definition:
      "A missing value. NULL is not zero or an empty string. Test it with IS NULL, not = NULL.",
  },
  {
    term: "Clause",
    definition:
      "A named part of a statement, such as WHERE or ORDER BY.",
  },
];

export const BEGINNER_MISTAKES = [
  {
    title: "Forgetting quotes around text",
    detail:
      "WHERE major = Computer Science is invalid. Text literals need single quotes: 'Computer Science'. Numbers are unquoted.",
  },
  {
    title: "Using WHERE with aggregates",
    detail:
      "WHERE COUNT(*) > 1 fails. Filter groups with HAVING after GROUP BY.",
  },
  {
    title: "SELECT * in finished work",
    detail:
      "It is fine while exploring. Named columns make results stable when the table gains new fields.",
  },
  {
    title: "JOIN without ON",
    detail:
      "A missing join condition produces a Cartesian product: every row of A paired with every row of B.",
  },
  {
    title: "UPDATE or DELETE without WHERE",
    detail:
      "Every row would change. In IDES these statements are blocked, but the habit still matters outside this app.",
  },
  {
    title: "Confusing column names with values",
    detail:
      "WHERE 'major' = 'Computer Science' compares two strings and is almost never what you meant. Use the column name without quotes (or with backticks if needed).",
  },
];

export const READABILITY_TIPS = [
  "Write each major clause on its own line (SELECT, FROM, WHERE, ORDER BY).",
  "Indent JOIN … ON and AND / OR conditions so the eye can scan them.",
  "Prefer explicit column lists over SELECT * once you know the output you need.",
  "Give aggregates a name: COUNT(*) AS student_count.",
  "Use table aliases in joins (s, e, c) and qualify columns (s.name) to avoid ambiguity.",
  "Keep comments short with -- when a filter is not obvious.",
];

export const BEST_PRACTICES = [
  "Filter as early as you can with WHERE so fewer rows are joined and grouped.",
  "Match join columns that represent the same key (id to student_id), not unrelated fields.",
  "Pair ORDER BY with LIMIT when you want “top n” results.",
  "Treat INSERT, UPDATE, and DELETE as privileged operations; IDES exploration is SELECT-only.",
  "Check Schema Explorer before writing a query so column names and types are correct.",
  "Read the generated explanation on the Query page to confirm the SQL matches your question.",
];

export const CONFUSED_CONCEPTS = [
  {
    id: "where-vs-having",
    left: "WHERE",
    right: "HAVING",
    leftText:
      "Filters rows before grouping. Use it for ordinary column tests such as age > 18 or major = 'Mathematics'.",
    rightText:
      "Filters groups after aggregation. Use it for COUNT(*), SUM, AVG, and similar conditions.",
  },
  {
    id: "delete-vs-drop",
    left: "DELETE",
    right: "DROP",
    leftText:
      "Removes rows from a table. The table structure remains. DELETE FROM students WHERE id = 2; deletes one student.",
    rightText:
      "Removes the table itself (or a database). DROP TABLE students; destroys the table definition and all of its data.",
  },
  {
    id: "pk-vs-fk",
    left: "PRIMARY KEY",
    right: "FOREIGN KEY",
    leftText:
      "Uniquely identifies a row inside its own table. students.id is a primary key: no two students share it, and it is not NULL.",
    rightText:
      "Stores a reference to a primary key in another table. enrollments.student_id is a foreign key pointing at students.id.",
  },
  {
    id: "inner-vs-left",
    left: "INNER JOIN",
    right: "LEFT JOIN",
    leftText:
      "Keeps only row pairs that satisfy the ON condition. A student with no enrollment disappears from the result.",
    rightText:
      "Keeps every row from the left table. If there is no match, right-hand columns are NULL.",
  },
  {
    id: "count-star-vs-column",
    left: "COUNT(*)",
    right: "COUNT(column)",
    leftText:
      "Counts rows in the current group or table, including rows where some columns are NULL.",
    rightText:
      "Counts non-NULL values in that column only. COUNT(grade) ignores enrollments whose grade is missing.",
  },
];

export function searchGuide(query) {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { lessons: CONCEPT_LESSONS, examples: QUERY_EXAMPLES };
  }

  const hay = (parts) => parts.filter(Boolean).join(" ").toLowerCase();

  const lessons = CONCEPT_LESSONS.filter((lesson) =>
    hay([
      lesson.name,
      lesson.summary,
      lesson.explanation,
      lesson.syntax,
      lesson.exampleSql,
      lesson.exampleExplanation,
    ]).includes(q),
  );

  const examples = QUERY_EXAMPLES.filter((ex) =>
    hay([
      ex.title,
      ex.category,
      ex.description,
      ex.sql,
      ex.explanation,
      ex.expected,
    ]).includes(q),
  );

  return { lessons, examples };
}
