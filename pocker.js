const express = require("express");
const db = require("./config/db");
const authRoutes = require("./routes/authroutes");

const app = express();
app.use(express.json());

// Routes

app.get('/', (req, res) => {
    res.send("Welcome to Pocker Tracker");
})

app.use("/auth", authRoutes);



// Sync DB
db.sequelize.sync().then(() => {
    console.log("✅ Database synced");
});

app.listen(3420, () => console.log("🚀 Server running on http://localhost:3420"));
