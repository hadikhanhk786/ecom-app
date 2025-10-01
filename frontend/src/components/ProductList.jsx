import React, { useState } from "react";
import api from "../api/axios";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Virtuoso } from "react-virtuoso"; // ✅ More reliable import

const PAGE_SIZE = 10;

const ProductList = () => {
  const qc = useQueryClient();
  const [editId, setEditId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [selectedImages, setSelectedImages] = useState(null);
  const [page, setPage] = useState(0);

  // Fetch products
  const fetchProducts = async () => {
    const { data } = await api.get("/seller/products");
    return data;
  };

  const { data: products = [], isLoading } = useQuery(
    "sellerProducts",
    fetchProducts
  );

  // Delete product
  const delProduct = useMutation((id) => api.delete(`/seller/products/${id}`), {
    onSuccess: () => qc.invalidateQueries("sellerProducts"),
  });

  // Update product
  const updateProduct = useMutation(
    ({ id, formData }) =>
      api.put(`/seller/products/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    { onSuccess: () => qc.invalidateQueries("sellerProducts") }
  );

  // Delete a single image
  const deleteImage = async (productId, imageIndex) => {
    await api.delete(`/seller/products/${productId}/images/${imageIndex}`);
    qc.invalidateQueries("sellerProducts");
  };

  // Start editing product
  const startEdit = (p) => {
    setEditId(p.id);
    setEditFields({ title: p.title, price: p.price, quantity: p.quantity });
    setSelectedImages(null);
  };

  // Submit edits and/or new images
  const submitEdit = () => {
    const fd = new FormData();
    fd.append("title", editFields.title);
    fd.append("price", editFields.price);
    fd.append("quantity", editFields.quantity);
    if (selectedImages) {
      Array.from(selectedImages).forEach((file) => fd.append("images", file));
    }
    updateProduct.mutate({ id: editId, formData: fd });
    setEditId(null);
    setSelectedImages(null);
  };

  if (isLoading) return <div>Loading...</div>;

  const pageCount = Math.ceil(products.length / PAGE_SIZE);
  const currentPageItems = products.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  );

  // Render each row - simplified for react-virtuoso
  const itemContent = (index) => {
    const p = currentPageItems[index];
    if (!p) return null;
    
    return (
      <div className="p-4 border-b flex flex-col space-y-2 bg-white rounded shadow mb-2">
        {/* Images Carousel */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.isArray(p.images) && p.images.length > 0
            ? p.images.map((img, i) => {
                const src = img.startsWith("http")
                  ? img
                  : `${import.meta.env.VITE_API_URL}${img}`;
                return (
                  <div key={i} className="relative flex-shrink-0 w-28 h-28 group">
                    <img
                      src={src}
                      alt={`${p.title} ${i + 1}`}
                      className="w-full h-full object-cover rounded-md"
                      onError={(e) => {
                        e.target.src = "https://placehold.co/80x80?text=No+Image";
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-25 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 rounded-md transition">
                      <button
                        onClick={() => deleteImage(p.id, i)}
                        className="bg-red-500 text-white rounded px-2 py-1 text-xs hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            : (
              <div className="w-28 h-28 bg-gray-200 rounded-md flex items-center justify-center">
                <span className="text-gray-400 text-sm">No Image</span>
              </div>
            )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-1">
          <div className="font-semibold text-gray-800">{p.title}</div>
          <div className="text-gray-600 text-sm">Price: ₹{p.price}</div>
          <div className="text-gray-600 text-sm">Qty: {p.quantity}</div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => startEdit(p)}
              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => delProduct.mutate(p.id)}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Your Products</h2>

      {/* ✅ Using Virtuoso instead of react-window */}
      <div style={{ height: 600 }}>
        <Virtuoso
          totalCount={currentPageItems.length}
          itemContent={itemContent}
        />
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4 gap-2">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
          disabled={page === 0}
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="px-2 py-1">
          Page {page + 1} of {pageCount}
        </span>
        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, pageCount - 1))}
          disabled={page >= pageCount - 1}
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Edit & Upload Section */}
      {editId && (
        <div className="mt-6 p-4 border rounded-lg shadow-md bg-white max-w-xl">
          <h3 className="text-xl font-semibold mb-3">Edit Product</h3>
          <div className="space-y-3">
            <input
              value={editFields.title}
              onChange={(e) =>
                setEditFields({ ...editFields, title: e.target.value })
              }
              className="border rounded px-3 py-2 w-full"
              placeholder="Title"
            />
            <input
              type="number"
              value={editFields.price}
              onChange={(e) =>
                setEditFields({ ...editFields, price: e.target.value })
              }
              className="border rounded px-3 py-2 w-full"
              placeholder="Price"
            />
            <input
              type="number"
              value={editFields.quantity}
              onChange={(e) =>
                setEditFields({ ...editFields, quantity: e.target.value })
              }
              className="border rounded px-3 py-2 w-full"
              placeholder="Quantity"
            />
            <input
              type="file"
              multiple
              onChange={(e) => setSelectedImages(e.target.files)}
              className="border rounded px-3 py-2 w-full"
            />
            <div className="flex gap-2">
              <button
                onClick={submitEdit}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditId(null);
                  setSelectedImages(null);
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
