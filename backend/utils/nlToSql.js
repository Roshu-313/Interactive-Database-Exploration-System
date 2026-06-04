function nlToSql(query) {
  const q = query.toLowerCase().trim();

  // Rule 1: Get all users
  if (
    q.includes('show all users') ||
    q.includes('get all users') ||
    q.includes('list users')
  ) {
    return 'SELECT * FROM users;';
  }

  // Rule 2: fallback
  return null;
}

module.exports = nlToSql;

