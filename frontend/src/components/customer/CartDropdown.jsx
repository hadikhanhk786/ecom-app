import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setCart, addToCart, removeFromCart } from "../../features/cart/cartSlice";
import { useEffect } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export const useCart = () => {
  const dispatch = useDispatch();
  const buyer = JSON.parse(localStorage.getItem('buyer'));
  const qc = useQueryClient();

  // Fetch cart
  const { data } = useQuery(['cart', buyer?.id], async () => {
    const { data } = await api.get(`/buyer/cart/${buyer.id}`);
    dispatch(setCart(data));
    return data;
  }, { enabled: !!buyer });

  // Add to cart mutation
  const addMutation = useMutation(
    ({ productId, quantity }) => api.post('/buyer/cart', { buyerId: buyer.id, productId, quantity }),
    {
      onSuccess: (res, variables) => {
        dispatch(addToCart({ cartId: res.data.id, productId: variables.productId, quantity: variables.quantity }));
        qc.invalidateQueries(['cart', buyer.id]);
      }
    }
  );

  // Remove from cart mutation
  const removeMutation = useMutation(
    (cartId) => api.delete(`/buyer/cart/${cartId}`),
    {
      onSuccess: (res, cartId) => {
        dispatch(removeFromCart(cartId));
        qc.invalidateQueries(['cart', buyer.id]);
      }
    }
  );

  return { cart: data, addMutation, removeMutation };
}

export default function CartDropdown({ items = [], onClose }) {
  const navigate = useNavigate();
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div 
      className="absolute right-0 mt-2 w-72 bg-white text-black rounded-lg shadow-lg p-4 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      {items.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500">Your cart is empty</p>
          <button
            onClick={() => navigate('/')}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <>
          <div className="max-h-96 overflow-auto">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b">
                <img
                  src={`${import.meta.env.VITE_API_URL}${item.image}`}
                  alt={item.title}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-sm text-gray-500">
                    ₹{item.price} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium">₹{item.price * item.quantity}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span>₹{total}</span>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
