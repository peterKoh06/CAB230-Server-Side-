const db  = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// POST /ratings/debugEraseRatings
async function eraseRatings(req, res, next) {
  try {
    await db("ratings").del();
    res.json({ message: "All ratings successfully erased." });
  } catch (err) {
    next(err);
  }
}

// POST /user/debugLogin  — same as login but token expires in 1 second
async function debugLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: "Request body incomplete, both email and password are required",
      });
    }

    const user = await db("users").where("email", email).first();
    if (!user) {
      return res.status(401).json({ error: true, message: "Incorrect email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: true, message: "Incorrect email or password" });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: 1 });
    res.json({ token, tokenType: "Bearer", expiresIn: 1 });
  } catch (err) {
    next(err);
  }
}

module.exports = { eraseRatings, debugLogin };
