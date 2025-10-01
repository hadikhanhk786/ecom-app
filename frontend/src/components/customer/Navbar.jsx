import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CartDropdown from './CartDropdown';

export default function Navbar() {
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Check if buyer is logged in
  const buyer = localStorage.getItem('buyer') ? JSON.parse(localStorage.getItem('buyer')) : null;

  const handleLogout = () => {
    localStorage.removeItem('buyer');
    setMenuOpen(false);
    navigate('/');
  };

  const menuItems = [
    { label: 'Cart', onClick: () => navigate('/cart'), icon: '🛒' },
    { label: 'Orders', onClick: () => navigate('/orders'), icon: '📦' },
    { label: 'Addresses', onClick: () => navigate('/addresses'), icon: '📍' },
    { label: 'Logout', onClick: handleLogout, icon: '🚪' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white p-4 flex justify-between items-center">
      <div className="font-bold text-lg cursor-pointer" onClick={() => navigate('/')}>
        E-Commerce
      </div>

      <div className="flex items-center space-x-4 relative">
        {!buyer ? (
          <>
            <button
              onClick={() => navigate('/buyer-login')}
              className="px-3 py-1 border border-white rounded hover:bg-white hover:text-blue-600 transition"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/buyer-register')}
              className="px-3 py-1 border border-white rounded hover:bg-white hover:text-blue-600 transition"
            >
              Register
            </button>
          </>
        ) : (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-3 py-1 hover:bg-blue-700 rounded transition-colors"
            >
              <span className="font-medium">Hello, {buyer.name}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50">
                  {menuItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        item.onClick();
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
