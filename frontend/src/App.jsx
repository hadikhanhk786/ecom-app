import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Seller imports
import Navbar from "./components/Navbar"; // Seller navbar
import Login from "./features/auth/Login"; // Seller login
import Register from "./features/auth/Register"; // Seller register
import SellerDashboard from "./components/SellerDashboard";
import PrivateRoute from "./routes/PrivateRoute";

// Buyer/Customer imports
import HomePage from "./components/customer/HomePage";
import ProductPage from "./components/customer/ProductPage";
import CartPage from "./components/customer/CartPage";
import BuyerOrders from "./components/customer/BuyerOrders";
import CustomerLogin from "./components/customer/Login";
import CustomerRegister from "./components/customer/Register";
import CustomerNavbar from "./components/customer/Navbar";

export default function App() {
  return (
    <BrowserRouter>
      {/* Public Buyer Navbar */}
      <CustomerNavbar />

      <Routes>
        {/* Buyer/Customer Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<BuyerOrders />} />
        <Route path="/buyer-login" element={<CustomerLogin />} />
        <Route path="/buyer-register" element={<CustomerRegister />} />

        {/* Seller Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <SellerDashboard />
            </PrivateRoute>
          }
        />

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
