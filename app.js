const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan("dev"));
app.use(express.json());

// ── Swagger docs at /docs ───────────────────────────────────────────────────
const swaggerDocument = JSON.parse(
  fs.readFileSync(path.join(__dirname, "doc", "swagger.json"), "utf8")
);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/rentals", require("./routes/rental"));
app.use("/user",    require("./routes/users"));
app.use("/ratings", require("./routes/rating"));
app.use("/ratings", require("./routes/debug"));   // debug erase endpoint
app.use("/user",    require("./routes/debug"));   // debug login endpoint

// Optional: test route
app.use("/test", require("./routes/test"));

// ── Global error handler ────────────────────────────────────────────────────
app.use(require("./middlewares/errorHandle"));

// ── Start servers ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

// Always start HTTP
http.createServer(app).listen(PORT, () => {
  console.log(`HTTP  server running on http://localhost:${PORT}`);
  console.log(`Swagger docs at    http://localhost:${PORT}/docs`);
});

// Start HTTPS if cert files exist
const certPath = path.join(__dirname, "cert", "cert.pem");
const keyPath  = path.join(__dirname, "cert", "key.pem");
if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const httpsOptions = {
    cert: fs.readFileSync(certPath),
    key:  fs.readFileSync(keyPath),
  };
  https.createServer(httpsOptions, app).listen(3443, () => {
    console.log(`HTTPS server running on https://localhost:3443`);
  });
}

module.exports = app;
