const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// register seller
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "Missing fields" });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await pool.query(
      "INSERT INTO sellers (id, name, email, password_hash) VALUES ($1, $2, $3, $4)",
      [id, name, email, hashed]
    );
    const token = jwt.sign(
      { id, role: "seller", email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ token, seller: { id, name, email } });
  } catch (err) {
    console.error(err);
    if (err.code === "23505")
      return res.status(409).json({ message: "Email exists" });
    res.status(500).json({ message: "Server error" });
  }
});

// login seller
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Missing fields" });
  try {
    const { rows } = await pool.query(
      "SELECT * FROM sellers WHERE email = $1",
      [email]
    );
    if (!rows[0])
      return res.status(401).json({ message: "Invalid credentials" });
    const seller = rows[0];
    const ok = await bcrypt.compare(password, seller.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { id: seller.id, role: "seller", email: seller.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({
      token,
      seller: { id: seller.id, name: seller.name, email: seller.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
