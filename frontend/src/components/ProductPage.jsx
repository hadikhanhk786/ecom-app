import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useDispatch } from 'react-redux';
import api from '../api/axios';
import { addToCart } from '../features/cart/cartSlice';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, error } = useQuery(['product', id], async () => {
    const { data } = await api.get(`/products/${id}`);
    return data;
  });

  if (isLoading) return <div className="p-4">Loading product...</div>;
  if (error) return <div className="p-4 text-red-500">Failed to load product.</div>;

  const handleAddToCart = () => {
    if (quantity < 1 || quantity > product.quantity) {
      alert(`Enter a quantity between 1 and ${product.quantity}`);
      return;
    }

    dispatch(addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      quantity,
      image: product.images && product.images[0] ? product.images[0] : null
    }));

    navigate('/cart');
  };

  return (
    <div className="max-w-6xl mx-auto p-4 mt-20">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        ← Back
      </button>

      <div className="bg-white rounded-lg shadow-md md:flex">
        {/* Product Images */}
        <div className="md:w-1/2 p-4">
          {product.images && product.images.length > 0 ? (
            <img
              src={`${import.meta.env.VITE_API_URL}${product.images[selectedImage]}`}
              alt={product.title}
              className="w-full h-96 object-cover rounded-lg"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/400x400?text=No+Image';
              }}
            />
          ) : (
            <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">No Image Available</span>
            </div>
          )}

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2 mt-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 ${
                    selectedImage === index
                      ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-1'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <img
                    src={`${import.meta.env.VITE_API_URL}${image}`}
                    alt={`${product.title} - ${index + 1}`}
                    className="h-full w-full object-cover transition-transform hover:scale-110"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/80x80?text=No+Image';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="md:w-1/2 p-4 flex flex-col">
          <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
          <p className="text-3xl font-bold text-gray-900 mb-4">₹{product.price}</p>

          <div className="mb-4">
            <h2 className="font-semibold mb-2">Description:</h2>
            <p className="text-gray-600">{product.description || 'No description available'}</p>
          </div>

          <div className="mb-4">
            <span className="text-gray-600">Stock Available: {product.quantity}</span>
          </div>

          <div className="mb-4">
            <label className="font-medium mr-2">Quantity:</label>
            <input
              type="number"
              min={1}
              max={product.quantity}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-20 border rounded px-2 py-1"
            />
          </div>

          <button
            onClick={handleAddToCart}
            className="mt-auto w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
