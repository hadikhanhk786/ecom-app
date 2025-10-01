const express = require("express");
const router = express.Router();
const pool = require("../db");
const { v4: uuidv4 } = require("uuid");
const buyerAuth = require("../middleware/buyerAuth"); // similar to sellerAuth




// Place order with concurrency-safe inventory handling
router.post('/', async (req, res) => {
  try {
    const { buyerId, items } = req.body; // items = [{id, productId, quantity}]

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let totalAmount = 0;
      const orderId = uuidv4();

      // Pre-calc total + validate inventory
      for (const item of items) {
        const { rows: prodRows } = await client.query(
          'SELECT quantity, price FROM products WHERE id=$1 FOR UPDATE',
          [item.productId]
        );
        if (!prodRows[0]) throw new Error(`Product ${item.productId} not found`);

        const availableStock = prodRows[0].quantity;
        const price = prodRows[0].price;

        // Get cart entry
        const { rows: cartRows } = await client.query(
          'SELECT expires_at FROM cart WHERE id=$1 AND buyer_id=$2',
          [item.id, buyerId]
        );
        if (!cartRows[0]) throw new Error(`Cart item ${item.id} not found`);

        const expiresAt = new Date(cartRows[0].expires_at);
        const now = new Date();

        if (now > expiresAt) {
          // Expired cart → check fresh stock
          if (availableStock < item.quantity) {
            throw new Error(`Product ${item.productId} insufficient stock`);
          }
        } else {
          // Restore then recheck
          await client.query(
            'UPDATE products SET quantity = quantity + $1 WHERE id=$2',
            [item.quantity, item.productId]
          );
          const { rows: updatedRows } = await client.query(
            'SELECT quantity FROM products WHERE id=$1 FOR UPDATE',
            [item.productId]
          );
          if (updatedRows[0].quantity < item.quantity) {
            throw new Error(`Product ${item.productId} insufficient stock after restore`);
          }
        }

        totalAmount += price * item.quantity;
      }

      // ✅ Create the order FIRST
      await client.query(
        'INSERT INTO orders (id, buyer_id, status, total_amount, created_at) VALUES ($1,$2,$3,$4,NOW())',
        [orderId, buyerId, 'PLACED', totalAmount]
      );

      // Process each item (inventory + order_items + cart delete)
      for (const item of items) {
        const { rows: prodRows } = await client.query(
          'SELECT price FROM products WHERE id=$1',
          [item.productId]
        );
        const price = prodRows[0].price;

        // Deduct inventory now
        await client.query(
          'UPDATE products SET quantity = quantity - $1 WHERE id=$2',
          [item.quantity, item.productId]
        );

        // Add order item
        await client.query(
          'INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4,$5)',
          [uuidv4(), orderId, item.productId, item.quantity, price]
        );

        // Remove from cart
        await client.query('DELETE FROM cart WHERE id=$1', [item.id]);
      }

      await client.query('COMMIT');
      res.json({ orderId, totalAmount });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Failed to place order' });
  }
});






// Get buyer orders
router.get("/", buyerAuth, async (req, res) => {
  try {
    const buyerId = req.user.id;

    const { rows } = await pool.query(
      `SELECT 
         o.id as order_id,
         o.status,
         o.created_at,
         o.total_amount,
         o.payment_method,
         json_agg(json_build_object(
           'productId', oi.product_id,
           'quantity', oi.quantity
         )) as items
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.buyer_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [buyerId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});


module.exports = router;
