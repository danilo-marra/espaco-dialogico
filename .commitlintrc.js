module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [1, "always", 100],
    "footer-max-line-length": [1, "always", 100],
    "header-max-length": [2, "always", 100], // Example rule adjustment
    // Add or adjust other rules as needed
  },
  ignores: [
    // Ignora mensagens de commit de merge
    (commit) => commit.includes("Merge pull request"),
  ],
};
