const db = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = db.User;







// Register new user
// Register new user
// exports.register = async (req, res) => {
//     try {
//         const { first_name, last_name, email, password, phone, session_points = 10 } = req.body;



//         const existingUser = await User.findOne({
//             where: {
//                 [db.Sequelize.Op.or]: [
//                     { email },
//                     { phone }
//                 ]
//             }
//         });

//         if (existingUser) {
//             let msg = "User already registered.";
//             if (existingUser.email === email) {
//                 msg = "Email already registered.";
//             } else if (existingUser.phone === phone) {
//                 msg = "Phone number already registered.";
//             }
//             return res.status(400).json({ message: msg, error: true });
//         }

//         //  Hash password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         let imagePath = null;
//         if (req.file) {
//             imagePath = `/uploads/${req.file.filename}`;
//         }

//         //  Create user
//         const user = await User.create({
//             first_name,
//             last_name,
//             email,
//             phone,
//             password: hashedPassword,
//             session_points,
//             image: imagePath
//         });

//         //  Exclude password before sending response
//         const { password: _, ...userData } = user.toJSON();

//         const token = jwt.sign(
//             { id: user.id, email: user.email, type: user.type }, // 👈 keep 'id' (not user_id)
//             process.env.JWT_SECRET || "mysecretkey",
//             { expiresIn: "24h" }
//         );

//         res.status(201).json({
//             message: "User registered successfully",
//             data: userData,
//             token,
//             error: false
//         });


//     } catch (err) {
//         res.status(500).json({ message: err.message, error: true });
//     }
// };

exports.register = async (req, res) => {
    try {
        // Destructure required fields and collect any extra fields in `rest`
        let { first_name, last_name, email, password, phone, session_points = 10, ...rest } = req.body;

        // Normalize email to lowercase
        const normalizedEmail = email.toLowerCase();

        // Check if email or phone already exists (case-insensitive for email)
        const existingUser = await User.findOne({
            where: {
                [db.Sequelize.Op.or]: [
                    db.Sequelize.where(
                        db.Sequelize.fn('lower', db.Sequelize.col('email')),
                        normalizedEmail
                    ),
                    { phone }
                ]
            }
        });

        if (existingUser) {
            let msg = "User already registered.";
            if (existingUser.email.toLowerCase() === normalizedEmail) {
                msg = "Email already registered.";
            } else if (existingUser.phone === phone) {
                msg = "Phone number already registered.";
            }
            return res.status(400).json({ message: msg, error: true });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        let imagePath = null;
        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`;
        }

        // Create user, include extra fields from rest
        const user = await User.create({
            first_name,
            last_name,
            email: normalizedEmail,
            phone,
            password: hashedPassword,
            session_points,
            image: imagePath,
            ...rest // ✅ include extra fields like address, state, zipcode, etc.
        });

        // Exclude password from response
        const { password: _, ...userData } = user.toJSON();

        const token = jwt.sign(
            { id: user.id, email: user.email, type: user.type },
            process.env.JWT_SECRET || "mysecretkey",
            { expiresIn: "24h" }
        );

        res.status(201).json({
            message: "User registered successfully",
            data: userData,
            token,
            error: false
        });

    } catch (err) {
        res.status(500).json({ message: err.message, error: true });
    }
};







exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password", error: true });
        }

        // compare password with hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password", error: true });
        }

        // generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, type: user.type }, // 👈 keep 'id' (not user_id)
            process.env.JWT_SECRET || "mysecretkey",
            { expiresIn: "24h" }
        );

        res.json({
            message: " Login successful",
            data: {
                _id: user._id,
                first_name: user.first_name,
                email: user.email
            },
            token,
            error: false
        });
    } catch (err) {
        console.error(" Login error:", err);
        res.status(500).json({ message: "Internal server error", error: true });
    }
};

