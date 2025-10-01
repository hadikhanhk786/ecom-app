const express = require('express');
const router = express.Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

// Get cart for buyer (cart items not yet purchased)
router.get('/:buyerId', async (req, res) => {
  try {
    const { buyerId } = req.params;
    const { rows } = await pool.query('SELECT * FROM cart WHERE buyer_id=$1', [buyerId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get cart' });
  }
});

// Add item to cart (hold inventory for 10 min)
// Add or update item in cart
router.post('/', async (req, res) => {
  try {
    const { buyerId, productId, quantity } = req.body;

    if (!buyerId || !productId || quantity < 0) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    // Get product stock
    const { rows: prodRows } = await pool.query(
      'SELECT quantity FROM products WHERE id=$1',
      [productId]
    );
    if (!prodRows[0]) return res.status(404).json({ message: 'Product not found' });

    const availableStock = prodRows[0].quantity;

    // Get existing cart item
    const { rows: existingRows } = await pool.query(
      'SELECT id, quantity FROM cart WHERE buyer_id=$1 AND product_id=$2',
      [buyerId, productId]
    );
    const existingItem = existingRows[0];

    const oldQuantity = existingItem ? existingItem.quantity : 0;
    const newQuantity = quantity;

    // Calculate stock change
    const delta = newQuantity - oldQuantity;
    console.log({ oldQuantity, newQuantity, delta, availableStock });
    if (delta > availableStock) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Update product stock
    if (delta > 0) {
      // User increased quantity → reduce product stock
      await pool.query('UPDATE products SET quantity = quantity - $1 WHERE id=$2', [delta, productId]);
    } else if (delta < 0) {
      // User decreased quantity → increase product stock
      await pool.query('UPDATE products SET quantity = quantity + $1 WHERE id=$2', [-delta, productId]);
    }

    if (existingItem) {
      if (newQuantity === 0) {
        // Remove item if quantity is 0
        await pool.query('DELETE FROM cart WHERE id=$1', [existingItem.id]);
      } else {
        // Update cart quantity
        await pool.query('UPDATE cart SET quantity=$1 WHERE id=$2', [newQuantity, existingItem.id]);
      }
    } else if (newQuantity > 0) {
      // Insert new cart item
      const id = uuidv4();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await pool.query(
        'INSERT INTO cart (id, buyer_id, product_id, quantity, expires_at) VALUES ($1,$2,$3,$4,$5)',
        [id, buyerId, productId, newQuantity, expiresAt]
      );
    }

    res.json({ message: 'Cart updated', productId, quantity: newQuantity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add/update cart' });
  }
});



// Remove item from cart (restore inventory)
router.delete('/:cartId', async (req, res) => {
  try {
    const { cartId } = req.params;
    const { rows } = await pool.query('SELECT product_id, quantity FROM cart WHERE id=$1', [cartId]);
    if (!rows[0]) return res.status(404).json({ message: 'Cart item not found' });

    const { product_id, quantity } = rows[0];
    // Restore inventory
    await pool.query('UPDATE products SET quantity = quantity + $1 WHERE id=$2', [quantity, product_id]);

    await pool.query('DELETE FROM cart WHERE id=$1', [cartId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to remove from cart' });
  }
});

module.exports = router;
