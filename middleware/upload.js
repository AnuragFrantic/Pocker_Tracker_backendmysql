
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// // Ensure uploads folder exists
// const uploadDir = path.join(__dirname, "../uploads");
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => cb(null, uploadDir),
//     filename: (req, file, cb) => {
//         const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//         cb(null, uniqueSuffix + path.extname(file.originalname));
//     },
// });

// //  Allow CSV + Images
// const fileFilter = (req, file, cb) => {
//     const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/pdf"];
//     const allowedCsvTypes = ["text/csv"];

//     if (
//         allowedImageTypes.includes(file.mimetype) ||
//         allowedCsvTypes.includes(file.mimetype) ||
//         file.originalname.toLowerCase().endsWith(".csv") // extra check for csv
//     ) {
//         cb(null, true);
//     } else {
//         cb(new Error("Only CSV, JPG, JPEG, and PNG files are allowed"), false);
//     }
// };

// module.exports = multer({ storage, fileFilter });



const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ Ensure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ✅ Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

// ✅ Allow Images, CSV, and PDF
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "text/csv",
        "application/pdf",
    ];

    const allowedExtensions = [".csv", ".jpg", ".jpeg", ".png", ".pdf"];

    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Only CSV, PDF, JPG, JPEG, and PNG files are allowed"), false);
    }
};

// ✅ Export configured multer instance
module.exports = multer({ storage, fileFilter });
