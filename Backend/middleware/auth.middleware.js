const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {

    // Check for token in cookies
    let token;

    // First check if the token is in the Authorization header
    if(req.cookies && req.cookies.token){
        token = req.cookies.token;
    }
    // If not found in cookies, throw an error for missing token
    if(!token){
        return res.status(401).json({ message: "Not authorized, no token" });
    }

    try {
        // Verify token and attach user info to request
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Attach user info to request object
        req.user = decoded;
        // console.log("Decoded token:", decoded);
        //move to next middleware or route handler
        next();
    } catch (error) {
        return res.status(401).json({ message: "Not authorized, token failed" });
    }
};


//this an authorization middleware to check if the user has the required role(s) to access a route
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        // Check if user info is available in request (set by protect middleware)
        if (!req.user) {
            return res.status(401).json({ message: "Not authorized" });
        }
        // Check if user's role is in the allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        // User is authorized, move to next middleware or route handler
        next();
    };
};

module.exports = { protect, authorize };