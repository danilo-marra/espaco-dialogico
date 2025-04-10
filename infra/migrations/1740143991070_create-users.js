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

    // Bcrypt maximum length is 60 characters (https://www.npmjs.com/package/bcrypt#hash-info).
    password: {
      type: "varchar(60)",
      notNull: true,
    },

    // Column to store the MFA secret
    mfa_secret: {
      type: "varchar(32)",
      notNull: false,
    },

    // Column to indicate if MFA is enabled
    is_mfa_enabled: {
      type: "boolean",
      notNull: true,
      default: false,
    },

    // Always use timestamptz for timestamps (https://justatheory.com/2012/04/postgres-use-timestamptz/).
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },

    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
};

exports.down = false;
