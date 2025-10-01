import React from 'react';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function BuyerOrders() {
  const navigate = useNavigate();

  // Fetch all orders
  const { data: orders, isLoading: ordersLoading, error: ordersError } = useQuery(
    'buyerOrders',
    async () => {
      const { data } = await api.get('/buyer/orders');
      return data;
    }
  );

  // Fetch product details for all items
  const { data: products, isLoading: productsLoading } = useQuery(
    ['orderProducts', orders],
    async () => {
      if (!orders) return {};
      const productIds = [...new Set(orders.flatMap(order => order.items.map(item => item.productId)))];
      
      const productDetails = await Promise.all(
        productIds.map(async (id) => {
          const { data } = await api.get(`/products/${id}`);
          return data;
        })
      );

      return productIds.reduce((acc, id, index) => {
        acc[id] = productDetails[index];
        return acc;
      }, {});
    },
    { enabled: !!orders }
  );

  if (ordersLoading || productsLoading) return <div className="p-4 mt-20">Loading orders...</div>;
  if (ordersError) return <div className="p-4 mt-20 text-red-500">Failed to load orders.</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 mt-20">
      <h1 className="text-2xl font-bold mb-4">Your Orders</h1>
      {orders?.length === 0 ? (
        <div>No orders yet.</div>
      ) : (
        <ul className="space-y-6">
          {orders.map((order, orderIndex) => (
            <li key={order.order_id} className="bg-white p-6 rounded-lg shadow">
              {/* Order header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-lg font-semibold">
                    Order #{orderIndex + 1}
                  </div>
                  <div className="text-sm text-gray-500">
                    Placed on: {format(new Date(order.created_at), 'PPP')}
                  </div>
                  <div className="text-sm text-gray-500">
                    Payment Method: {order.payment_method || 'COD'}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    Total: ₹{order.total_amount}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                  order.status === 'PLACED' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status.toLowerCase()}
                </div>
              </div>

              {/* Order items */}
              <div className="divide-y">
                {order.items.map((item, itemIndex) => {
                  const product = products?.[item.productId];
                  return (
                    <div
                      key={itemIndex}
                      className="py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/product/${item.productId}`)}
                    >
                      <div className="w-20 h-20 flex-shrink-0">
                        {product?.images?.[0] ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL}${product.images[0]}`}
                            alt={product.title}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-xs">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{product?.title || 'Loading...'}</h3>
                        <div className="text-sm text-gray-600">Quantity: {item.quantity}</div>
                        {product && (
                          <div className="text-sm font-medium">
                            Price: ₹{product.price * item.quantity}
                          </div>
                        )}
                        {item.variant && (
                          <div className="text-sm text-gray-500">Variant: {item.variant}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
