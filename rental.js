const express = require("express");
const router = express.Router();
const {
  getStates,
  getPropertyTypes,
  searchRentals,
  getRentalById
} = require("../controllers/RentalControllers");

// GET /rentals/states
router.get("/states", getStates);

// GET /rentals/property-types
router.get("/property-types", getPropertyTypes);

// GET /rentals/search
router.get("/search", searchRentals);

// GET /rentals/:id
router.get("/:id", getRentalById);

module.exports = router;
