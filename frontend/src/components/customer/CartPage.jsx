import React, { useState, useEffect, useLayoutEffect } from "react";
import { useDispatch } from "react-redux";
import { setCart, clearCart } from "../../features/cart/cartSlice";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { useQuery, useMutation, useQueryClient } from "react-query";
import api from "../../api/axios";
import { debounce } from "lodash";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const INDIA_STATES = [
  { state: "Maharashtra", cities: ["Mumbai", "Pune", "Nagpur"] },
  { state: "Karnataka", cities: ["Bengaluru", "Mysore", "Mangalore"] },
  { state: "Delhi", cities: ["New Delhi", "Dwarka", "Rohini"] },
  { state: "Tamil Nadu", cities: ["Chennai", "Coimbatore", "Madurai"] },
  { state: "Gujarat", cities: ["Ahmedabad", "Surat", "Vadodara"] },
];

export default function CartPage() {
  const { cart, addMutation, removeMutation } = useCart();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const buyer = JSON.parse(localStorage.getItem("buyer"));

  const [selectedAddress, setSelectedAddress] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "",
    address: "",
    state: "",
    city: "",
    pincode: "",
    mobile_number: "",
  });
  const [cities, setCities] = useState([]);
  const [localQuantities, setLocalQuantities] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [selectedCard, setSelectedCard] = useState(null);
  const [useNewCard, setUseNewCard] = useState(false);
  const [globalError, setGlobalError] = useState("");
//   const [stripePromise, setStripePromise] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
//   const stripe = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
//         console.log(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
//         setStripePromise(stripe);
  // Initialize Stripe on component mount
//   useLayoutEffect(() => {
//     const loadStripeJs = async () => {
//       try {
//         const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
//         console.log(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
//         setStripePromise(stripe);
//       } catch (error) {
//         console.error('Stripe loading error:', error);
//         setGlobalError('Payment system initialization failed');
//       } finally {
//         setIsLoading(false);
//       }
//     };
    
//     loadStripeJs();
//   }, []);

  useEffect(() => {
    if (!cart.length) return; // avoid running on empty cart
    const initialQuantities = cart.reduce((acc, item) => {
      acc[item.productId] = item.quantity;
      return acc;
    }, {});
    setLocalQuantities(initialQuantities);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // empty dependency array

  // Fetch addresses
  const { data: addresses = [] } = useQuery("addresses", async () => {
    const { data } = await api.get("/buyer/addresses");
    return data;
  });

  // Fetch saved cards
  const { data: savedCards = [] } = useQuery(
    ["savedCards", buyer.id],
    async () => {
      const { data } = await api.get(`/payments/saved-cards/${buyer.id}`);
      return data;
    }
  );
  console.log("Saved cards:", savedCards);
  // Debounced quantity update
  const debouncedUpdateQuantity = debounce((productId, quantity) => {
    addMutation.mutate(
      { buyerId: buyer.id, productId, quantity },
      {
        onError: (err) =>
          setGlobalError(
            err.response?.data?.message || "Failed to update quantity"
          ),
      }
    );
  }, 500);

  // Save new address mutation
  const saveAddressMutation = useMutation(
    async () => {
      if (
        !newAddress.address ||
        !newAddress.city ||
        !newAddress.state ||
        !newAddress.pincode ||
        !newAddress.mobile_number
      )
        throw new Error("Please fill all required fields");
      return await api.post("/buyer/addresses", newAddress);
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries("addresses");
        setSelectedAddress(data.data.id);
        setAddingNew(false);
        setNewAddress({
          name: "",
          address: "",
          state: "",
          city: "",
          pincode: "",
          mobile_number: "",
        });
        setGlobalError("");
      },
      onError: (err) =>
        setGlobalError(err.response?.data?.message || err.message),
    }
  );

  // Place order mutation
  const placeOrderMutation = useMutation(
    async ({ method, paymentMethodId }) => {
      if (!selectedAddress) throw new Error("Please select an address");
      const { data } = await api.post(`/payments/${method}`, {
        buyerId: buyer.id,
        items: cart,
        addressId: selectedAddress,
        paymentMethodId,
      });
      return data;
    },
    {
      onSuccess: (data, variables) => {
    //      api.post("/payments/attach-card", {
    //     buyerId: buyer.id, // replace with buyer.id from Redux
    //     paymentMethodId: variables.paymentMethodId,
    //   });
        dispatch(clearCart());
        queryClient.invalidateQueries("buyerOrders");
        navigate("/buyer/orders");
      },
      onError: (err) => setGlobalError(err.message),
    }
  );

  // Update cities when state changes
  useEffect(() => {
    const stateObj = INDIA_STATES.find((s) => s.state === newAddress.state);
    setCities(stateObj?.cities || []);
    setNewAddress((prev) => ({ ...prev, city: "" }));
  }, [newAddress.state]);

  if (!cart.length) return <div className="mt-20 p-4">Your cart is empty.</div>;

  return (
    <div className="max-w-3xl mx-auto mt-20 p-4 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
      {globalError && (
        <div className="bg-red-100 text-red-700 p-2 mb-2 rounded">
          {globalError}
        </div>
      )}

      {/* Cart Items */}
      <ul className="space-y-2">
        {cart.map((item) => (
          <li
            key={item.id}
            className="flex justify-between items-center border-b pb-2"
          >
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-gray-600">
                ₹{item.price} ×
                <input
                  type="number"
                  min={1}
                  max={item.stock || 9999}
                  value={localQuantities[item.productId] || item.quantity}
                  onChange={(e) => {
                    const newQty = Math.min(
                      Math.max(1, Number(e.target.value)),
                      item.stock || 9999
                    );
                    setLocalQuantities((prev) => ({
                      ...prev,
                      [item.productId]: newQty,
                    }));
                    debouncedUpdateQuantity(item.productId, newQty);
                  }}
                  className="w-16 border rounded px-1 py-0.5 ml-1"
                />
              </div>
            </div>
            <button
              onClick={() =>
                removeMutation.mutate(item.id, {
                  onError: (err) =>
                    setGlobalError(
                      err.response?.data?.message || "Failed to remove item"
                    ),
                })
              }
              className="text-red-500 font-bold"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {/* Delivery Addresses */}
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Select Delivery Address</h3>
        {!addingNew &&
          addresses.length > 0 &&
          addresses.map((addr) => (
            <label
              key={addr.id}
              className="flex items-center space-x-2 border p-2 rounded cursor-pointer"
            >
              <input
                type="radio"
                name="selectedAddress"
                value={addr.id}
                checked={selectedAddress === addr.id}
                onChange={() => setSelectedAddress(addr.id)}
              />
              <span>
                {addr.name ? addr.name + ", " : ""}
                {addr.address}, {addr.city}, {addr.state} - {addr.pincode} (
                {addr.mobile_number})
              </span>
            </label>
          ))}
        {!addingNew && (
          <button
            onClick={() => {
              setAddingNew(true);
              setSelectedAddress("");
            }}
            className="px-4 py-2 bg-gray-200 text-black rounded mb-2"
          >
            Add New Address
          </button>
        )}
        {addingNew && (
          <div className="mb-2">
            <button
              onClick={() => {
                setAddingNew(false);
                setNewAddress({
                  name: "",
                  address: "",
                  state: "",
                  city: "",
                  pincode: "",
                  mobile_number: "",
                });
              }}
              className="px-3 py-1 bg-gray-300 text-black rounded mb-2"
            >
              ← Back
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                placeholder="Name"
                value={newAddress.name}
                onChange={(e) =>
                  setNewAddress((prev) => ({ ...prev, name: e.target.value }))
                }
                className="border rounded px-2 py-1"
              />
              <input
                placeholder="Address"
                value={newAddress.address}
                onChange={(e) =>
                  setNewAddress((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                className="border rounded px-2 py-1"
              />
              <select
                value={newAddress.state}
                onChange={(e) =>
                  setNewAddress((prev) => ({ ...prev, state: e.target.value }))
                }
                className="border rounded px-2 py-1"
              >
                <option value="">Select State</option>
                {INDIA_STATES.map((s) => (
                  <option key={s.state} value={s.state}>
                    {s.state}
                  </option>
                ))}
              </select>
              <select
                value={newAddress.city}
                onChange={(e) =>
                  setNewAddress((prev) => ({ ...prev, city: e.target.value }))
                }
                className="border rounded px-2 py-1"
                disabled={!cities.length}
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <input
                placeholder="Pincode"
                value={newAddress.pincode}
                onChange={(e) =>
                  setNewAddress((prev) => ({
                    ...prev,
                    pincode: e.target.value,
                  }))
                }
                className="border rounded px-2 py-1"
              />
              <input
                placeholder="Mobile"
                value={newAddress.mobile_number}
                onChange={(e) =>
                  setNewAddress((prev) => ({
                    ...prev,
                    mobile_number: e.target.value,
                  }))
                }
                className="border rounded px-2 py-1"
              />
            </div>
            <button
              onClick={() => saveAddressMutation.mutate()}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
            >
              Save Address
            </button>
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Payment Method</h3>
        
        {/* Payment method selection */}
        <div className="space-y-2 mb-4">
          <label className="flex items-center space-x-2 border p-2 rounded cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              checked={paymentMethod === "cod"}
              onChange={() => setPaymentMethod("cod")}
            />
            <span>Cash on Delivery</span>
          </label>
          <label className="flex items-center space-x-2 border p-2 rounded cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === "card"}
              onChange={() => setPaymentMethod("card")}
            />
            <span>Card Payment</span>
          </label>
        </div>

        {/* Stripe Elements */}
        {paymentMethod === "card" && (
          <>
            {isLoading ? (
              <div className="text-center py-4">Loading payment system...</div>
            ) : stripePromise ? (
              <Elements stripe={stripePromise}>
                <StripeForm
                  savedCards={savedCards['cards'] || []}
                  useNewCard={useNewCard}
                  setUseNewCard={setUseNewCard}
                  selectedCard={selectedCard}
                  setSelectedCard={setSelectedCard}
                  placeOrderMutation={placeOrderMutation}
                />
              </Elements>
            // <Elements stripe={stripePromise}>
            //   <CardPaymentForm
            //     cart={cart}
            //     addressId={selectedAddress}
            //     buyerId={buyer.id}
            //     onSuccess={() => {
            //       dispatch(clearCart());
            //       navigate("/buyer/orders");
            //     }}
            //   />
            // </Elements>
            ) : (
              <div className="text-red-500 py-4">
                Payment system failed to initialize. Please try again later.
              </div>
            )}
          </>
        )}
      </div>

      <button
        onClick={() =>
          placeOrderMutation.mutate({
            method: paymentMethod,
            paymentMethodId: selectedCard?.id,
          })
        }
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Place Order
      </button>
    </div>
  );
}

function StripeForm({
  savedCards,
  useNewCard,
  setUseNewCard,
  selectedCard,
  setSelectedCard,
  placeOrderMutation,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");

  const handlePayment = async () => {
    try {
      if (useNewCard) {
        const cardElement = elements.getElement(CardElement);
        const { paymentMethod, error: pmError } =
          await stripe.createPaymentMethod({ type: "card", card: cardElement });
        if (pmError) throw pmError;
        await placeOrderMutation.mutateAsync({
          method: "card",
          paymentMethodId: paymentMethod.id,
        });
      } else if (selectedCard) {
        await placeOrderMutation.mutateAsync({
          method: "card",
          paymentMethodId: selectedCard.id,
        });
      } else {
        setError("Please select or add a card");
      }
    } catch (err) {
      setError(err.message || "Payment failed");
    }
  };
  console.log("Selected card:", selectedCard, "Use new card:", useNewCard);
  return (
    <div className="border p-2 rounded">
      {savedCards.length > 0 && (
        <div className="space-y-1 mb-2">
          {savedCards.map((card) => (
            <label
              key={card.id}
              className="flex items-center space-x-2 border p-2 rounded cursor-pointer"
            >
              <input
                type="radio"
                name="savedCard"
                value={card.id}
                checked={selectedCard?.id === card.id && !useNewCard}
                onChange={() => {
                  setSelectedCard(card);
                  setUseNewCard(false);
                }}
              />
              <span>
                {card.brand} ****{card.last4} (Exp: {card.exp_month}/
                {card.exp_year})
              </span>
            </label>
          ))}
          <label className="flex items-center space-x-2 border p-2 rounded cursor-pointer">
            <input
              type="radio"
              name="savedCard"
              checked={useNewCard}
              onChange={() => setUseNewCard(true)}
            />
            <span>Use a new card</span>
          </label>
        </div>
      )} 
      <label className="flex items-center space-x-2 border p-2 rounded cursor-pointer">
            <input
              type="checkbox"
              name="savedCard"
              checked={useNewCard}
              onChange={() => setUseNewCard((prev) => !prev)}
            />
            <span>Use a new card</span>
          </label>
      {useNewCard && <CardElement className="border p-2 rounded mb-2" />}
      {error && <div className="text-red-500 text-sm mb-1">{error}</div>}
      {useNewCard && (
        <button
          onClick={handlePayment}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Pay
        </button>
      )}
    </div>
  );
}
