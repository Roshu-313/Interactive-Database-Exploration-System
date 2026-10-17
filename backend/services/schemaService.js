/**
 * Database schema introspection for Schema Explorer and future LLM tooling.
 * Uses Sequelize query interface + INFORMATION_SCHEMA (MySQL).
 */
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');

/** MySQL unquoted identifier: letters, digits, underscore; practical length cap */
const TABLE_NAME_RE = /^[a-zA-Z0-9_]{1,64}$/;

function isValidTableIdentifier(name) {
  return typeof name === 'string' && TABLE_NAME_RE.test(name);
}

function normalizeType(fieldDef) {
  if (!fieldDef || fieldDef.type == null) return 'UNKNOWN';
  const t = fieldDef.type;
  if (typeof t === 'string') return t;
  if (typeof t === 'object' && t.key) return t.key;
  try {
    return String(t);
  } catch {
    return 'UNKNOWN';
  }
}

async function listTableNames() {
  const qi = sequelize.getQueryInterface();
  const raw = await qi.showAllTables();
  const names = raw.map((entry) => {
    if (typeof entry === 'string') return entry;
    if (entry && typeof entry === 'object' && entry.tableName != null) {
      return String(entry.tableName);
    }
    return String(entry);
  });
  return [...new Set(names)].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );
}

async function resolveExistingTableName(requestedName) {
  if (!isValidTableIdentifier(requestedName)) {
    const err = new Error('Invalid table name');
    err.code = 'INVALID_TABLE_NAME';
    throw err;
  }
  const tables = await listTableNames();
  const exact = tables.find((t) => t === requestedName);
  if (exact) return exact;
  const ci = tables.find(
    (t) => t.toLowerCase() === requestedName.toLowerCase(),
  );
  if (ci) return ci;
  const err = new Error('Table not found');
  err.code = 'TABLE_NOT_FOUND';
  throw err;
}

/**
 * @returns {Promise<{ tables: string[], database: string }>}
 */
async function getTables() {
  const tables = await listTableNames();
  return {
    tables,
    database: sequelize.config.database,
  };
}

/**
 * @returns {Promise<{ table: string, columns: object[], primaryKeys: string[] }>}
 */
async function getTableDetails(tableName) {
  const canonicalName = await resolveExistingTableName(tableName);
  const described = await sequelize
    .getQueryInterface()
    .describeTable(canonicalName);

  const columns = Object.entries(described).map(([name, def]) => ({
    name,
    dataType: normalizeType(def),
    nullable: def.allowNull !== false,
    primaryKey: Boolean(def.primaryKey),
    autoIncrement: Boolean(def.autoIncrement),
    defaultValue:
      def.defaultValue === undefined ? null : def.defaultValue,
    unique: Boolean(def.unique),
  }));

  const primaryKeys = columns.filter((c) => c.primaryKey).map((c) => c.name);

  return {
    table: canonicalName,
    columns,
    primaryKeys,
  };
}

/**
 * Foreign keys visible to the connected MySQL user.
 * @returns {Promise<Array<{ fromTable: string, fromColumn: string, toTable: string, toColumn: string, constraintName: string }>>}
 */
async function getForeignKeyRelationships() {
  const schemaName = sequelize.config.database;
  if (!schemaName) {
    return [];
  }

  const rows = await sequelize.query(
    `
    SELECT
      k.TABLE_NAME AS fromTable,
      k.COLUMN_NAME AS fromColumn,
      k.REFERENCED_TABLE_NAME AS toTable,
      k.REFERENCED_COLUMN_NAME AS toColumn,
      k.CONSTRAINT_NAME AS constraintName
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
    INNER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
      ON k.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
      AND k.TABLE_NAME = tc.TABLE_NAME
      AND k.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
    WHERE k.TABLE_SCHEMA = :schema
      AND tc.TABLE_SCHEMA = :schema
      AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
      AND k.REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY k.TABLE_NAME, k.ORDINAL_POSITION
    `,
    {
      replacements: { schema: schemaName },
      type: QueryTypes.SELECT,
    },
  );

  return rows.map((r) => ({
    fromTable: r.fromTable,
    fromColumn: r.fromColumn,
    toTable: r.toTable,
    toColumn: r.toColumn,
    constraintName: r.constraintName,
  }));
}

module.exports = {
  isValidTableIdentifier,
  listTableNames,
  getTables,
  getTableDetails,
  getForeignKeyRelationships,
};
