-- ============================================================
--  CAB230 Assignment 3 – Extra tables setup
--  Run AFTER importing rentals-dump.sql
-- ============================================================

-- Create application user (safer than root)
CREATE USER IF NOT EXISTS 'cab230user'@'localhost' IDENTIFIED BY 'cab230pass';
GRANT ALL PRIVILEGES ON rentals.* TO 'cab230user'@'localhost';
FLUSH PRIVILEGES;

USE rentals;

-- Drop existing users table if it came from the dump (we need our own schema)
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id        INT          NOT NULL AUTO_INCREMENT,
  email     VARCHAR(255) NOT NULL UNIQUE,
  password  VARCHAR(255) NOT NULL,
  firstName VARCHAR(255) DEFAULT NULL,
  lastName  VARCHAR(255) DEFAULT NULL,
  dob       DATE         DEFAULT NULL,
  address   TEXT         DEFAULT NULL,
  createdAt TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id        INT          NOT NULL AUTO_INCREMENT,
  userEmail VARCHAR(255) NOT NULL,
  rentalId  INT          NOT NULL,
  rating    TINYINT      NOT NULL,
  comment   TEXT         DEFAULT NULL,
  dateTime  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_rental (userEmail, rentalId),
  CONSTRAINT fk_ratings_user   FOREIGN KEY (userEmail) REFERENCES users(email)  ON DELETE CASCADE,
  CONSTRAINT fk_ratings_rental FOREIGN KEY (rentalId)  REFERENCES data(id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT 'Setup complete!' AS Status;
