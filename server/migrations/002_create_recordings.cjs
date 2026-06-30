exports.up = (pgm) => {
  pgm.createTable("recordings", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    title: { type: "text", notNull: true, default: "" },
    text: { type: "text", notNull: true, default: "" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("recordings", "user_id");
};

exports.down = (pgm) => {
  pgm.dropTable("recordings");
};
