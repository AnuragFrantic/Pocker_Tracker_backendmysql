const express = require("express");
const db = require("./config/db");
const authRoutes = require("./routes/authroutes");
const cors = require("cors");
const masterRoutes = require("./routes/masterRoutes");







const app = express();

// ✅ Enable CORS
app.use(cors({
    origin: "http://localhost:5173", // your React app URL (Vite default)
    credentials: true
}));
app.use(express.json());

app.use('/uploads', express.static('uploads'));
// Routes

app.get('/', (req, res) => {
    res.send("Welcome to Pocker Tracker");
})

app.use("/auth", authRoutes);
app.use("/master", masterRoutes);




// Sync DB
db.sequelize.sync().then(() => {
    console.log("✅ Database synced");
});

app.listen(3420, () => console.log("🚀 Server running on http://localhost:3420"));
