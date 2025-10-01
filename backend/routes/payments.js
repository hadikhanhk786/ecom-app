const express = require("express");
const { v4: uuidv4 } = require("uuid");
const pool = require("../db.js"); // your PostgreSQL pool
const Stripe = require("stripe");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


router.get("/saved-cards/:buyerId", async (req, res) => {
  const { buyerId } = req.params;

  try {
    // Get stripe customer ID from your DB (you should save it when user first pays)
    const { rows } = await pool.query(
      "SELECT stripe_customer_id FROM buyers WHERE id=$1",
      [buyerId]
    );

    if (!rows[0] || !rows[0].stripe_customer_id) {
      return res.json({ cards: [] }); // No Stripe customer yet
    }

    const stripeCustomerId = rows[0].stripe_customer_id;

    // List saved payment methods (cards only)
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: "card",
    });

    // Map the data to send only relevant info
    const cards = paymentMethods.data.map(pm => ({
      id: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      exp_month: pm.card.exp_month,
      exp_year: pm.card.exp_year,
    }));

    res.json({ cards });
  } catch (err) {
    console.error("Saved cards error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch saved cards" });
  }
});


// ---------------------------
// Attach a new card to Stripe customer
// ---------------------------
router.post("/attach-card", async (req, res) => {
  const { buyerId, paymentMethodId } = req.body;

  try {
    // Get or create stripe customer
    let { rows } = await pool.query(
      "SELECT stripe_customer_id FROM buyers WHERE id=$1",
      [buyerId]
    );

    let stripeCustomerId = rows[0]?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create();
      stripeCustomerId = customer.id;
      await pool.query(
        "UPDATE buyers SET stripe_customer_id=$1 WHERE id=$2",
        [stripeCustomerId, buyerId]
      );
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });

    // Optionally set as default for invoices
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    res.json({ success: true, message: "Card attached successfully" });
  } catch (err) {
    console.error("Attach card error:", err);
    res.status(500).json({ message: err.message || "Failed to attach card" });
  }
});


// ---------------------------
// Helper: place order
// ---------------------------
async function placeOrder(client, buyerId, items, addressId) {
  let totalAmount = 0;
  const orderId = uuidv4();

  // Insert order first
  await client.query(
    "INSERT INTO orders (id, buyer_id, address_id, status, total_amount, created_at) VALUES ($1,$2,$3,$4,$5,NOW())",
    [orderId, buyerId, addressId, "PENDING", 0]
  );

  for (const item of items) {
    // Get cart (for expiry check)
    const { rows: cartRows } = await client.query(
      "SELECT expires_at FROM cart WHERE id=$1",
      [item.id]
    );
    if (!cartRows[0]) throw new Error(`Cart item ${item.id} not found`);

    const expired = new Date(cartRows[0].expires_at) < new Date();

    if (!expired) {
      // Check inventory
      const { rows: prod } = await client.query(
        "SELECT quantity, price FROM products WHERE id=$1",
        [item.productId]
      );
      if (!prod[0] || prod[0].quantity < item.quantity) {
        throw new Error(`Product ${item.productId} insufficient stock`);
      }

      // Deduct inventory
      await client.query(
        "UPDATE products SET quantity = quantity - $1 WHERE id=$2",
        [item.quantity, item.productId]
      );

      totalAmount += prod[0].price * item.quantity;
      await client.query(
        "INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4,$5)",
        [uuidv4(), orderId, item.productId, item.quantity, prod[0].price]
      );
    } else {
      // Expired cart → just record item
      const { rows: prod } = await client.query(
        "SELECT price FROM products WHERE id=$1",
        [item.productId]
      );
      if (!prod[0]) throw new Error(`Product ${item.productId} not found`);

      totalAmount += prod[0].price * item.quantity;
      await client.query(
        "INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4,$5)",
        [uuidv4(), orderId, item.productId, item.quantity, prod[0].price]
      );
    }

    // Always free cart row
    await client.query("DELETE FROM cart WHERE id=$1", [item.id]);
  }

  // Update order total
  await client.query("UPDATE orders SET total_amount=$1 WHERE id=$2", [
    totalAmount,
    orderId,
  ]);

  return { orderId, totalAmount };
}

// ---------------------------
// COD Payment
// ---------------------------
router.post("/cod", async (req, res) => {
  const { buyerId, items, addressId } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { orderId, totalAmount } = await placeOrder(
      client,
      buyerId,
      items,
      addressId
    );

    await client.query("UPDATE orders SET status=$1 WHERE id=$2", [
      "PLACED",
      orderId,
    ]);

    await client.query("COMMIT");
    res.json({ success: true, orderId, totalAmount, method: "COD" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("COD error:", err);
    res.status(500).json({ message: err.message || "COD payment failed" });
  } finally {
    client.release();
  }
});

// ---------------------------
// Stripe Card Payment
// ---------------------------
router.post("/card", async (req, res) => {
  const { buyerId, items, addressId, paymentMethodId } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { orderId, totalAmount } = await placeOrder(
      client,
      buyerId,
      items,
      addressId
    );

     // Stripe payment - card only, no redirects
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // in paise
      currency: "inr",
      payment_method: paymentMethodId,
      confirm: true,
      payment_method_types: ["card"],  // ✅ force card only
    });

    await client.query("UPDATE orders SET status=$1 WHERE id=$2", [
      "PAID",
      orderId,
    ]);

    await client.query("COMMIT");
    res.json({ success: true, orderId, totalAmount, method: "CARD" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Card error:", err);
    res.status(500).json({ message: err.message || "Card payment failed" });
  } finally {
    client.release();
  }
});

module.exports = router;
