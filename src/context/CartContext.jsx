import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { toast } from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const CartContext = createContext(null);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getProductImage = (product, variant = null) => {
  if (
    variant?.images &&
    Array.isArray(variant.images) &&
    variant.images.length > 0
  ) {
    return variant.images[0];
  }

  if (product?.media?.thumbnail) {
    return product.media.thumbnail;
  }

  if (
    product?.media?.images &&
    Array.isArray(product.media.images) &&
    product.media.images.length > 0
  ) {
    return product.media.images[0];
  }

  if (Array.isArray(product?.variants)) {
    const variantWithImage = product.variants.find(
      (item) => Array.isArray(item.images) && item.images.length > 0
    );

    if (variantWithImage) {
      return variantWithImage.images[0];
    }
  }

  return "";
};

const getDefaultVariant = (product) => {
  if (
    !product?.variants ||
    !Array.isArray(product.variants) ||
    product.variants.length === 0
  ) {
    return null;
  }

  return (
    product.variants.find((variant) => variant.isActive !== false) || null
  );
};

/*
|--------------------------------------------------------------------------
| API helper
|--------------------------------------------------------------------------
*/

const fetchCart = async (token) => {
  const res = await fetch(`${BACKEND_URL}/api/cart`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || "Failed to fetch cart");
  }

  return data.items || data.cart?.items || [];
};

/*
|--------------------------------------------------------------------------
| Provider
|--------------------------------------------------------------------------
*/

function CartProvider({ children }) {
  const queryClient = useQueryClient();

  /*
  |--------------------------------------------------------------------------
  | TOKEN
  |--------------------------------------------------------------------------
  */

  const [token, setToken] = useState(() => localStorage.getItem("token"));

  /*
  |--------------------------------------------------------------------------
  | Listen for login/logout token changes
  |--------------------------------------------------------------------------
  |
  | Keeps the same behavior as the original context.
  |
  */

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CART QUERY
  |--------------------------------------------------------------------------
  |
  | The cart is cached per logged-in user token.
  |
  | Example:
  |   User opens Cart page -> API request
  |   User goes Product -> no request
  |   User comes back to Cart -> cached data
  |
  */

  const cartQuery = useQuery({
    queryKey: ["cart", token],
    queryFn: () => fetchCart(token),
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const cartItem = token ? cartQuery.data ?? [] : [];

  /*
  |--------------------------------------------------------------------------
  | Small helper to update the cache immediately
  |--------------------------------------------------------------------------
  */

  const updateCartFromResponse = useCallback(
    (data) => {
      const items = data?.cart?.items || data?.items || [];

      queryClient.setQueryData(["cart", token], items);

      return items;
    },
    [queryClient, token]
  );

  /*
  |--------------------------------------------------------------------------
  | ADD TO CART
  |--------------------------------------------------------------------------
  */

  const addToCart = useCallback(
    async (product, selectedVariant = null, quantity = 1) => {
      if (!token) {
        toast.error("Please login first");
        return;
      }

      if (!product?._id) {
        toast.error("Invalid product");
        return;
      }

      let variant = selectedVariant;

      if (!variant) {
        variant = getDefaultVariant(product);
      }

      if (product.productType === "variable" && !variant) {
        toast.error("Please select a product variant");
        return;
      }

      const variantSku = variant?.sku || "";

      const exists = cartItem.some(
        (item) =>
          String(item.productId) === String(product._id) &&
          item.variantSku === variantSku
      );

      if (exists) {
        toast("Product already in cart", {
          icon: "🛒",
        });
        return;
      }

      if (
        variant &&
        Number(quantity) > Number(variant.stock || 0)
      ) {
        toast.error(`Only ${variant.stock} item(s) available`);
        return;
      }

      const payload = {
        productId: product._id,
        variantSku,
        quantity: Number(quantity),
        image: getProductImage(product, variant),
      };

      try {
        const res = await fetch(`${BACKEND_URL}/api/cart/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          toast.error(
            data.message || data.error || "Failed to add item"
          );
          return;
        }

        updateCartFromResponse(data);

        toast.success("Added to cart 🛒");
      } catch (error) {
        console.error("ADD TO CART ERROR:", error);
        toast.error("Failed to add item");
      }
    },
    [token, cartItem, updateCartFromResponse]
  );

  /*
  |--------------------------------------------------------------------------
  | INCREASE QUANTITY
  |--------------------------------------------------------------------------
  */

  const increaseQty = useCallback(
    async (productId, variantSku = "") => {
      if (!token) {
        toast.error("Please login first");
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/api/cart/increase`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: String(productId),
            variantSku: variantSku || "",
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          toast.error(
            data.message ||
              data.error ||
              "Failed to increase quantity"
          );
          return;
        }

        updateCartFromResponse(data);
      } catch (error) {
        console.error("INCREASE ERROR:", error);
        toast.error("Failed to increase quantity");
      }
    },
    [token, updateCartFromResponse]
  );

  /*
  |--------------------------------------------------------------------------
  | DECREASE QUANTITY
  |--------------------------------------------------------------------------
  */

  const decreaseQty = useCallback(
    async (productId, variantSku = "") => {
      if (!token) {
        toast.error("Please login first");
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/api/cart/decrease`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: String(productId),
            variantSku: variantSku || "",
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          toast.error(
            data.message ||
              data.error ||
              "Failed to decrease quantity"
          );
          return;
        }

        updateCartFromResponse(data);
      } catch (error) {
        console.error("DECREASE ERROR:", error);
        toast.error("Failed to decrease quantity");
      }
    },
    [token, updateCartFromResponse]
  );

  /*
  |--------------------------------------------------------------------------
  | REMOVE FROM CART
  |--------------------------------------------------------------------------
  */

  const removeFromCart = useCallback(
    async (productId, variantSku = "") => {
      if (!token) {
        toast.error("Please login first");
        return false;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/api/cart/remove`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: String(productId),
            variantSku: variantSku || "",
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          toast.error(
            data.message || data.error || "Failed to remove item"
          );
          return false;
        }

        updateCartFromResponse(data);

        toast.success("Item removed 🗑️");

        return true;
      } catch (error) {
        console.error("REMOVE CART ERROR:", error);
        toast.error("Failed to remove item");
        return false;
      }
    },
    [token, updateCartFromResponse]
  );

  /*
  |--------------------------------------------------------------------------
  | CLEAR CART
  |--------------------------------------------------------------------------
  */

  const clearCart = useCallback(async () => {
    if (!token) {
      queryClient.setQueryData(["cart", token], []);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/cart/clear`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(
          data.message || "Failed to clear cart"
        );
        return;
      }

      queryClient.setQueryData(["cart", token], []);

      toast.success("Cart cleared");
    } catch (error) {
      console.error("Clear cart failed:", error);
      toast.error("Failed to clear cart");
    }
  }, [token, queryClient]);

  /*
  |--------------------------------------------------------------------------
  | DERIVED VALUES
  |--------------------------------------------------------------------------
  */

  const cartTotal = useMemo(
    () =>
      cartItem.reduce(
        (total, item) =>
          total +
          Number(item.price || 0) *
            Number(item.quantity || 0),
        0
      ),
    [cartItem]
  );

  const cartCount = useMemo(
    () =>
      cartItem.reduce(
        (total, item) =>
          total + Number(item.quantity || 0),
        0
      ),
    [cartItem]
  );

  /*
  |--------------------------------------------------------------------------
  | PROVIDER VALUE
  |--------------------------------------------------------------------------
  */

  const contextValue = useMemo(
    () => ({
      cartItem,
      addToCart,
      removeFromCart,
      increaseQty,
      decreaseQty,
      clearCart,
      cartTotal,
      cartCount,
      token,

      // Optional query status for Cart page / loader UI.
      cartLoading: cartQuery.isLoading,
      cartFetching: cartQuery.isFetching,
      cartError: cartQuery.error?.message || null,
      refetchCart: cartQuery.refetch,
    }),
    [
      cartItem,
      addToCart,
      removeFromCart,
      increaseQty,
      decreaseQty,
      clearCart,
      cartTotal,
      cartCount,
      token,
      cartQuery.isLoading,
      cartQuery.isFetching,
      cartQuery.error,
      cartQuery.refetch,
    ]
  );

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export default CartProvider;

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
};
