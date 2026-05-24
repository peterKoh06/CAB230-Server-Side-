require("dotenv").config();

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: "mysql2",
    connection: {
      host:     process.env.DB_HOST     || "localhost",
      port:     parseInt(process.env.DB_PORT || "3306"),
      database: process.env.DB_NAME     || "rentals",
      user:     process.env.DB_USER     || "cab230user",
      password: process.env.DB_PASSWORD || "cab230pass",
    },
    pool: { min: 2, max: 10 },
    migrations: { tableName: "knex_migrations" },
  },

  production: {
    client: "mysql2",
    connection: {
      host:     process.env.DB_HOST     || "localhost",
      port:     parseInt(process.env.DB_PORT || "3306"),
      database: process.env.DB_NAME     || "rentals",
      user:     process.env.DB_USER     || "cab230user",
      password: process.env.DB_PASSWORD || "cab230pass",
    },
    pool: { min: 2, max: 10 },
    migrations: { tableName: "knex_migrations" },
  },
};
