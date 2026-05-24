const db     = require("../db");
const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");

function signToken(email, expiresIn = "24h") {
  return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn });
}

function formatDob(dob) {
  if (!dob) return null;
  if (typeof dob === "string") return dob.slice(0, 10);
  const d = new Date(dob);
  return d.toISOString().slice(0, 10);
}

// POST /user/register
async function register(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: "Request body incomplete, both email and password are required",
      });
    }

    const existing = await db("users").where("email", email).first();
    if (existing) {
      return res.status(409).json({ error: true, message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    await db("users").insert({ email, password: hash });

    res.status(201).json({ message: "User created" });
  } catch (err) {
    next(err);
  }
}

// POST /user/login
async function login(req, res, next) {
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

    const token = signToken(email, "24h");
    res.json({ token, tokenType: "Bearer", expiresIn: 86400 });
  } catch (err) {
    next(err);
  }
}

// GET /user/:email/profile
async function getProfile(req, res, next) {
  try {
    const { email } = req.params;

    // Auth errors take priority — check BEFORE looking up user
    if (req.authError) {
      return res.status(req.authError.status).json(req.authError.body);
    }

    const user = await db("users").where("email", email).first();
    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    const isOwner = req.user && req.user.email === email;

    if (isOwner) {
      return res.json({
        email:     user.email,
        firstName: user.firstName || null,
        lastName:  user.lastName  || null,
        dob:       formatDob(user.dob),
        address:   user.address   || null,
      });
    }

    // Public — no dob or address
    return res.json({
      email:     user.email,
      firstName: user.firstName || null,
      lastName:  user.lastName  || null,
    });
  } catch (err) {
    next(err);
  }
}

// PUT /user/:email/profile
async function updateProfile(req, res, next) {
  try {
    const { email } = req.params;

    if (req.authError) {
      return res.status(req.authError.status).json(req.authError.body);
    }
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: "Authorization header ('Bearer token') not found",
      });
    }

    if (req.user.email !== email) {
      return res.status(403).json({ error: true, message: "Forbidden" });
    }

    const user = await db("users").where("email", email).first();
    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    const { firstName, lastName, dob, address } = req.body;

    if (firstName === undefined || lastName === undefined || dob === undefined || address === undefined) {
      return res.status(400).json({
        error: true,
        message: "Request body incomplete: firstName, lastName, dob and address are required.",
      });
    }

    if (typeof firstName !== "string" || typeof lastName !== "string" || typeof address !== "string" || typeof dob !== "string") {
      return res.status(400).json({
        error: true,
        message: "Request body invalid: firstName, lastName and address must be strings only.",
      });
    }

    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(dob)) {
      return res.status(400).json({
        error: true,
        message: "Invalid input: dob must be a real date in format YYYY-MM-DD.",
      });
    }

    const [year, month, day] = dob.split("-").map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    if (
      isNaN(dateObj.getTime()) ||
      dateObj.getUTCFullYear() !== year ||
      dateObj.getUTCMonth() + 1 !== month ||
      dateObj.getUTCDate() !== day
    ) {
      return res.status(400).json({
        error: true,
        message: "Invalid input: dob must be a real date in format YYYY-MM-DD.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj >= today) {
      return res.status(400).json({
        error: true,
        message: "Invalid input: dob must be a date in the past.",
      });
    }

    await db("users").where("email", email).update({ firstName, lastName, dob, address });

    res.json({ email, firstName, lastName, dob, address });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getProfile, updateProfile };