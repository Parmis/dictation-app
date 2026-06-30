module.exports = {
  databaseUrl: {
    host: process.env.PGHOST || "localhost",
    port: parseInt(process.env.PGPORT || "5432", 10),
    database: process.env.PGDATABASE || "dictation",
    user: process.env.PGUSER || "dictation",
    password: process.env.PGPASSWORD || "dictation",
  },
  dir: "migrations",
  "migration-file-language": "cjs",
};
