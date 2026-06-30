exports.up = (pgm) => {
  pgm.createTable("organizations", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    name: { type: "text", notNull: true },
    slug: { type: "text", notNull: true, unique: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.createTable("users", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    email: { type: "text", notNull: true },
    organization_id: { type: "uuid", notNull: true, references: "organizations" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("users", "email");

  pgm.createTable("organization_tokens", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    organization_id: { type: "uuid", notNull: true, references: "organizations" },
    token_hash: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    revoked_at: { type: "timestamptz" },
  });

  pgm.createTable("shortcodes", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    code: { type: "text", notNull: true, unique: true },
    user_id: { type: "uuid", notNull: true, references: "users" },
    organization_id: { type: "uuid", notNull: true, references: "organizations" },
    token_id: { type: "uuid", notNull: true, references: "organization_tokens" },
    used_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    expires_at: { type: "timestamptz", notNull: true },
  });
  pgm.createIndex("shortcodes", "code");
};

exports.down = (pgm) => {
  pgm.dropTable("shortcodes");
  pgm.dropTable("organization_tokens");
  pgm.dropTable("users");
  pgm.dropTable("organizations");
};
