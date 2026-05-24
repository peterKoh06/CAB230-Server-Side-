const express = require("express");
const router = express.Router();
const { authenticate, requireAuth } = require("../middlewares/auth");
const {
  postRating,
  getRating,
  getAllRatings,
} = require("../controllers/RatingControllers");

router.post("/rentals/:id", authenticate, requireAuth, postRating);
router.get("/rentals/:id", authenticate, requireAuth, getRating);
router.get("/", authenticate, requireAuth, getAllRatings);

module.exports = router;
