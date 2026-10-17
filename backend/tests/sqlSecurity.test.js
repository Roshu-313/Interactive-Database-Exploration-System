const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateSqlSecuritySync,
  validateSqlSchemaSync,
} = require('../utils/sqlSecurity');

test('allows simple SELECT', () => {
  const r = validateSqlSecuritySync('SELECT id, name FROM users');
  assert.equal(r.ok, true);
});

test('rejects DELETE', () => {
  const r = validateSqlSecuritySync('DELETE FROM users');
  assert.equal(r.ok, false);
});

test('rejects multiple statements', () => {
  const r = validateSqlSecuritySync('SELECT 1; DROP TABLE users');
  assert.equal(r.ok, false);
});

test('rejects unknown tables when schema list provided', () => {
  const r = validateSqlSchemaSync('SELECT * FROM secret_vault', ['users', 'query_histories']);
  assert.equal(r.ok, false);
});

test('allows known tables', () => {
  const r = validateSqlSchemaSync('SELECT * FROM users', ['users']);
  assert.equal(r.ok, true);
});
