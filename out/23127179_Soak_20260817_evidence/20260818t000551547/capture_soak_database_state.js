'use strict';

const fs = require('fs');
const path = require('path');

function parseArguments(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    if (!argv[index]?.startsWith('--') || argv[index + 1] === undefined) {
      throw new Error(`Invalid argument near ${argv[index] || '<end>'}`);
    }
    result[argv[index].slice(2)] = argv[index + 1];
  }
  return result;
}

function getRow(database, sql, parameters = []) {
  return new Promise((resolve, reject) => {
    database.get(sql, parameters, (error, row) => {
      if (error) {
        reject(error);
      } else {
        resolve(row);
      }
    });
  });
}

function closeDatabase(database) {
  return new Promise((resolve, reject) => {
    database.close((error) => (error ? reject(error) : resolve()));
  });
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  if (!args.database || !args.output || !args.label) {
    throw new Error('Required arguments: --database <path> --output <path> --label <before|after>');
  }
  const databasePath = path.resolve(args.database);
  const outputPath = path.resolve(args.output);
  const repositoryRoot = path.resolve(__dirname, '..');
  const sqlite3 = require(path.join(repositoryRoot, 'eshop-sut', 'backend', 'node_modules', 'sqlite3'));
  const file = fs.statSync(databasePath);
  const database = new sqlite3.Database(databasePath, sqlite3.OPEN_READONLY);

  try {
    const tableRows = await new Promise((resolve, reject) => {
      database.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (error, rows) => {
        if (error) {
          reject(error);
        } else {
          resolve(rows);
        }
      });
    });
    const tables = tableRows.map((row) => row.name);
    const counts = {};
    for (const table of ['users', 'orders']) {
      if (tables.includes(table)) {
        const row = await getRow(database, `SELECT COUNT(*) AS count FROM "${table}"`);
        counts[table] = Number(row.count);
      }
    }
    const result = {
      label: args.label,
      captured_at_utc: new Date().toISOString(),
      database_path: databasePath,
      database_bytes: file.size,
      read_only: true,
      tables,
      counts,
      interpretation: 'Factual state only; no causal diagnosis is performed.',
    };
    fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } finally {
    await closeDatabase(database);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
