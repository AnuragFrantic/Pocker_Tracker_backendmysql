const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "mysecretkey";

function Auth(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({ message: "No Authorization Header" });
    }

    try {
        const token = authorization.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Invalid Token Format" });
        }

        const decoded = jwt.verify(token, SECRET_KEY);


        //  Now matches the login payload
        req.user = { id: decoded.id, email: decoded.email, type: decoded.type };
        return next();

    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Session Expired", error: error.message });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: "Invalid Token", error: error.message });
        }

        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

module.exports = { Auth };
