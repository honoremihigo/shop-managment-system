const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { testConnection, syncDatabase } = require("./config/database");
const sequelize = require("sequelize");

//import routes
const authRoutes = require("./modules/auth/auth.routes");
const productRoutes = require("./modules/product/product.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const stockRoutes = require("./modules/stock/stock.routes");
const salesRoutes = require("./modules/sales/sales.routes");
const purchaseRoutes = require("./modules/purchases/purchase.routes");
const reportRoutes = require("./modules/reports/report.routes");

//port
const PORT = process.env.PORT || 5000;

//import models
require("./models");

//use cors and json
const allowedOrigins = [
  "http://localhost:5173", // local development
  process.env.FRONTEND_URL, // production
  // add more as needed
];

app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("backend is running");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

//routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/reports", reportRoutes);

//starting server after db connection
const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    if (dbConnected) {
      await syncDatabase();
      // DB ping to keep Aiven active
      setInterval(
        async () => {
          try {
            await sequelize.query("SELECT 1");
            console.log("DB pinged");
          } catch (err) {
            console.error("DB ping failed:", err);
          }
        },
        8 * 60 * 1000,
      );

      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    } else {
      console.error("Failed to connect to the database. Server not started.");
    }
  } catch (error) {
    console.error("An error occurred while starting the server:", error);
  }
};

startServer();
