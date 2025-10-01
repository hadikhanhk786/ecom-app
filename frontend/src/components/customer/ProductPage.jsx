import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useDispatch } from 'react-redux';
import api from '../../api/axios';
import { addToCart } from '../../features/cart/cartSlice';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const buyer = JSON.parse(localStorage.getItem('buyer'));
  if (!buyer) navigate('/buyer-login');

  // Fetch product
  const { data: product, isLoading, error } = useQuery(['product', id], async () => {
    const { data } = await api.get(`/products/${id}`);
    return data;
  });

  // Add to cart (backend + Redux)
  const addToCartMutation = useMutation(
    async () => api.post('/buyer/cart', { buyerId: buyer.id, productId: product.id, quantity }),
    {
      onSuccess: (res) => {
        // Update Redux cart
        dispatch(addToCart({
          id: res.data.id,
          productId: product.id,
          title: product.title,
          price: product.price,
          quantity,
          image: product.images?.[0] || null
        }));
        queryClient.invalidateQueries(['cart', buyer.id]);
        navigate('/cart');
      },
      onError: (err) => alert(err.response?.data?.message || err.message)
    }
  );

  if (isLoading) return <div className="p-4">Loading product...</div>;
  if (error) return <div className="p-4 text-red-500">Failed to load product.</div>;

  const handleAddToCart = () => {
    if (quantity < 1 || quantity > product.quantity) {
      alert(`Enter a quantity between 1 and ${product.quantity}`);
      return;
    }
    addToCartMutation.mutate();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 mt-20">
      <button onClick={() => navigate(-1)} className="mb-4 text-gray-600 hover:text-gray-800">← Back</button>

      <div className="bg-white rounded-lg shadow-md md:flex">
        <div className="md:w-1/2 p-4">
          {product.images?.length ? (
            <img
              src={`${import.meta.env.VITE_API_URL}${product.images[selectedImage]}`}
              alt={product.title}
              className="w-full h-96 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-96 bg-gray-200 flex items-center justify-center">No Image</div>
          )}

          {product.images?.length > 1 && (
            <div className="grid grid-cols-5 gap-2 mt-4">
              {product.images.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImage(idx)} className={selectedImage === idx ? 'border-2 border-blue-500' : 'border-gray-200'}>
                  <img src={`${import.meta.env.VITE_API_URL}${img}`} className="h-20 w-20 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:w-1/2 p-4 flex flex-col">
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p className="text-3xl font-bold my-4">₹{product.price}</p>
          <span className="text-gray-600">Stock: {product.quantity}</span>

          <div className="mt-4 mb-4">
            <label>Quantity: </label>
            <input type="number" min={1} max={product.quantity} value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-20 border rounded px-2 py-1" />
          </div>

          <button onClick={handleAddToCart} className="mt-auto bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">Add to Cart</button>
        </div>
      </div>
    </div>
  );
}
