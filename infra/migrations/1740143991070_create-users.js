exports.up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    // Guide about migrations Ruby on Rails (https://guides.rubyonrails.org/active_record_migrations.html)

    // For reference, Github's username length limit is 39 characters.
    username: {
      type: "varchar(30)",
      notNull: true,
      unique: true,
    },

    // For reference, the maximum length of an email is 254 characters (https://stackoverflow.com/a/1199238).
    email: {
      type: "varchar(254)",
      notNull: true,
      unique: true,
    },

    // Bcrypt maximum length is 72 characters (https://security.stackexchange.com/a/39851).
    password: {
      type: "varchar(72)",
      notNull: true,
    },

    // Always use timestamptz for timestamps (https://justatheory.com/2012/04/postgres-use-timestamptz/).
    created_at: {
      type: "timestamptz",
      default: pgm.func("now()"),
    },

    updated_at: {
      type: "timestamptz",
      default: pgm.func("now()"),
    },
  });
};

exports.down = false;
