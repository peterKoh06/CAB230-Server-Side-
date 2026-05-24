// GET /profile
exports.getProfile = async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(200).json({
      email: req.query.email,
      firstName: null,
      lastName: null
    });
  }

  const profile = await knex("profiles")
    .where({ email: user.email })
    .first();

  return res.status(200).json({
    email: user.email,
    firstName: profile?.firstName || null,
    lastName: profile?.lastName || null,
    dob: profile?.dob || undefined,
    address: profile?.address || undefined
  });
};
