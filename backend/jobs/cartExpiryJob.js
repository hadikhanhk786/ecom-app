const cron = require("node-cron");
const pool = require("../db"); // adjust if needed

// Run every minute
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    // Find expired cart items
    const { rows: expiredItems } = await pool.query(
      "SELECT id, product_id, quantity FROM cart WHERE expires_at < $1",
      [now]
    );

    for (const item of expiredItems) {
      // Restore stock
      await pool.query(
        "UPDATE products SET quantity = quantity + $1 WHERE id = $2",
        [item.quantity, item.product_id]
      );
      // Remove cart item
    //   await pool.query("DELETE FROM cart WHERE id = $1", [item.id]);
    }

    if (expiredItems.length > 0) {
      console.log(`Restored stock for ${expiredItems.length} expired cart items`);
    }
  } catch (err) {
    console.error("Error in cart expiry job:", err);
  }
});
