const express = require("express");
const router  = express.Router();
const { authenticate, requireAuth } = require("../middlewares/auth");
const { register, login }           = require("../controllers/UserControllers");
const { getProfile, updateProfile } = require("../controllers/ProfileControllers");

router.post("/register", register);
router.post("/login",    login);

// Profile – authenticate first (optional), then handle in controller
router.get( "/:email/profile", authenticate, getProfile);
router.put( "/:email/profile", authenticate, updateProfile);

module.exports = router;
