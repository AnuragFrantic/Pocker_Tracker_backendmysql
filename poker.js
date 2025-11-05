const express = require("express");
const db = require("./config/db");
const authRoutes = require("./routes/authroutes");
const cors = require("cors");
const masterRoutes = require("./routes/masterRoutes");



const fs = require("fs");
const https = require("https");
const http = require("http");
const path = require('path')



const app = express();

app.use("/master/webhook", require("./routes/subscriptionRoutes"));

//  Enable CORS
// app.use(cors({
//     origin: ["http://localhost:5173", "http://storo.doc24.care/"],
//     credentials: true
// }));

const allowedOrigins = ["http://localhost:5173", "http://storo.doc24.care", "http://localhost:3420", "https://poker-admin-panel-dka8.vercel.app"];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
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
// db.sequelize.sync().then(() => {
//     console.log(" Database synced");
// });
// if you want to force update and drop the table
// db.sequelize.sync({ force: true }).then(() => {
//     console.log("Database synced (all tables dropped and recreated)");
// }).catch(err => {
//     console.error("Error syncing database:", err);
// });


// if you want to  update and dont drop the table
// db.sequelize.sync({ alter: true }).then(() => {
//     console.log("Database synced (tables altered if needed)");
// });



// const options = {
//     key: pvtkey,
//     cert: certificate,
// };
const options = {
    cert: fs.readFileSync('/etc/letsencrypt/live/rinsezone.com/fullchain.pem', 'utf-8'),
    key: fs.readFileSync('/etc/letsencrypt/live/rinsezone.com/privkey.pem', 'utf-8'),
};


https.createServer(options, app)
    .listen(3420, function (req, res) {
        console.log("Server started at port https : 3420");
    });

// app.listen(3420, () => console.log("🚀 Server running on http://localhost:3420"));


