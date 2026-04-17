const express = require("express")
const app = express()
const cors = require("cors")
const cookieParser = require("cookie-parser")
require('dotenv').config()
const { testConnection, syncDatabase } = require("./config/database")
const authRoutes = require("./modules/auth/auth.routes")
const productRoutes = require("./modules/product/product.routes")

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
    res.send("Hello World!")
})


//routes
app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)

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