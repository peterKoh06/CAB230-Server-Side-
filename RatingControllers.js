const db = require("../db");

// POST /ratings/rentals/:id
exports.postRating = async (req, res) => {
  try {
    const rentalId = Number(req.params.id);
    const { rating, comment } = req.body;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: true,
        message: "Invalid rating: rating must be an integer between 1 and 5.",
      });
    }

    if (comment !== undefined) {
      if (typeof comment !== "string" || comment.length < 1 || comment.length > 2000) {
        return res.status(400).json({
          error: true,
          message:
            "Invalid comment parameter. Comment must be a string 1-2000 characters long.",
        });
      }
    }

    const rental = await db("data").where("id", rentalId).first();
    if (!rental) {
      return res
        .status(404)
        .json({ error: true, message: "No rental exists with this ID." });
    }

    const userEmail = req.user.email;
    const dateTime = new Date();

    const existing = await db("ratings")
      .where({ userEmail, rentalId })
      .first();

    if (existing) {
      await db("ratings")
        .where({ userEmail, rentalId })
        .update({
          rating,
          comment: comment || null,
          dateTime,
        });
    } else {
      await db("ratings").insert({
        userEmail,
        rentalId,
        rating,
        comment: comment || null,
        dateTime,
      });
    }

    res.status(201).json({
      rating,
      ...(comment ? { comment } : {}),
      dateTime: dateTime.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: true, message: "Server error" });
  }
};

// GET /ratings/rentals/:id
exports.getRating = async (req, res) => {
  try {
    const rentalId = Number(req.params.id);
    const userEmail = req.user.email;

    const rental = await db("data").where("id", rentalId).first();
    if (!rental) {
      return res
        .status(404)
        .json({ error: true, message: "No rental exists with this ID." });
    }

    const row = await db("ratings")
      .where({ userEmail, rentalId })
      .first();

    if (!row) {
      return res.status(404).json({
        error: true,
        message: "No rating exists with this rental ID.",
      });
    }

    res.json({
      rating: row.rating,
      ...(row.comment ? { comment: row.comment } : {}),
      dateTime: new Date(row.dateTime).toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: true, message: "Server error" });
  }
};

// GET /ratings
exports.getAllRatings = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.perPage) || 20;

    if (page < 1) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid page parameter." });
    }

    const [{ total }] = await db("ratings")
      .where({ userEmail })
      .count("* as total");

    const lastPage = Math.ceil(total / perPage) || 1;
    const offset = (page - 1) * perPage;

    const rows = await db("ratings")
      .where({ userEmail })
      .orderBy("dateTime", "desc")
      .limit(perPage)
      .offset(offset);

    const data = rows.map((r) => ({
      rentalId: r.rentalId,
      rating: r.rating,
      ...(r.comment ? { comment: r.comment } : {}),
      dateTime: new Date(r.dateTime).toISOString(),
    }));

    res.json({
      data,
      pagination: {
        total,
        lastPage,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: page < lastPage ? page + 1 : null,
        perPage,
        currentPage: page,
        from: offset,
        to: offset + perPage,
      },
    });
  } catch (err) {
    res.status(500).json({ error: true, message: "Server error" });
  }
};
