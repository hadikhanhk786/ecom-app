import React, { useState } from "react";
import api from "../api/axios";
import { useMutation, useQueryClient } from "react-query";

export default function AddProductForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [specs, setSpecs] = useState("{}");
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const qc = useQueryClient();

  const mutation = useMutation(
    (formData) =>
      api.post("/seller/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    {
      onSuccess: () => {
        qc.invalidateQueries("sellerProducts");
        setTitle("");
        setDescription("");
        setPrice("");
        setQuantity(0);
        setSpecs("{}");
        setImages([]);
        setPreview([]);
      },
    }
  );

  const handleFiles = (files) => {
    setImages(files);
    setPreview(Array.from(files).map((f) => URL.createObjectURL(f)));
  };

  const submit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    fd.append("price", price);
    fd.append("quantity", quantity);
    fd.append("specs", specs);
    if (images) Array.from(images).forEach((f) => fd.append("images", f));
    mutation.mutate(fd);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full border rounded px-2 py-1"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="w-full border rounded px-2 py-1"
      />
      <div className="grid grid-cols-3 gap-2">
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price"
          className="border rounded px-2 py-1"
          required
        />
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Quantity"
          className="border rounded px-2 py-1"
          required
        />
        <input
          value={specs}
          onChange={(e) => setSpecs(e.target.value)}
          placeholder='Specs JSON e.g. {"color":"red"}'
          className="border rounded px-2 py-1"
        />
      </div>
      <input
        type="file"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex gap-2 flex-wrap">
        {preview.map((src, i) => (
          <img
            key={i}
            src={src}
            alt="preview"
            className="w-16 h-16 object-cover rounded"
          />
        ))}
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Add Product
      </button>
    </form>
  );
}
