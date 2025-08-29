const express = require("express");
const { login, register } = require("../controllers/authController");
const upload = require("../middleware/upload");

const router = express.Router();

router.post("/register", upload.single("image"), register);

router.post("/login", login);

module.exports = router;
