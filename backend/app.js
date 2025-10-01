const express = require("express");
const cors = require("cors");
require("dotenv").config();
const authSeller = require("./routes/authSeller");
const sellerProducts = require("./routes/sellerProducts");
const products = require('./routes/products');
const buyerAuth = require('./routes/buyerAuth');
const buyerAddress = require('./routes/buyerAddress');
const buyerOrders = require('./routes/buyerOrders');
const buyerCart = require('./routes/buyerCart');
const payments = require('./routes/payments');
require("./jobs/cartExpiryJob"); // this will start the cron job
require("./routes/faker")
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads",
  express.static(path.join(__dirname, process.env.UPLOAD_DIR || "uploads"))
);

app.use("/api/seller/auth", authSeller);
app.use("/api/seller/products", sellerProducts);
app.use('/api/products', products);
app.use('/api/buyers', buyerAuth);
app.use('/api/buyer/addresses', buyerAddress);
app.use('/api/buyer/orders', buyerOrders);
app.use('/api/buyer/cart', buyerCart);
app.use('/api/payments', payments);
// Start server


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
