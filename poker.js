const express = require("express");
const db = require("./config/db");
const authRoutes = require("./routes/authroutes");
const cors = require("cors");
const masterRoutes = require("./routes/masterRoutes");







const app = express();

//  Enable CORS
// app.use(cors({
//     origin: ["http://localhost:5173", "http://storo.doc24.care/"],
//     credentials: true
// }));

const allowedOrigins = ["http://localhost:5173", "http://storo.doc24.care"];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // allow non-browser requests like Postman
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Handle preflight requests
app.options("*", cors({
    origin: allowedOrigins,
    credentials: true,
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
    console.log(" Database synced");
});

app.listen(3420, () => console.log("🚀 Server running on http://localhost:3420"));
