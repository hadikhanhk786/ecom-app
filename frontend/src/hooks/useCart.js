import { useQuery, useMutation, useQueryClient } from "react-query";
import api from "../api/axios";

export function useCart() {
  const queryClient = useQueryClient();

  const { data: cart = [], refetch } = useQuery("cart", async () => {
    // const { data } = await api.get('/buyer/cart'); // returns [{ productId, quantity }]
    const buyer = JSON.parse(localStorage.getItem("buyer"));
    const { data } = await api.get(`/buyer/cart/${buyer.id}`);

    // Fetch product details for each cart item
    const fullItems = await Promise.all(
      data.map(async (item) => {
        const { data: product } = await api.get(`/products/${item.product_id}`);
        return {
          id: item.id,
          productId: item.product_id,
          title: product.title,
          price: product.price,
          quantity: item.quantity,
          image: product.images && product.images[0] ? product.images[0] : null,
        };
      })
    );

    return fullItems;
  });

  const addMutation = useMutation(
    async ({ productId, quantity }) => {
      const buyer = JSON.parse(localStorage.getItem("buyer"));
      return await api.post("/buyer/cart", {
        buyerId: buyer.id,
        productId,
        quantity,
      });
    },
    {
      // Optimistic update before mutation runs
      onMutate: async ({ productId, quantity }) => {
        await queryClient.cancelQueries("cart");

        const previousCart = queryClient.getQueryData("cart");

        // Optimistically update UI
        queryClient.setQueryData("cart", (old = []) => {
          const existing = old.find((item) => item.productId === productId);
          if (existing) {
            return old.map((item) =>
              item.productId === productId ? { ...item, quantity } : item
            );
          }
          return [...old, { productId, quantity }];
        });

        // Return context for rollback
        return { previousCart };
      },

      // If error → rollback to previous state
      onError: (err, _variables, context) => {
        if (context?.previousCart) {
          queryClient.setQueryData("cart", context.previousCart);
        }
        alert(err.response?.data?.message || "Failed to update cart");
      },

      // Always refetch latest cart state
      onSettled: () => {
        queryClient.invalidateQueries("cart");
      },
    }
  );

  const removeMutation = useMutation(
    async (cartItemId) => {
      return await api.delete(`/buyer/cart/${cartItemId}`);
    },
    {
      onSuccess: () => queryClient.invalidateQueries("cart"),
    }
  );

  return { cart, addMutation, removeMutation, fetchCart: refetch };
}
