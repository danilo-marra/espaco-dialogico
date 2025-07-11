exports.up = (pgm) => {
  pgm.addColumn("users", {
    token_version: {
      type: "integer",
      notNull: true,
      default: 0,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("users", "token_version");
};
