import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { Link } from "react-router-dom";

export default function Navbar() {
  const seller = useSelector((s) => s.auth.seller);
  const dispatch = useDispatch();

  return (
    <nav className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
      <Link to="/dashboard" className="font-bold">
        Ecom Seller
      </Link>
      {seller && (
        <div className="flex gap-4 items-center">
          <span>{seller.name}</span>
          <button
            onClick={() => dispatch(logout())}
            className="bg-red-600 px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
