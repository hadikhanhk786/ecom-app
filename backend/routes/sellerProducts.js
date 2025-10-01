const express = require("express");
const router = express.Router();
const pool = require("../db");
const sellerAuth = require("../middleware/auth");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Create product
router.post("/", sellerAuth, upload.array("images", 6), async (req, res) => {
  try {
    const { title, description, price, quantity, specs } = req.body;
    const id = uuidv4();
    const images = (req.files || []).map((f) => `/${UPLOAD_DIR}/${f.filename}`);
    const specsObj = specs ? JSON.parse(specs) : null;
    await pool.query(
      `INSERT INTO products (id, seller_id, title, description, specs, price, quantity, images) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, req.user.id, title, description, specsObj, price, quantity, images]
    );
    res.json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Create failed" });
  }
});

// List seller products
router.get("/", sellerAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "List failed" });
  }
});

// Update product (basic: title, price, quantity, specs, add more images)
router.put("/:id", sellerAuth, upload.array("images", 6), async (req, res) => {
  try {
    const { id } = req.params;
    // verify ownership
    const { rows } = await pool.query(
      "SELECT seller_id, images FROM products WHERE id = $1",
      [id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Not found" });
    if (rows[0].seller_id !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });

    const prevImages = rows[0].images || [];
    const newImages = (req.files || []).map(
      (f) => `/${UPLOAD_DIR}/${f.filename}`
    );
    // optional: remove imagesToRemove passed as array of urls in body
    const { title, description, price, quantity, specs, imagesToRemove } =
      req.body;

    let finalImages = prevImages
      .filter((img) => !(imagesToRemove || []).includes(img))
      .concat(newImages);

    await pool.query(
      `UPDATE products SET title=$1, description=$2, specs=$3, price=$4, quantity=$5, images=$6, updated_at=now() WHERE id=$7`,
      [
        title,
        description,
        specs ? JSON.parse(specs) : null,
        price,
        quantity,
        finalImages,
        id,
      ]
    );
    res.json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
});

// Delete product
router.delete("/:id", sellerAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      "SELECT seller_id FROM products WHERE id=$1",
      [id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Not found" });
    if (rows[0].seller_id !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });
    await pool.query("DELETE FROM products WHERE id=$1", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;
