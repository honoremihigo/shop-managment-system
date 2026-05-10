const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: "mysql",

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },

  // Logging configuration
  logging: (msg) => {
    if (process.env.NODE_ENV === "development") {
      console.log("SQL:", msg);
    }
  },

  // Global model options
  define: {
    timestamps: true,
    underscored: true,
    paranoid: false,
  },

  // ✅ Dialect options - MOVED OUTSIDE define
  dialectOptions: {
    decimalNumbers: true,
    dateStrings: true,
    typeCast: true,
    ...(process.env.NODE_ENV === "production" && {
      ssl: {
        rejectUnauthorized: false,
      },
    }),
  },
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connection has been established successfully.");
    return true;
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error.message);
    return false;
  }
};

// Sync database
const syncDatabase = async (force = false) => {
  const isProduction = process.env.NODE_ENV === "production";
  try {
    await sequelize.sync({
      force: isProduction ? false : force,
      alter: isProduction ? false : !force,
    });
    console.log("✅ All models were synchronized successfully.");
    return true;
  } catch (error) {
    console.error("❌ Unable to synchronize the database:", error.message);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};
