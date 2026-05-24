const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return next(); // unauthenticated but not an error
  }

  if (!authHeader.startsWith("Bearer ")) {
    req.authError = {
      status: 401,
      body: { error: true, message: "Authorization header is malformed" },
    };
    return next();
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      req.authError = {
        status: 401,
        body: { error: true, message: "JWT token has expired" },
      };
    } else {
      req.authError = {
        status: 401,
        body: { error: true, message: "Invalid JWT token" },
      };
    }
    return next();
  }
}

function requireAuth(req, res, next) {
  if (req.authError) {
    return res.status(req.authError.status).json(req.authError.body);
  }
  if (!req.user) {
    return res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found",
    });
  }
  next();
}

module.exports = { authenticate, requireAuth };
