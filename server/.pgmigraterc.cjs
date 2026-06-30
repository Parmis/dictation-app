require('dotenv').config({ path: '../.env' });

const host = process.env.PGHOST || "localhost";
const port = process.env.PGPORT || "5432";
const db = process.env.PGDATABASE || "dictation";
const user = process.env.PGUSER || "dictation";
const pass = process.env.PGPASSWORD || "dictation";

module.exports = {
  databaseUrl: `postgresql://${user}:${pass}@${host}:${port}/${db}`,
  dir: "migrations",
  "migration-file-language": "cjs",
};
