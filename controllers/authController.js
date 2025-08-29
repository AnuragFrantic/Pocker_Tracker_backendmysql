const db = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = db.User;







// Register new user
exports.register = async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone, session_points = 10 } = req.body;

        // Check if email exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered", error: false });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        let imagePath = null;
        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`;
        }


        const user = await User.create({
            first_name,
            last_name,
            email,
            phone,
            password: hashedPassword,
            session_points,
            image: imagePath
        });

        // Return without password
        const { password: _, ...userData } = user.toJSON();

        res.status(201).json({
            message: "✅ User registered successfully",
            data: userData, error: true
        });
    } catch (err) {
        res.status(500).json({ message: err.message, error: false });
    }
};




exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password", error: false });
        }

        // compare password with hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password", error: false });
        }

        // generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email }, // 👈 keep 'id' (not user_id)
            process.env.JWT_SECRET || "mysecretkey",
            { expiresIn: "1h" }
        );

        res.json({
            message: "✅ Login successful",
            data: {
                _id: user._id,
                first_name: user.first_name,
                email: user.email
            },
            token,
            error: true
        });
    } catch (err) {
        console.error("❌ Login error:", err);
        res.status(500).json({ message: "Internal server error", error: false });
    }
};

