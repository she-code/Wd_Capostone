const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

module.exports = {
  development: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.DEVELOPMENT_DB,
    host: process.env.DB_HOST,
    dialect: "postgres",
  },
  test: {
    username: "postgres",
    password: "12345678",
    database: "wd-election-test",
    host: "127.0.0.1",
    dialect: "postgres",
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
  },
};
