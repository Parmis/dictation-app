import pg from "pg";
import { config } from "../config.js";

export const pool = new pg.Pool({
  host: config.pgHost,
  port: config.pgPort,
  database: config.pgDatabase,
  user: config.pgUser,
  password: config.pgPassword,
});
