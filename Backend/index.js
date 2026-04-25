const express = require("express")
const app = express()
const cors = require("cors")
const cookieParser = require("cookie-parser")
require('dotenv').config()
const { testConnection, syncDatabase } = require("./config/database")

//import routes
const authRoutes = require("./modules/auth/auth.routes")
const productRoutes = require("./modules/product/product.routes")
const adminRoutes = require("./modules/admin/admin.routes")
const stockRoutes = require("./modules/stock/stock.routes")
const salesRoutes = require("./modules/sales/sales.routes")
const purchaseRoutes = require("./modules/purchases/purchase.routes")
const reportRoutes = require("./modules/reports/report.routes")

//port
const PORT = process.env.PORT || 5000

//import models
require("./models")

//use cors and json
app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_URL || "http://localhost:3000"
}))
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))

app.get("/", (req, res) => {
    res.send("backend is running")
})


//routes
app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/stocks",stockRoutes)
app.use("/api/sales",salesRoutes)
app.use("/api/purchases",purchaseRoutes)
app.use("/api/reports",reportRoutes)


//starting server after db connection
const startServer = async () => {
    try {
        const dbConnected = await testConnection();
        if (dbConnected) {
            await syncDatabase();
            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
            });
        } else {
            console.error("Failed to connect to the database. Server not started.");
        }
    } catch (error) {
        console.error("An error occurred while starting the server:", error);
    }
}


startServer()