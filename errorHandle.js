// eslint-disable-next-line no-unused-vars
module.exports = function errorHandle(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: true,
    message: err.message || "Internal server error",
  });
};
