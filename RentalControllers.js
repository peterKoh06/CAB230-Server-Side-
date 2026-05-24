const db = require("../db");

// Allowed sort fields (match tests)
const SORT_FIELDS = [
  "rent",
  "bathrooms",
  "bedrooms",
  "parkingSpaces",
  "suburb",
  "postcode",
  "latitude",
  "longitude",
  "state",
];

// Allowed sort orders
const SORT_ORDERS = ["asc", "desc"];

// Helper: validate non-negative integer (returns { ok, value? })
function validateNonNegativeInt(value) {
  if (value === undefined) return { ok: true };
  if (!/^\d+$/.test(String(value))) return { ok: false };
  return { ok: true, value: Number(value) };
}

// Helper: validate postcode (4 digits)
function validatePostcode(value) {
  if (value === undefined) return { ok: true };
  if (!/^\d{4}$/.test(String(value))) return { ok: false };
  return { ok: true, value: Number(value) };
}

// GET /rentals/states
exports.getStates = async (req, res) => {
  try {
    const invalid = Object.keys(req.query);
    if (invalid.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Invalid query parameters: ${invalid.join(", ")}`,
      });
    }

    const rows = await db("data").distinct("state").orderBy("state");
    return res.json(rows.map((r) => r.state));
  } catch (err) {
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
};

// GET /rentals/property-types
exports.getPropertyTypes = async (req, res) => {
  try {
    const invalid = Object.keys(req.query);
    if (invalid.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Invalid query parameters: ${invalid.join(", ")}`,
      });
    }

    const rows = await db("data").distinct("propertyType").orderBy("propertyType");
    return res.json(rows.map((r) => r.propertyType));
  } catch (err) {
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
};

// GET /rentals/:id
exports.getRentalById = async (req, res) => {
  try {
    // If any query params are present, tests expect a 400 with invalid param list
    const invalidQueryKeys = Object.keys(req.query);
    if (invalidQueryKeys.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Invalid query parameters: ${invalidQueryKeys.join(", ")}`,
      });
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: true,
        message: "Invalid id parameter. Must be a positive integer.",
      });
    }

    const rental = await db("data")
      .leftJoin("ratings", "data.id", "ratings.rentalId")
      .where("data.id", id)
      .groupBy("data.id")
      .select(
        "data.*",
        db.raw("ROUND(AVG(ratings.rating), 2) as averageRating"),
        db.raw("COUNT(ratings.id) as numRatings")
      )
      .first();

    if (!rental) {
      return res.status(404).json({ error: true, message: "No rental exists with this ID." });
    }

    // Normalize numeric fields
    rental.latitude = rental.latitude !== null ? Number(rental.latitude) : null;
    rental.longitude = rental.longitude !== null ? Number(rental.longitude) : null;
    rental.averageRating = rental.averageRating !== null ? Number(rental.averageRating) : null;
    rental.numRatings = rental.numRatings !== null ? Number(rental.numRatings) : 0;

    const reviews = await db("ratings")
      .where("rentalId", id)
      .orderBy("dateTime", "asc");

    rental.reviews = reviews.map((r) => {
      const obj = {
        rating: r.rating,
        user: r.userEmail,
        dateTime: new Date(r.dateTime).toISOString(),
      };
      if (r.comment) obj.comment = r.comment;
      return obj;
    });

    return res.json(rental);
  } catch (err) {
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
};

// GET /rentals/search
exports.searchRentals = async (req, res) => {
  try {
    const q = req.query || {};

    // Allowed query keys (tests expect rejection of unknown keys)
    const ALLOWED = [
      "suburb", "state", "postcode",
      "minimumRent", "maximumRent",
      "minimumBathrooms", "maximumBathrooms",
      "minimumBedrooms", "maximumBedrooms",
      "minimumParking", "maximumParking",
      "propertyTypes",
      "page", "sortBy", "sortOrder"
    ];
    const invalidKeys = Object.keys(q).filter(k => !ALLOWED.includes(k));
    if (invalidKeys.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Invalid query parameters: ${invalidKeys.join(", ")}`
      });
    }

    // Validate numeric and format params
    const pc = validatePostcode(q.postcode);
    if (!pc.ok) {
      return res.status(400).json({
        error: true,
        message: "Invalid postcode parameter. Must be an integer in the range of 0000-9999.",
      });
    }

    const minRent = validateNonNegativeInt(q.minimumRent);
    if (!minRent.ok) {
      return res.status(400).json({
        error: true,
        message: "Invalid minimumRent parameter. Must be a non-negative integer.",
      });
    }
    const maxRent = validateNonNegativeInt(q.maximumRent);
    if (!maxRent.ok) {
      return res.status(400).json({
        error: true,
        message: "Invalid maximumRent parameter. Must be a non-negative integer.",
      });
    }

    const minBath = validateNonNegativeInt(q.minimumBathrooms);
    if (!minBath.ok) {
      return res.status(400).json({
        error: true,
        message: "Invalid minimumBathrooms parameter. Must be a non-negative integer.",
      });
    }
    const maxBath = validateNonNegativeInt(q.maximumBathrooms);
    if (!maxBath.ok) {
      return res.status(400).json({
        error: true,
        message: "Invalid maximumBathrooms parameter. Must be a non-negative integer.",
      });
    }

    const minBed = validateNonNegativeInt(q.minimumBedrooms);
    if (!minBed.ok) {
      return res.status(400).json({
        error: true,
        message: "Invalid minimumBedrooms parameter. Must be a non-negative integer.",
      });
    }
    const maxBed = validateNonNegativeInt(q.maximumBedrooms);
    if (!maxBed.ok) {
      return res.status(400).json({
        error: true,
        message: "Invalid maximumBedrooms parameter. Must be a non-negative integer.",
      });
    }

    const minPark = validateNonNegativeInt(q.minimumParking);
    if (!minPark.ok) {
      return res.status(400).json({
        error: true,
        message: "Invalid minimumParking parameter. Must be a non-negative integer.",
      });
    }
    const maxPark = validateNonNegativeInt(q.maximumParking);
    if (!maxPark.ok) {
      return res.status(400).json({
        error: true,
        message: "Invalid maximumParking parameter. Must be a non-negative integer.",
      });
    }

    // sortOrder without sortBy
    if (q.sortOrder && !q.sortBy) {
      return res.status(400).json({
        error: true,
        message: "Invalid sortOrder parameter. sortBy must be specified.",
      });
    }

    // invalid sortBy
    if (q.sortBy && !SORT_FIELDS.includes(q.sortBy)) {
      return res.status(400).json({
        error: true,
        message: "Invalid sortBy parameter. Must refer to a valid sortable property.",
      });
    }

    // invalid sortOrder
    if (q.sortOrder && !SORT_ORDERS.includes(q.sortOrder)) {
      return res.status(400).json({
        error: true,
        message: "Invalid sortOrder parameter. Must be 'asc' or 'desc'.",
      });
    }

    // page
    if (q.page !== undefined) {
      if (!/^\d+$/.test(String(q.page)) || Number(q.page) < 1) {
        return res.status(400).json({
          error: true,
          message: "Invalid page parameter. Must be an integer greater than or equal to 1.",
        });
      }
    }

    const page = Number(q.page) || 1;
    const perPage = 10;
    const offset = (page - 1) * perPage;

    // Build base query (with ratings aggregated)
    const base = db("data")
      .leftJoin("ratings", "data.id", "ratings.rentalId")
      .groupBy("data.id")
      .select(
        "data.*",
        db.raw("ROUND(AVG(ratings.rating), 2) as averageRating"),
        db.raw("COUNT(ratings.id) as numRatings")
      );

    // Apply filters to base
    if (q.state) base.where("data.state", q.state);
    if (q.suburb) base.where("data.suburb", q.suburb);
    if (pc.value !== undefined) base.where("data.postcode", pc.value);
    if (minRent.value !== undefined) base.where("data.rent", ">=", minRent.value);
    if (maxRent.value !== undefined) base.where("data.rent", "<=", maxRent.value);
    if (minBath.value !== undefined) base.where("data.bathrooms", ">=", minBath.value);
    if (maxBath.value !== undefined) base.where("data.bathrooms", "<=", maxBath.value);
    if (minBed.value !== undefined) base.where("data.bedrooms", ">=", minBed.value);
    if (maxBed.value !== undefined) base.where("data.bedrooms", "<=", maxBed.value);
    if (minPark.value !== undefined) base.where("data.parkingSpaces", ">=", minPark.value);
    if (maxPark.value !== undefined) base.where("data.parkingSpaces", "<=", maxPark.value);

    if (q.propertyTypes) {
      // propertyTypes may be comma-separated string
      const types = typeof q.propertyTypes === "string"
        ? q.propertyTypes.split(",").map(s => s.trim()).filter(Boolean)
        : Array.isArray(q.propertyTypes) ? q.propertyTypes : [];
      if (types.length > 0) base.whereIn("data.propertyType", types);
    }

    // Sorting
    if (q.sortBy) {
      base.orderBy(q.sortBy, q.sortOrder || "asc");
    } else {
      base.orderBy("data.id", "asc");
    }

    // Build count query with same filters (no join needed)
    const countQuery = db("data")
      .modify((qb) => {
        if (q.state) qb.where("state", q.state);
        if (q.suburb) qb.where("suburb", q.suburb);
        if (pc.value !== undefined) qb.where("postcode", pc.value);
        if (minRent.value !== undefined) qb.where("rent", ">=", minRent.value);
        if (maxRent.value !== undefined) qb.where("rent", "<=", maxRent.value);
        if (minBath.value !== undefined) qb.where("bathrooms", ">=", minBath.value);
        if (maxBath.value !== undefined) qb.where("bathrooms", "<=", maxBath.value);
        if (minBed.value !== undefined) qb.where("bedrooms", ">=", minBed.value);
        if (maxBed.value !== undefined) qb.where("bedrooms", "<=", maxBed.value);
        if (minPark.value !== undefined) qb.where("parkingSpaces", ">=", minPark.value);
        if (maxPark.value !== undefined) qb.where("parkingSpaces", "<=", maxPark.value);
        if (q.propertyTypes) {
          const types = typeof q.propertyTypes === "string"
            ? q.propertyTypes.split(",").map(s => s.trim()).filter(Boolean)
            : Array.isArray(q.propertyTypes) ? q.propertyTypes : [];
          if (types.length > 0) qb.whereIn("propertyType", types);
        }
      })
      .count("* as total")
      .first();

    const totalRow = await countQuery;
    const total = Number(totalRow ? totalRow.total : 0);
    const lastPage = total === 0 ? 0 : Math.ceil(total / perPage);

    // Fetch page rows
    const rows = await base.clone().limit(perPage).offset(offset);

    // Normalize rows
    const data = rows.map(r => ({
      ...r,
      latitude: r.latitude !== null ? Number(r.latitude) : null,
      longitude: r.longitude !== null ? Number(r.longitude) : null,
      averageRating: r.averageRating !== null ? Number(r.averageRating) : null,
      numRatings: r.numRatings !== null ? Number(r.numRatings) : 0,
    }));

    // Compute from/to as tests expect:
    // from = offset
    // to = offset + number of returned rows
    const from = offset;
    const to = offset + data.length;

    return res.json({
      data,
      pagination: {
        total,
        lastPage,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: page < lastPage ? page + 1 : null,
        perPage,
        currentPage: page,
        from,
        to
      }
    });
  } catch (err) {
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
};

module.exports = {
  getStates: exports.getStates,
  getPropertyTypes: exports.getPropertyTypes,
  searchRentals: exports.searchRentals,
  getRentalById: exports.getRentalById
};
