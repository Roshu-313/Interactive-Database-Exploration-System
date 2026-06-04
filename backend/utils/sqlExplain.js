function explainSQL(sql) {
  const s = sql.toLowerCase().trim();

  if (s.startsWith('select')) {
    const fromIndex = s.indexOf('from');
    let table = '';
    if (fromIndex !== -1) {
      table = s.substring(fromIndex + 5).split(' ')[0]; // get table name
    }

    let explanation = `This query selects all columns from the '${table}' table.`;

    if (s.includes('where')) {
      const whereClause = s.split('where')[1].trim();
      explanation += ` It filters rows where ${whereClause}.`;
    }

    return explanation;
  }

  return 'Explanation not available for this query.';
}

module.exports = explainSQL;

