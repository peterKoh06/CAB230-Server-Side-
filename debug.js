const express = require("express");
const router  = express.Router();
const { eraseRatings, debugLogin } = require("../controllers/DebugControllers");

// POST /ratings/debugEraseRatings  (mounted on /ratings in app.js)
router.post("/debugEraseRatings", eraseRatings);

// POST /user/debugLogin  (mounted on /user in app.js)
router.post("/debugLogin", debugLogin);

module.exports = router;
