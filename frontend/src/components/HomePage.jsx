import React from 'react';
import api from '../api/axios';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery('allProducts', async () => {
    const { data } = await api.get('/products');
    return data;
  });

  if (isLoading) return <div className="p-4">Loading products...</div>;
  if (error) return <div className="p-4 text-red-500">Failed to load products.</div>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {data.map(product => (
          <div
            key={product.id}
            className="bg-white p-3 rounded shadow hover:shadow-lg cursor-pointer"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            <img
              src={product.images && product.images[0] 
                ? `${import.meta.env.VITE_API_URL}${product.images[0]}` 
                : 'https://placehold.co/200x200?text=No+Image'}
              alt={product.title}
              className="w-full h-40 object-cover mb-2 rounded"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/200x200?text=No+Image';
              }}
            />
            <div className="font-semibold text-sm">{product.title}</div>
            <div className="text-sm text-gray-600">₹{product.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
