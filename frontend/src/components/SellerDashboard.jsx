import React from "react";
import AddProductForm from "./AddProductForm";
import ProductList from "./ProductList";

export default function SellerDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      <div className="bg-white p-4 rounded shadow">
        <AddProductForm />
      </div>
      <div className="bg-white p-4 rounded shadow">
        <ProductList />
      </div>
    </div>
  );
}
