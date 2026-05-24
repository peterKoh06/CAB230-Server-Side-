const db = require("../db");

// GET /user/:email/profile
exports.getProfile = async (req, res) => {
  try {
    const email = req.params.email;
    const authUser = req.user ? req.user.email : null;

    const user = await db("users").where({ email }).first();

    if (!user) {
      return res.status(404).json({
        error: true,
        message: "User not found",
      });
    }

    const isOwner = authUser === email;

    const profile = {
      email: user.email,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
    };

    // Only the owner sees dob and address
    if (isOwner) {
      // Store dob as string in DB, so just echo it back
      profile.dob = user.dob ? user.dob : null;
      profile.address = user.address || null;
    }

    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ error: true, message: "Server error" });
  }
};

// PUT /user/:email/profile
exports.updateProfile = async (req, res) => {
  try {
    const email = req.params.email;
    const authUser = req.user ? req.user.email : null;

    // Unauthenticated user → 401
    if (!authUser) {
      return res.status(401).json({
        error: true,
        message: "Authentication required",
      });
    }

    // Authenticated but not the same user → 403
    if (authUser !== email) {
      return res.status(403).json({
        error: true,
        message: "Forbidden",
      });
    }

    const { firstName, lastName, dob, address } = req.body;

    if (!firstName || !lastName || !dob || !address) {
      return res.status(400).json({
        error: true,
        message:
          "Request body incomplete: firstName, lastName, dob and address are required.",
      });
    }

    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof address !== "string"
    ) {
      return res.status(400).json({
        error: true,
        message:
          "Request body invalid: firstName, lastName and address must be strings only.",
      });
    }

    // Validate DOB format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      return res.status(400).json({
        error: true,
        message:
          "Invalid input: dob must be a real date in format YYYY-MM-DD.",
      });
    }

    const parsed = new Date(dob);
    if (isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== dob) {
      return res.status(400).json({
        error: true,
        message:
          "Invalid input: dob must be a real date in format YYYY-MM-DD.",
      });
    }

    const today = new Date();
    // Future or today is invalid
    if (parsed >= today) {
      return res.status(400).json({
        error: true,
        message: "Invalid input: dob must be a date in the past.",
      });
    }

    // Store dob as the original string to avoid timezone off‑by‑one issues
    await db("users")
      .where({ email })
      .update({
        firstName,
        lastName,
        dob, // keep as string
        address,
      });

    return res.json({
      email,
      firstName,
      lastName,
      dob,
      address,
    });
  } catch (err) {
    return res.status(500).json({ error: true, message: "Server error" });
  }
};
