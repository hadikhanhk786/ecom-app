// routes/buyerAddress.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');
const buyerAuth = require('../middleware/buyerAuth'); // similar to sellerAuth

// List addresses for buyer
router.get('/', buyerAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM buyer_addresses WHERE buyer_id=$1', [req.user.id]);
  res.json(rows);
});

// Add new address
router.post('/', buyerAuth, async (req, res) => {
  const { name, address, city, state, pincode, mobile_number } = req.body;
  const id = uuidv4();
  await pool.query(
    `INSERT INTO buyer_addresses (id, buyer_id, name, address, city, state, pincode, mobile_number)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
     [id, req.user.id, name, address, city, state, pincode, mobile_number]
  );
  res.json({ id });
});

module.exports = router;
